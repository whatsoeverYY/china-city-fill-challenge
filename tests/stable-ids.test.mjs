import assert from "node:assert/strict";
import test from "node:test";

import { CITY_QUIZ_DATA, PLATE_QUIZ_DATA } from "../src/domain/geography/data/city-plates.ts";
import { CONFUSABLE_CITY_PAIRS } from "../src/domain/geography/data/confusable-cities.ts";
import { MAP_REGION_CODE_BY_PROVINCE_AND_NAME } from "../src/domain/geography/data/map-region-codes.ts";
import { UNIVERSITY_QUIZ_DATA } from "../src/domain/geography/data/universities.ts";
import { MAP_REGION_QUIZ_DATA } from "../src/features/gauntlet/data/map-region-quiz-data.ts";
import { normalizeStoredRegionIds } from "../src/features/city-challenge/model/city-answer-model.ts";

function assertUniqueIds(items, label) {
  const ids = items.map((item) => item.id);
  assert.ok(ids.every(Boolean), `${label} contains an empty id`);
  assert.equal(new Set(ids).size, ids.length, `${label} contains duplicate ids`);
}

test("map and quiz entities use unique stable ids", () => {
  const catalogIds = Object.values(MAP_REGION_CODE_BY_PROVINCE_AND_NAME)
    .flatMap((regions) => Object.values(regions));

  assert.equal(MAP_REGION_QUIZ_DATA.length, catalogIds.length);
  assert.equal(new Set(catalogIds).size, catalogIds.length);
  assertUniqueIds(MAP_REGION_QUIZ_DATA, "map region quiz");
  assertUniqueIds(CITY_QUIZ_DATA, "city quiz");
  assertUniqueIds(PLATE_QUIZ_DATA, "plate quiz");
  assertUniqueIds(UNIVERSITY_QUIZ_DATA, "university quiz");
  assertUniqueIds(CONFUSABLE_CITY_PAIRS, "confusable city pairs");
});

test("stored display names migrate to region ids without retaining unknown text", () => {
  const answers = [
    { id: "320100", name: "南京市", provinceCode: "320000" },
    { id: "320500", name: "苏州市", provinceCode: "320000" },
  ];

  assert.deepEqual(
    [...normalizeStoredRegionIds(["南京市", "320500", "不存在"], answers)],
    ["320100", "320500"],
  );
});
