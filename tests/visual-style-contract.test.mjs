import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const ROOT = new URL("../", import.meta.url);

async function source(relativePath) {
  return readFile(new URL(relativePath, ROOT), "utf8");
}

function staticClassValue(fileSource, semanticClass) {
  const escapedClass = semanticClass.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const match = fileSource.match(new RegExp(
    `className="([^"]*\\b${escapedClass}\\b[^"]*)"`,
    "u",
  )) ?? fileSource.match(new RegExp(
    "className=\\{`([^`]*\\b" + escapedClass + "\\b[^`]*)`\\}",
    "u",
  ));
  assert.ok(match, `找不到 ${semanticClass} 的静态 className`);
  return match[1].split(/\s+/u);
}

function assertTokens(classList, requiredTokens, contractName) {
  for (const token of requiredTokens) {
    assert.ok(
      classList.includes(token),
      `${contractName} 缺少视觉契约 token：${token}`,
    );
  }
}

function assertSourceContainsAll(fileSource, requiredFragments, contractName) {
  for (const fragment of requiredFragments) {
    assert.ok(
      fileSource.includes(fragment),
      `${contractName} 缺少视觉契约片段：${fragment}`,
    );
  }
}

test("desktop visual foundations remain stable during refactors", async () => {
  const challengeHeader = await source(
    "src/features/city-challenge/components/challenge-header.tsx",
  );
  const atlas = await source("src/features/atlas/national-city-atlas.tsx");
  const gauntletLobby = await source(
    "src/features/gauntlet/components/gauntlet-lobby.tsx",
  );
  const knowledgeCatalog = await source(
    "src/features/knowledge/components/knowledge-catalog.tsx",
  );
  const knowledgeBase = await source(
    "src/features/knowledge/knowledge-base.tsx",
  );
  const admin = await source("src/features/admin/admin-dashboard.tsx");

  assertTokens(
    staticClassValue(challengeHeader, "site-header"),
    [
      "flex",
      "min-h-[62px]",
      "items-center",
      "justify-between",
      "border-b",
      "pb-[22px]",
    ],
    "首页桌面头部",
  );
  assertTokens(
    staticClassValue(challengeHeader, "brand-seal"),
    [
      "size-[45px]",
      "-rotate-2",
      "rounded-[9px_9px_9px_3px]",
      "bg-city-500",
      "font-serif",
    ],
    "首页品牌印章",
  );
  assertSourceContainsAll(
    challengeHeader,
    [
      "bg-atlas-100",
      "text-atlas-700",
      "bg-scholar-100",
      "text-scholar-600",
      "bg-gold-200",
      "text-gold-900",
      "font-numeric text-[23px] text-city-500",
    ],
    "首页彩色入口与进度",
  );
  assertTokens(
    staticClassValue(atlas, "city-atlas-header"),
    [
      "grid",
      "min-h-[82px]",
      "grid-cols-[minmax(0,1fr)_auto]",
      "gap-7",
      "px-[22px]",
      "py-3",
    ],
    "图鉴桌面头部",
  );
  assertTokens(
    staticClassValue(atlas, "city-atlas-canvas"),
    [
      "bg-paper-600",
      "[background-size:auto,24px_24px,24px_24px]",
    ],
    "图鉴纸张网格",
  );
  assertTokens(
    staticClassValue(gauntletLobby, "gauntlet-intro"),
    [
      "px-1",
      "pb-7",
      "pt-[52px]",
    ],
    "闯关桌面主视觉",
  );
  assertTokens(
    staticClassValue(gauntletLobby, "gauntlet-level-card"),
    [
      "min-h-[360px]",
      "rounded-[22px]",
      "bg-[rgba(251,248,240,.94)]",
      "[background-image:radial-gradient(circle_at_100%_0%,rgba(213,169,69,.18),transparent_16rem)]",
    ],
    "闯关关卡卡片",
  );
  assertTokens(
    staticClassValue(knowledgeCatalog, "knowledge-home-hero"),
    [
      "grid",
      "w-[min(1380px,calc(100%_-_48px))]",
      "grid-cols-[minmax(0,1.55fr)_minmax(280px,.45fr)]",
      "items-end",
    ],
    "知识馆桌面主视觉",
  );
  assertSourceContainsAll(
    knowledgeCatalog,
    [
      "font-numeric text-[58px] font-bold",
      "rounded-[17px_17px_17px_5px]",
      "bg-city-600",
      "bg-jade-500",
      "bg-atlas-500",
      "bg-gold-700",
      "bg-scholar-500",
    ],
    "知识馆数字、标签形状与专题配色",
  );
  assertTokens(
    staticClassValue(knowledgeBase, "knowledge-shell"),
    [
      "bg-paper-400",
      "[background-size:auto,auto,30px_30px,30px_30px]",
    ],
    "知识馆纸张网格",
  );
  assertTokens(
    staticClassValue(admin, "admin-shell"),
    ["min-h-dvh", "w-[min(1460px,calc(100%_-_48px))]", "pb-16", "pt-8"],
    "管理后台桌面外壳",
  );
});

