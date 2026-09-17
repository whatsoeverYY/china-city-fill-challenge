import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const ROOT = new URL("../", import.meta.url);

async function source(relativePath) {
  return readFile(new URL(relativePath, ROOT), "utf8");
}

function staticClassValue(fileSource, semanticClass) {
  const escapedClass = semanticClass.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const pattern = new RegExp(
    `className="([^"]*\\b${escapedClass}\\b[^"]*)"`,
    "u",
  );
  const match = fileSource.match(pattern);
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
  const admin = await source("src/features/admin/admin-dashboard.tsx");

  assertTokens(
    staticClassValue(challengeHeader, "site-header"),
    ["mb-8", "flex", "items-center", "justify-between", "gap-5"],
    "首页桌面头部",
  );
  assertTokens(
    staticClassValue(atlas, "city-atlas-header"),
    [
      "grid",
      "min-h-[82px]",
      "grid-cols-[auto_minmax(0,1fr)_auto]",
      "gap-7",
      "px-5",
      "py-3",
    ],
    "图鉴桌面头部",
  );
  assertTokens(
    staticClassValue(gauntletLobby, "gauntlet-intro"),
    [
      "rounded-[30px_30px_30px_9px]",
      "bg-gradient-to-br",
      "from-ink",
      "to-[#3b243d]",
      "shadow-xl",
    ],
    "闯关桌面主视觉",
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
    ["max-md:flex-col", "max-md:items-stretch"],
    "首页移动头部",
  );
  assertTokens(
    staticClassValue(challengeHeader, "header-actions"),
    ["max-md:grid", "max-md:grid-cols-2"],
    "首页移动操作区",
  );
  assertTokens(
    staticClassValue(atlas, "city-atlas-summary"),
    ["max-md:hidden"],
    "图鉴移动信息层级",
  );
  assertTokens(
    staticClassValue(gauntletScreen, "gauntlet-shell"),
    ["max-md:px-3", "max-md:pb-24", "max-md:pt-3"],
    "闯关移动外壳",
  );
  assertTokens(
    staticClassValue(knowledgeCatalog, "knowledge-home-hero"),
    ["max-lg:grid-cols-1", "max-sm:w-[calc(100%_-_24px)]", "max-sm:py-10"],
    "知识馆移动主视觉",
  );
  assertTokens(
    staticClassValue(admin, "admin-player-table"),
    ["max-sm:block", "max-sm:min-w-0"],
    "管理后台移动玩家卡片",
  );
  assertTokens(
    staticClassValue(neighborAnswer, "neighbor-text-options"),
    ["max-sm:grid-cols-1"],
    "邻省关卡移动选项",
  );
});
