import { expect, test, type Page } from "@playwright/test";

async function expectNoHorizontalOverflow(page: Page) {
  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  expect(hasOverflow).toBe(false);
}

test("desktop home map opens a province challenge", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/");

  await expect(page.getByRole("heading", {
    name: "从一省出发，拼出整幅中国城市地图",
  })).toBeVisible();
  await expect(page.locator('svg path[role="button"]')).toHaveCount(34);
  await expectNoHorizontalOverflow(page);

  await page.getByRole("button", { name: "江苏省，未完成" }).click();
  await expect(page).toHaveURL(/\/city-fill\/320000$/);
  await expect(page.getByRole("heading", {
    name: "江苏，你认识多少座城？",
  })).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("query settings open the joined manual challenge directly", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/city-fill/320000?scope=neighbors&answer=manual");

  await expect(page.getByRole("heading", {
    name: "江苏与邻省，连城共答",
  })).toBeVisible();
  await expect(page.getByText("联合区域地图", { exact: true })).toBeVisible();
  await expect(page.getByText("邻省连城 · 无提示", { exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("mobile account control does not cover the primary answer action", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/gauntlet/province-shape");

  const accountButton = page.locator(".account-fab");
  const submitButton = page.getByRole("button", { name: "提交答案" });
  await expect(accountButton).toBeVisible();
  await expect(submitButton).toBeVisible();
  await expectNoHorizontalOverflow(page);

  const accountBox = await accountButton.boundingBox();
  const submitBox = await submitButton.boundingBox();
  expect(accountBox).not.toBeNull();
  expect(submitBox).not.toBeNull();
  if (!accountBox || !submitBox) return;

  const overlapWidth = Math.max(
    0,
    Math.min(accountBox.x + accountBox.width, submitBox.x + submitBox.width) -
      Math.max(accountBox.x, submitBox.x),
  );
  const overlapHeight = Math.max(
    0,
    Math.min(accountBox.y + accountBox.height, submitBox.y + submitBox.height) -
      Math.max(accountBox.y, submitBox.y),
  );
  expect(overlapWidth * overlapHeight).toBe(0);
});

test("account dialog focuses content, closes with Escape, and restores focus", async ({
  page,
}) => {
  await page.goto("/");

  const accountButton = page.locator(".account-fab");
  await expect(page.locator('svg path[role="button"]')).toHaveCount(34);
  await accountButton.click();
  const dialog = page.getByRole("dialog", { name: /登录后|欢迎回来/ });
  await expect(dialog).toBeVisible();

  const emailInput = page.locator("#account-email");
  if (await emailInput.count()) {
    await expect(emailInput).toBeFocused();
  } else {
    await expect(dialog.getByRole("button", { name: "关闭账户面板" }))
      .toBeFocused();
  }

  const closeButton = dialog.getByRole("button", { name: "关闭账户面板" });
  await closeButton.focus();
  await page.keyboard.press("Shift+Tab");
  expect(await dialog.evaluate((element) =>
    element.contains(document.activeElement)
  )).toBe(true);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(accountButton).toBeFocused();
});

test("plate city map loads only the selected province detail map", async ({
  page,
}) => {
  const detailMapCodes: string[] = [];
  page.on("request", (request) => {
    const code = request.url().match(/\/data\/maps\/(\d{6})\.json(?:\?|$)/)?.[1];
    if (code && code !== "100000") detailMapCodes.push(code);
  });

  await page.goto("/gauntlet/plate-city-map");
  await expect(page.getByText("先选择一个高亮省份，省份选择不会判错"))
    .toBeVisible();
  expect(detailMapCodes).toEqual([]);

  await page.getByRole("button", { name: "江苏省，已选择" }).click();
  await expect(page.getByText("省内地图已载入，点击城市区块后才会判题"))
    .toBeVisible();
  expect(new Set(detailMapCodes)).toEqual(new Set(["320000"]));
});

test("Escape closes only the topmost stacked dialog", async ({ page }) => {
  await page.goto("/city-fill/320000?answer=manual");
  await page.getByRole("button", { name: "待填充区域" }).first().click();

  const answerDialog = page.getByRole("dialog", {
    name: "这里是什么城市或区县？",
  });
  await expect(answerDialog).toBeVisible();
  await page.locator(".account-fab").click();
  const accountDialog = page.getByRole("dialog", { name: /登录后|欢迎回来/ });
  await expect(accountDialog).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(accountDialog).toBeHidden();
  await expect(answerDialog).toBeVisible();
  await expect(page.locator("#manual-answer")).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");

  await page.keyboard.press("Escape");
  await expect(answerDialog).toBeHidden();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
});