test("major modules keep intentional mobile layouts", async () => {
  const challengeHeader = await source(
    "src/features/city-challenge/components/challenge-header.tsx",
  );
  const challengeSettings = await source(
    "src/features/city-challenge/components/challenge-settings.tsx",
  );
  const atlas = await source("src/features/atlas/national-city-atlas.tsx");
  const gauntletScreen = await source(
    "src/features/gauntlet/components/gauntlet-screen.tsx",
  );
  const knowledgeCatalog = await source(
    "src/features/knowledge/components/knowledge-catalog.tsx",
  );
  const admin = await source("src/features/admin/admin-dashboard.tsx");
  const neighborAnswer = await source(
    "src/features/gauntlet/components/province-neighbor-answer.tsx",
  );

  assertTokens(
    staticClassValue(challengeHeader, "site-header"),
    ["max-[1050px]:flex-wrap", "max-md:gap-5"],
    "首页移动头部",
  );
  assertSourceContainsAll(
    challengeHeader,
    [
      "max-md:grid",
      "max-md:grid-cols-2",
      "atlas-mode-button",
      "max-md:hidden",
      "max-sm:flex-col",
      "max-sm:rounded-xl",
    ],
    "首页移动操作区",
  );
  assertTokens(
    staticClassValue(challengeSettings, "challenge-settings"),
    [
      "grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)]",
      "max-[820px]:grid-cols-[auto_minmax(0,1fr)]",
      "max-sm:px-3",
    ],
    "省内挑战设置",
  );
  assertTokens(
    staticClassValue(atlas, "city-atlas-summary"),
    ["max-md:hidden"],
    "图鉴移动信息层级",
  );
  assertTokens(
    staticClassValue(atlas, "city-atlas-toolbar"),
    ["max-md:grid-cols-4", "max-md:items-center"],
    "图鉴移动操作栏",
  );
  assertSourceContainsAll(
    gauntletScreen,
    [
      "gauntlet-shell",
      "max-md:w-[min(680px,calc(100%_-_24px))]",
      "max-md:pb-24",
      "max-md:pt-[15px]",
    ],
    "闯关移动外壳",
  );
  assertTokens(
    staticClassValue(gauntletScreen, "gauntlet-header"),
    ["max-md:sticky", "max-md:top-0", "max-md:min-h-14", "max-md:bg-card/95"],
    "闯关移动面包屑头部",
  );
  assertSourceContainsAll(
    gauntletScreen,
    ["PageBreadcrumbs", '{ label: "首页"', '{ label: "过关斩将"'],
    "闯关页面面包屑",
  );
  assertTokens(
    staticClassValue(knowledgeCatalog, "knowledge-home-hero"),
    [
      "max-lg:grid-cols-1",
      "max-sm:w-[calc(100%_-_24px)]",
      "max-sm:pb-6",
      "max-sm:pt-7",
    ],
    "知识馆移动主视觉",
  );
  assertSourceContainsAll(
    knowledgeCatalog,
    [
      "max-sm:grid-cols-[44px_minmax(0,1fr)_auto]",
      "max-sm:min-h-0",
      "max-sm:p-3",
    ],
    "知识馆移动专题列表",
  );
  assertTokens(
    staticClassValue(admin, "admin-player-table"),
    ["max-sm:block", "max-sm:min-w-0"],
    "管理后台移动玩家卡片",
  );
  assertTokens(
    staticClassValue(neighborAnswer, "neighbor-text-options"),
    ["grid-cols-4", "max-sm:grid-cols-2", "overflow-y-auto"],
    "邻省关卡移动选项",
  );
});

