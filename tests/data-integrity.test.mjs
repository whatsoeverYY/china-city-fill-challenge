import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { CITY_QUIZ_DATA, PLATE_QUIZ_DATA } from "../app/gauntlet-data.ts";
import {
  MAP_REGION_NAMES_BY_PROVINCE,
  MAP_REGION_QUIZ_DATA,
} from "../app/map-region-quiz-data.ts";
import {
  PROVINCES,
  PROVINCE_CAPITALS,
  PROVINCE_NEIGHBORS,
  PROVINCE_PLATE_PREFIXES,
} from "../app/province-data.ts";
import { PROVINCE_CITY_COUNT_DATA } from "../app/province-city-count-data.ts";
import { PROVINCE_ADMINISTRATIVE_PROFILE_DATA } from "../app/province-administrative-profile-data.ts";
import { UNIVERSITY_QUIZ_DATA } from "../app/university-data.ts";
import { CONFUSABLE_CITY_PAIRS } from "../app/confusable-city-data.ts";
import { fitRotatedPointsScale } from "../app/silhouette-utils.ts";
import { normalizeMapRegionName } from "../app/map-data.ts";
import {
  GAUNTLET_LEVEL_COUNT,
  GAUNTLET_LEVEL_ID,
  GAUNTLET_LEVELS,
  activeGauntletCompletionCount,
  gauntletLevelNumber,
  isStoredGauntletLevelId,
} from "../app/gauntlet-levels.ts";

const mapsRoot = new URL("../public/data/maps/", import.meta.url);
const cityGameUrl = new URL("../app/CityGame.tsx", import.meta.url);

test("gauntlet levels use stable IDs while display numbers follow catalog order", () => {
  const ids = GAUNTLET_LEVELS.map((level) => level.id);

  assert.equal(GAUNTLET_LEVEL_COUNT, 22);
  assert.equal(new Set(ids).size, GAUNTLET_LEVEL_COUNT);
  assert.ok(ids.every((id) => /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(id)));
  assert.ok(ids.every(isStoredGauntletLevelId));
  assert.equal(isStoredGauntletLevelId("1"), false);
  assert.deepEqual(
    GAUNTLET_LEVELS.map((level) => gauntletLevelNumber(level.id)),
    Array.from({ length: GAUNTLET_LEVEL_COUNT }, (_, index) => index + 1),
  );
  assert.equal(GAUNTLET_LEVELS.at(-2)?.id, GAUNTLET_LEVEL_ID.MISTAKE_REVENGE);
  assert.equal(GAUNTLET_LEVELS.at(-1)?.id, GAUNTLET_LEVEL_ID.FINAL_BOSS);
  assert.equal(ids.includes(GAUNTLET_LEVEL_ID.ROTATED_SHAPE), false);
  assert.equal(gauntletLevelNumber(GAUNTLET_LEVEL_ID.ROTATED_SHAPE), 0);
  assert.equal(
    activeGauntletCompletionCount([
      GAUNTLET_LEVEL_ID.PROVINCE_SHAPE,
      GAUNTLET_LEVEL_ID.PROVINCE_SHAPE,
      GAUNTLET_LEVEL_ID.ROTATED_SHAPE,
      "retired-level",
    ]),
    1,
  );
  const shapeLevel = GAUNTLET_LEVELS.find(
    (level) => level.id === GAUNTLET_LEVEL_ID.PROVINCE_SHAPE,
  );
  assert.match(shapeLevel?.target ?? "", /普通轮廓全覆盖.*旋转轮廓 20 连胜/);
});

test("province silhouettes use two phases and the boss trains province adjacency", async () => {
  const source = await readFile(cityGameUrl, "utf8");
  const bossSection = source.match(
    /type BossSkill[\s\S]*?function ProvinceShape/,
  )?.[0] ?? "";

  assert.match(source, /isRotatedProvinceShapeStage/);
  assert.match(source, /普通轮廓已全部完成/);
  assert.match(bossSection, /"省际接壤"/);
  assert.match(bossSection, /任意一个陆地邻省/);
  assert.doesNotMatch(bossSection, /skill:\s*"行政中心"/);
});

