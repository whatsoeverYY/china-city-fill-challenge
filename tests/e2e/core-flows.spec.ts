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