test("presentation colors follow stable ids instead of labels or positions", async () => {
  const lobby = await source(
    "src/features/gauntlet/components/gauntlet-lobby.tsx",
  );
  const levelStyles = await source(
    "src/features/gauntlet/config/gauntlet-level-style.ts",
  );
  const knowledgeData = await source(
    "src/features/knowledge/data/knowledge-data.ts",
  );

  assert.ok(!lobby.includes("LEVEL_BADGE_CLASSES[index]"));
  assert.ok(lobby.includes("GAUNTLET_LEVEL_BADGE_CLASS[item.id]"));
  assert.ok(levelStyles.includes("Record<GauntletLevelId, string>"));
  assert.ok(levelStyles.includes("[GAUNTLET_LEVEL_ID.FINAL_BOSS]"));
  assert.ok(knowledgeData.includes("tone: KnowledgeTone"));
  assert.ok(knowledgeData.includes('tone: "red"'));
  assert.ok(knowledgeData.includes('tone: "green"'));
  assert.ok(knowledgeData.includes('tone: "blue"'));
  assert.ok(knowledgeData.includes('tone: "gold"'));
  assert.ok(knowledgeData.includes('tone: "purple"'));
});

test("project colors use named Tailwind palettes", async () => {
  const tailwindConfig = await source("tailwind.config.ts");
  const globals = await source("src/app/globals.css");
  const shades = [100, 200, 300, 400, 500, 600, 700, 800, 900];

  for (const palette of [
    "atlas",
    "city",
    "clay",
    "gold",
    "ink",
    "jade",
    "moss",
    "navy",
    "olive",
    "paper",
    "scholar",
    "stone",
  ]) {
    const match = tailwindConfig.match(
      new RegExp(`\\b${palette}:\\s*\\{([\\s\\S]*?)\\n\\s*\\},`, "u"),
    );
    assert.ok(match, `缺少 ${palette} Tailwind 色阶`);
    for (const shade of shades) {
      assert.match(match[1], new RegExp(`\\b${shade}:`, "u"));
    }
  }

  assert.ok(globals.includes('@config "../../tailwind.config.ts";'));
});

test("typography and text buttons follow named responsive scales", async () => {
  const tailwindConfig = await source("tailwind.config.ts");
  const challengeHeader = await source(
    "src/features/city-challenge/components/challenge-header.tsx",
  );
  const gauntletLobby = await source(
    "src/features/gauntlet/components/gauntlet-lobby.tsx",
  );
  const knowledgeCatalog = await source(
    "src/features/knowledge/components/knowledge-catalog.tsx",
  );
  const admin = await source("src/features/admin/admin-dashboard.tsx");

  for (const token of [
    "display",
    "display-mobile",
    "page",
    "page-mobile",
    "section",
    "section-mobile",
    "card-title",
    "card-title-mobile",
    "body",
    "body-mobile",
    "compact",
    "compact-mobile",
    "meta",
  ]) {
    assert.ok(tailwindConfig.includes(`"${token}":`), `缺少 ${token} 排版 token`);
  }
  assert.ok(
    tailwindConfig.includes('"display": ["clamp(36px, 2.1vw, 40px)"'),
    "桌面展示标题必须封顶 40px",
  );
  assertSourceContainsAll(
    challengeHeader,
    ["text-page", "max-md:text-page-mobile", "text-body", "py-2 text-compact"],
    "首页标题、正文和按钮",
  );
  assertSourceContainsAll(
    gauntletLobby,
    ["text-page", "max-sm:text-page-mobile", "text-card-title", "text-compact"],
    "闯关标题与卡片",
  );
  assertSourceContainsAll(
    knowledgeCatalog,
    ["text-display", "max-sm:text-display-mobile", "text-section", "text-card-title"],
    "知识馆排版层级",
  );
  assertSourceContainsAll(
    admin,
    [
      "text-page",
      "text-section",
      "py-2 text-compact",
      "inline-flex min-h-10 items-center justify-center",
    ],
    "管理页排版与按钮",
  );
});