test("province configuration is complete, unique and symmetric", () => {
  assert.equal(PROVINCES.length, 34);
  assert.equal(new Set(PROVINCES.map((item) => item.code)).size, 34);
  assert.equal(new Set(PROVINCES.map((item) => item.name)).size, 34);
  assert.deepEqual(Object.keys(PROVINCE_NEIGHBORS).sort(), PROVINCES.map((item) => item.code).sort());

  for (const province of PROVINCES) {
    assert.ok(PROVINCE_CAPITALS[province.code], `${province.name} 缺少行政中心`);
    assert.ok(PROVINCE_PLATE_PREFIXES[province.code], `${province.name} 缺少车牌简称`);
    for (const neighbor of PROVINCE_NEIGHBORS[province.code]) {
      assert.ok(PROVINCE_NEIGHBORS[neighbor]?.includes(province.code), `${province.code} 与 ${neighbor} 的邻接关系不对称`);
    }
  }
});

test("rotated silhouettes are scaled to remain inside their safe drawing area", () => {
  const rectangle = [
    [46, 200], [874, 200], [874, 400], [46, 400],
  ];
  assert.equal(fitRotatedPointsScale(rectangle, 0, 460, 300, 828, 528), 1);

  const quarterTurnScale = fitRotatedPointsScale(
    rectangle,
    90,
    460,
    300,
    828,
    528,
  );
  assert.ok(Math.abs(quarterTurnScale - 528 / 828) < 1e-12);

  const rotation = 47;
  const scale = fitRotatedPointsScale(rectangle, rotation, 460, 300, 828, 528);
  const radians = (rotation * Math.PI) / 180;
  for (const [x, y] of rectangle) {
    const offsetX = x - 460;
    const offsetY = y - 300;
    const rotatedX = (offsetX * Math.cos(radians) - offsetY * Math.sin(radians)) * scale;
    const rotatedY = (offsetX * Math.sin(radians) + offsetY * Math.cos(radians)) * scale;
    assert.ok(Math.abs(rotatedX) <= 414 + Number.EPSILON * 828);
    assert.ok(Math.abs(rotatedY) <= 264 + Number.EPSILON * 528);
  }
});

test("every configured province has valid map data", async () => {
  const maps = await Promise.all(
    ["100000", ...PROVINCES.map((province) => province.code)].map(async (code) => {
      const source = await readFile(new URL(`${code}.json`, mapsRoot), "utf8");
      return [code, JSON.parse(source)];
    }),
  );
  for (const [code, map] of maps) {
    assert.equal(map.type, "FeatureCollection", `${code} 不是 FeatureCollection`);
    const namedFeatures = map.features.filter((feature) => feature.properties?.name);
    assert.ok(namedFeatures.length > 0, `${code} 没有有效命名区块`);
    assert.ok(namedFeatures.every((feature) => feature.geometry?.coordinates));
    if (code !== "100000") {
      assert.deepEqual(
        MAP_REGION_NAMES_BY_PROVINCE[code],
        namedFeatures.map((feature) =>
          normalizeMapRegionName(feature.properties.name, code),
        ),
        `${code} 的市域落点名称索引与地图区块不一致`,
      );
    }
  }

  const xinjiang = maps.find(([code]) => code === "650000")[1];
  assert.deepEqual(
    xinjiang.features.slice(-3).map((feature) => feature.properties.name),
    ["新星市", "白杨市", "草湖市"],
  );

  const hainan = maps.find(([code]) => code === "460000")[1];
  assert.deepEqual(
    hainan.features.map((feature) => feature.properties.name).sort(),
    [
      "万宁市", "三亚市", "三沙市", "东方市", "临高县", "乐东黎族自治县",
      "五指山市", "保亭黎族苗族自治县", "儋州市", "定安县", "屯昌县",
      "文昌市", "昌江黎族自治县", "海口市", "澄迈县", "琼中黎族苗族自治县",
      "琼海市", "白沙黎族自治县", "陵水黎族自治县",
    ].sort(),
  );
});

