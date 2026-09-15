import assert from "node:assert/strict";
import test from "node:test";

import {
  CITY_QUIZ_DATA,
  PLATE_QUIZ_DATA,
  plateAnswerMatches,
  plateCollectionsOverlap,
  provinceCityAnswerMatches,
  uniqueReversePlateItems,
} from "../app/gauntlet-data.ts";

function city(name) {
  const item = CITY_QUIZ_DATA.find((candidate) => candidate.city === name);
  assert.ok(item, `missing quiz city: ${name}`);
  return item;
}

function plateRegion(name) {
  const item = PLATE_QUIZ_DATA.find((candidate) => candidate.city === name);
  assert.ok(item, `missing plate quiz region: ${name}`);
  return item;
}

test("shared plate prefixes are treated as valid for every matching city", () => {
  assert.equal(
    plateCollectionsOverlap(city("南宁市").plates, city("崇左市").plates),
    true,
  );
  assert.equal(
    plateCollectionsOverlap(city("琼海市").plates, city("文昌市").plates),
    true,
  );
  assert.equal(
    plateCollectionsOverlap(city("五指山市").plates, city("东方市").plates),
    true,
  );
});

test("unrelated city plate collections do not overlap", () => {
  assert.equal(
    plateCollectionsOverlap(city("南京市").plates, city("杭州市").plates),
    false,
  );
  assert.equal(
    plateCollectionsOverlap(city("海口市").plates, city("琼海市").plates),
    false,
  );
});

test("Hainan city quiz data covers every city and its current plate prefix", () => {
  const hainan = CITY_QUIZ_DATA.filter((item) => item.province === "海南省");
  assert.deepEqual(
    Object.fromEntries(hainan.map((item) => [item.city, item.plates])),
    {
      海口市: ["琼A"],
      三亚市: ["琼B"],
      琼海市: ["琼C"],
      文昌市: ["琼C"],
      万宁市: ["琼C"],
      三沙市: ["琼CXS"],
      东方市: ["琼D"],
      五指山市: ["琼D"],
      儋州市: ["琼F"],
    },
  );
  assert.deepEqual(
    uniqueReversePlateItems(hainan).map((item) => item.city),
    ["海口市", "三亚市", "三沙市", "儋州市"],
  );
});

test("multi-letter special plate codes require every letter", () => {
  assert.equal(plateAnswerMatches("CXS", ["琼CXS"], true), true);
  assert.equal(plateAnswerMatches("琼CXS", ["琼CXS"], true), true);
  assert.equal(plateAnswerMatches("S", ["琼CXS"], true), false);
});

test("reverse plate answers accept province and city in one field", () => {
  const ningbo = city("宁波市");
  assert.equal(provinceCityAnswerMatches("浙江宁波", ningbo), true);
  assert.equal(provinceCityAnswerMatches("浙江省 宁波市", ningbo), true);
  assert.equal(provinceCityAnswerMatches("浙江·宁波", ningbo), true);
  assert.equal(provinceCityAnswerMatches("江苏宁波", ningbo), false);
  assert.equal(provinceCityAnswerMatches("浙江杭州", ningbo), false);
  assert.equal(provinceCityAnswerMatches("宁波", ningbo), false);
});

test("Qinghai plate questions cover its two cities and six autonomous prefectures", () => {
  const qinghai = PLATE_QUIZ_DATA.filter((item) => item.province === "青海省");
  assert.deepEqual(
    Object.fromEntries(qinghai.map((item) => [item.city, item.plates])),
    {
      西宁市: ["青A"],
      海东市: ["青B"],
      海北藏族自治州: ["青C"],
      黄南藏族自治州: ["青D"],
      海南藏族自治州: ["青E"],
      果洛藏族自治州: ["青F"],
      玉树藏族自治州: ["青G"],
      海西蒙古族藏族自治州: ["青H"],
    },
  );
  assert.equal(qinghai.every((item) => item.mapRegion), true);
  assert.equal(plateRegion("海南藏族自治州").plate, "青E");
});
