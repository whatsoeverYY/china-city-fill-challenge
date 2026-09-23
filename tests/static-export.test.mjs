import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";

const exportRoot = new URL(
  "../dist/client/china-city-fill-challenge/",
  import.meta.url,
);

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

const worldLevelIds = [
  "world-map-country-names",
  "world-country-shapes",
];

test("exports a GitHub Pages entry document", async () => {
  const html = await readFile(new URL("index.html", exportRoot), "utf8");

  assert.match(html, /<title>中国城市填充挑战<\/title>/i);
  assert.match(html, /中国城市填充挑战/);
  assert.match(html, /\/china-city-fill-challenge\//);
  assert.match(html, /href="\/china-city-fill-challenge\/atlas\/"/);
  assert.match(html, /href="\/china-city-fill-challenge\/gauntlet\/"/);
  assert.match(html, /href="\/china-city-fill-challenge\/knowledge\/"/);
  assert.doesNotMatch(html, /href="\/china-city-fill-challenge\/world\/"/);
  assert.doesNotMatch(html, /http:\/\/localhost/);
});

test("exports the administrator dashboard route", async () => {
  const html = await readFile(new URL("admin/index.html", exportRoot), "utf8");

  assert.match(html, /<title>管理员后台｜中国城市填充挑战<\/title>/i);
  assert.match(html, /玩家与进度中心|正在确认管理员身份/);
});

test("exports every feature as an independently addressable route", async () => {
  const routes = [
    ["atlas/index.html", "全国车牌图鉴"],
    ["gauntlet/index.html", "过关斩将"],
    ["knowledge/index.html", "中国地理知识馆"],
    ["world/index.html", "世界地理"],
    ["world/knowledge/index.html", "世界地理知识"],
    ["world/gauntlet/index.html", "世界地图关卡"],
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
    const exportedFiles = (await readdir(
      new URL(`${directory}/`, exportRoot),
      { withFileTypes: true },
    ))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    assert.deepEqual(exportedFiles, ids.toSorted());
  }

  const provinceHtml = await readFile(
    new URL("city-fill/440000/index.html", exportRoot),
    "utf8",
  );
  assert.match(provinceHtml, /<title>广东城市填图｜中国城市填充挑战<\/title>/i);
  assert.match(provinceHtml, /面包屑导航/);

  const gauntletHtml = await readFile(
    new URL("gauntlet/province-shape/index.html", exportRoot),
    "utf8",
  );
  assert.match(gauntletHtml, /<title>辨形识省｜过关斩将｜中国城市填充挑战<\/title>/i);
  assert.match(gauntletHtml, /第 1 关/);

  const knowledgeHtml = await readFile(
    new URL("knowledge/province-profile/index.html", exportRoot),
    "utf8",
  );
  assert.match(knowledgeHtml, /<title>省份全景名片｜地理知识馆｜中国城市填充挑战<\/title>/i);
  assert.match(knowledgeHtml, /省份全景名片/);
});

test("exports the gated world chapter and every world level", async () => {
  const worldHtml = await readFile(new URL("world/index.html", exportRoot), "utf8");
  assert.match(worldHtml, /<title>世界地理｜中国城市填充挑战<\/title>/i);
  assert.match(worldHtml, /正在核验世界篇资格/);

  const exportedFiles = (await readdir(
    new URL("world/gauntlet/", exportRoot),
    { withFileTypes: true },
  ))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  assert.deepEqual(exportedFiles, worldLevelIds.toSorted());

  const levelHtml = await readFile(
    new URL("world/gauntlet/world-map-country-names/index.html", exportRoot),
    "utf8",
  );
  assert.match(levelHtml, /<title>点亮世界｜世界地图关卡｜中国城市填充挑战<\/title>/i);
  assert.match(levelHtml, /正在核验世界篇资格/);

  const shapeLevelHtml = await readFile(
    new URL("world/gauntlet/world-country-shapes/index.html", exportRoot),
    "utf8",
  );
  assert.match(shapeLevelHtml, /<title>轮廓侦察｜世界地图关卡｜中国城市填充挑战<\/title>/i);
});

test("copies static maps and disables Jekyll processing", async () => {
  await Promise.all([
    access(new URL(".nojekyll", exportRoot)),
    access(new URL("data/maps/100000.json", exportRoot)),
    access(new URL("data/maps/820000.json", exportRoot)),
    access(new URL("data/maps/world/50m.json", exportRoot)),
    access(new URL("favicon.svg", exportRoot)),
    access(new URL("knowledge/index.txt", exportRoot)),
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
