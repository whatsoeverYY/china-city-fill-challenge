import assert from "node:assert/strict";
import test from "node:test";

import {
  CITY_QUIZ_DATA,
  plateCollectionsOverlap,
} from "../app/gauntlet-data.ts";

function city(name) {
  const item = CITY_QUIZ_DATA.find((candidate) => candidate.city === name);
  assert.ok(item, `missing quiz city: ${name}`);
  return item;
}

test("shared historical plate prefixes are treated as valid for both cities", () => {
  assert.equal(
    plateCollectionsOverlap(city("南宁市").plates, city("崇左市").plates),
    true,
  );
  assert.equal(
    plateCollectionsOverlap(city("海口市").plates, city("琼海市").plates),
    true,
  );
});

test("unrelated city plate collections do not overlap", () => {
  assert.equal(
    plateCollectionsOverlap(city("南京市").plates, city("杭州市").plates),
    false,
  );
});