test("quiz datasets keep their expected coverage and references", () => {
  const provinceNames = new Set(PROVINCES.map((province) => province.name));
  const provinceShortNames = new Set(PROVINCES.map((province) => province.shortName));
  assert.ok(CITY_QUIZ_DATA.length >= 290);
  assert.ok(PLATE_QUIZ_DATA.length >= 340);
  assert.equal(MAP_REGION_QUIZ_DATA.length, 500);
  assert.ok(CITY_QUIZ_DATA.every((item) => provinceNames.has(item.province) && provinceShortNames.has(item.provinceShort)));
  assert.equal(UNIVERSITY_QUIZ_DATA.length, 115);
  assert.equal(UNIVERSITY_QUIZ_DATA.filter((item) => item.tier === "985").length, 39);
  assert.equal(CONFUSABLE_CITY_PAIRS.length, 12);
  assert.equal(PROVINCE_CITY_COUNT_DATA.length, 34);
  assert.equal(
    PROVINCE_CITY_COUNT_DATA.slice(0, 31).reduce((sum, item) => sum + item.cityCount, 0),
    297,
  );
});

test("plate quiz covers every concrete special plate region and only marks clickable map regions", () => {
  for (const profile of PROVINCE_ADMINISTRATIVE_PROFILE_DATA) {
    for (const region of profile.plateRegions) {
      if (region.type === "省直辖号段") continue;
      const quizItem = PLATE_QUIZ_DATA.find(
        (item) => item.province === PROVINCES.find((province) => province.code === profile.code)?.name &&
          item.city === region.name,
      );
      assert.ok(quizItem, `${region.name}（${region.plate}）未进入车牌题库`);
      assert.ok(quizItem.plates.includes(region.plate), `${region.name}缺少${region.plate}`);
    }
  }

  for (const item of PLATE_QUIZ_DATA.filter((candidate) => candidate.mapRegion)) {
    const province = PROVINCES.find(
      (candidate) => candidate.shortName === item.provinceShort,
    );
    assert.ok(province, `${item.provinceShort}缺少省份配置`);
    assert.ok(
      MAP_REGION_NAMES_BY_PROVINCE[province.code]?.includes(item.city),
      `${item.city}标记为地图题，但地图中不存在该区块`,
    );
  }
});

test("Jilin special plate regions include Ji K without treating it as a city", () => {
  const jilinProfile = PROVINCE_ADMINISTRATIVE_PROFILE_DATA.find((item) => item.code === "220000");

  assert.ok(jilinProfile, "吉林省缺少行政资料");
  assert.deepEqual(
    jilinProfile.plateRegions.find((item) => item.plate === "吉K"),
    {
      name: "长白山保护开发区",
      type: "保护开发区",
      plate: "吉K",
      note: "长白山保护开发区使用独立号牌前缀，不计入《中国统计年鉴》的城市数量口径。",
    },
  );
  assert.equal(CITY_QUIZ_DATA.some((item) => item.plate === "吉K"), false);
  assert.deepEqual(
    PLATE_QUIZ_DATA.find((item) => item.plate === "吉K"),
    {
      city: "长白山保护开发区",
      province: "吉林省",
      provinceShort: "吉林",
      plates: ["吉K"],
      plate: "吉K",
      plateNote: "长白山保护开发区使用独立号牌前缀，不计入《中国统计年鉴》的城市数量口径。",
      entityType: "保护开发区",
      mapRegion: false,
    },
  );
});

test("Hainan profile reconciles 19 city-county units and special plate regions", () => {
  const hainanProfile = PROVINCE_ADMINISTRATIVE_PROFILE_DATA.find(
    (item) => item.code === "460000",
  );

  assert.ok(hainanProfile, "海南省缺少行政资料");
  assert.equal(hainanProfile.totalUnitCount, 19);
  assert.equal(
    hainanProfile.categories.reduce((sum, item) => sum + item.count, 4),
    19,
  );
  assert.deepEqual(
    hainanProfile.plateRegions.map((item) => item.plate),
    ["琼CXS", "琼C", "琼D", "琼E"],
  );
});
