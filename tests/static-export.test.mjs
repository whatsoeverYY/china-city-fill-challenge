import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";

const exportRoot = new URL("../dist/client/", import.meta.url);

const provinceCodes = [
  "110000", "120000", "130000", "140000", "150000", "210000", "220000",
  "230000", "310000", "320000", "330000", "340000", "350000", "360000",
  "370000", "410000", "420000", "430000", "440000", "450000", "460000",
  "500000", "510000", "520000", "530000", "540000", "610000", "620000",
  "630000", "640000", "650000", "710000", "810000", "820000",
];

const gauntletLevelIds = [
  "province-shape", "city-province", "plate-place", "province-neighbors",
  "plate-completion", "city-map", "truth-flash", "neighbor-chain",
  "city-undercover", "region-map", "territory-groups", "geography-elimination",
  "plate-fault", "university-city", "confusable-cities", "province-city-count",
  "city-neighbors", "plate-city-map", "mistake-revenge", "final-boss",
];

const knowledgeCategoryIds = [
  "province-profile", "city-plate", "universities", "neighbors", "city-counts",
  "rivers", "territory", "confusable", "map-reading",
];

test("exports a GitHub Pages entry document", async () => {
  const html = await readFile(new URL("index.html", exportRoot), "utf8");

  assert.match(html, /<title>中国城市填充挑战<\/title>/i);
  assert.match(html, /中国城市填充挑战/);
  assert.match(html, /\/china-city-fill-challenge\//);
  assert.doesNotMatch(html, /http:\/\/localhost/);
});

test("exports the administrator dashboard route", async () => {
  const html = await readFile(new URL("admin.html", exportRoot), "utf8");

  assert.match(html, /<title>管理员后台｜中国城市填充挑战<\/title>/i);
  assert.match(html, /玩家与进度中心|正在确认管理员身份/);
});

test("exports every feature as an independently addressable route", async () => {
  const routes = [
    ["atlas.html", "全国车牌图鉴"],
    ["gauntlet.html", "过关斩将"],
    ["knowledge.html", "中国地理知识馆"],
  ];

  for (const [file, title] of routes) {
    const html = await readFile(new URL(file, exportRoot), "utf8");
    assert.match(html, new RegExp(`<title>${title}｜中国城市填充挑战</title>`, "i"));
  }
});

test("exports every province, gauntlet level, and knowledge topic route", async () => {
  const routeGroups = [
    ["city-fill", provinceCodes],
    ["gauntlet", gauntletLevelIds],
    ["knowledge", knowledgeCategoryIds],
  ];

  for (const [directory, ids] of routeGroups) {
    const exportedFiles = (await readdir(new URL(`${directory}/`, exportRoot)))
      .filter((file) => file.endsWith(".html"))
      .sort();
    assert.deepEqual(exportedFiles, ids.map((id) => `${id}.html`).sort());
  }

  const provinceHtml = await readFile(
    new URL("city-fill/440000.html", exportRoot),
    "utf8",
  );
  assert.match(provinceHtml, /<title>广东城市填图｜中国城市填充挑战<\/title>/i);
  assert.match(provinceHtml, /面包屑导航/);

  const gauntletHtml = await readFile(
    new URL("gauntlet/province-shape.html", exportRoot),
    "utf8",
  );
  assert.match(gauntletHtml, /<title>辨形识省｜过关斩将｜中国城市填充挑战<\/title>/i);
  assert.match(gauntletHtml, /第 1 关/);

  const knowledgeHtml = await readFile(
    new URL("knowledge/province-profile.html", exportRoot),
    "utf8",
  );
  assert.match(knowledgeHtml, /<title>省份全景名片｜地理知识馆｜中国城市填充挑战<\/title>/i);
  assert.match(knowledgeHtml, /省份全景名片/);
});

test("copies static maps and disables Jekyll processing", async () => {
  await Promise.all([
    access(new URL(".nojekyll", exportRoot)),
    access(new URL("data/maps/100000.json", exportRoot)),
    access(new URL("data/maps/820000.json", exportRoot)),
    access(new URL("favicon.svg", exportRoot)),
    access(new URL("og.png", exportRoot)),
  ]);

  const xinjiangMap = JSON.parse(
    await readFile(new URL("data/maps/650000.json", exportRoot), "utf8"),
  );
  assert.equal(xinjiangMap.features.length, 27);
  assert.deepEqual(
    xinjiangMap.features.slice(-3).map((feature) => feature.properties.name),
    ["新星市", "白杨市", "草湖市"],
  );
});
