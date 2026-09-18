import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { MAP_REGION_QUIZ_DATA } from "../src/features/gauntlet/data/map-region-quiz-data.ts";
import {
  cityNeighborAnswerMatches,
  createCityNeighborQuestionIndex,
} from "../src/features/gauntlet/model/city-neighbor-question.ts";
import {
  collectNeighborProvinceCodes,
  toggleNeighborCenterCode,
} from "../src/features/knowledge/model/neighbor-selection.ts";

function feature(id, name, coordinates) {
  return {
    type: "Feature",
    properties: { adcode: id, name },
    geometry: { type: "Polygon", coordinates: [coordinates] },
  };
}

test("city adjacency requires a shared boundary instead of a corner touch", () => {
  const map = {
    type: "FeatureCollection",
    features: [
      feature("1", "甲市", [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]),
      feature("2", "乙市", [[1, 0], [2, 0], [2, 1], [1, 1], [1, 0]]),
      feature("3", "丙市", [[2, 1], [3, 1], [3, 2], [2, 2], [2, 1]]),
    ],
  };

  const questions = createCityNeighborQuestionIndex(map);

  assert.deepEqual(questions.get("1")?.neighbors, [{ id: "2", name: "乙市" }]);
  assert.deepEqual(questions.get("2")?.neighbors, [{ id: "1", name: "甲市" }]);
  assert.deepEqual(questions.get("3")?.neighbors, []);
});

test("city neighbor answers must contain the exact normalized name set", () => {
  const neighbors = ["南京市", "扬州市", "泰州市"];

  assert.equal(cityNeighborAnswerMatches("南京、扬州市 泰州", neighbors), true);
  assert.equal(cityNeighborAnswerMatches("泰州，南京；扬州", neighbors), true);
  assert.equal(cityNeighborAnswerMatches("南京、扬州", neighbors), false);
  assert.equal(cityNeighborAnswerMatches("南京、扬州、泰州、镇江", neighbors), false);
  assert.equal(cityNeighborAnswerMatches("", []), true);
  assert.equal(cityNeighborAnswerMatches("0", []), true);
  assert.equal(cityNeighborAnswerMatches("没有", []), true);
  assert.equal(cityNeighborAnswerMatches("不填", []), true);
  assert.equal(cityNeighborAnswerMatches("南京", []), false);
});

test("knowledge neighbor centers support non-empty multi-selection", () => {
  const initial = new Set(["A"]);
  const added = toggleNeighborCenterCode(initial, "B");
  const removed = toggleNeighborCenterCode(added, "A");
  const retained = toggleNeighborCenterCode(removed, "B");

  assert.deepEqual([...initial], ["A"]);
  assert.deepEqual([...added], ["A", "B"]);
  assert.deepEqual([...removed], ["B"]);
  assert.deepEqual([...retained], ["B"]);
});

test("knowledge neighbor unions exclude centers and remove duplicates", () => {
  const neighbors = {
    A: ["B", "C", "D"],
    B: ["A", "C", "E"],
  };

  assert.deepEqual(
    collectNeighborProvinceCodes(new Set(["A", "B"]), neighbors),
    ["C", "D", "E"],
  );
});

test("every map region, including zero-neighbor and autonomous areas, enters the quiz", async () => {
  const items = MAP_REGION_QUIZ_DATA;
  const itemsByProvince = new Map();
  for (const item of items) {
    const current = itemsByProvince.get(item.provinceCode) ?? [];
    current.push(item);
    itemsByProvince.set(item.provinceCode, current);
  }

  assert.equal(items.length, 500);
  assert.ok(items.some((item) => item.city.endsWith("自治州")));
  assert.ok(items.some((item) => item.city.endsWith("盟")));
  let zeroNeighborCount = 0;
  for (const [provinceCode, provinceItems] of itemsByProvince) {
    const source = await readFile(
      new URL(`../public/data/maps/${provinceCode}.json`, import.meta.url),
      "utf8",
    );
    const questions = createCityNeighborQuestionIndex(JSON.parse(source));
    for (const item of provinceItems) {
      const question = questions.get(item.id);
      assert.ok(question, `${item.city}缺少邻市题`);
      if (question.neighbors.length === 0) zeroNeighborCount += 1;
    }
  }
  assert.ok(zeroNeighborCount >= 2, "无陆地邻市的行政区未进入题库");
});
