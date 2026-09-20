import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  CHINA_CAMPAIGN_REQUIRED_LEVEL_IDS,
  hasCompletedChinaCampaign,
} from "../src/domain/game/china-campaign.ts";
import { GAUNTLET_LEVEL_ID } from "../src/domain/game/gauntlet-level-ids.ts";
import { WORLD_LEVELS } from "../src/domain/game/world-levels.ts";
import { WORLD_DATA_AS_OF } from "../src/domain/geography/data/world-data-policy.ts";
import {
  canAccessWorld,
  ensureWorldAccess,
  parseWorldAccessProgress,
} from "../src/infrastructure/storage/world-access-progress.ts";
import {
  WORLD_ACCESS_KEY,
  createTrialProgressStorage,
} from "../src/infrastructure/storage/progress-storage.ts";

const catalog = JSON.parse(await readFile(
  new URL("../src/domain/geography/data/world-countries.json", import.meta.url),
  "utf8",
));
const map = JSON.parse(await readFile(
  new URL("../public/data/maps/world/50m.json", import.meta.url),
  "utf8",
));

test("world country catalog is a current, complete 195-country learning set", () => {
  assert.equal(catalog.countryCount, 195);
  assert.equal(catalog.countries.length, 195);
  assert.equal(new Set(catalog.countries.map((country) => country.id)).size, 195);
  assert.equal(new Set(catalog.countries.map((country) => country.m49Code)).size, 195);
  assert.equal(catalog.countryDataAsOf, WORLD_DATA_AS_OF);
  assert.equal(catalog.capitalDataAsOf, WORLD_DATA_AS_OF);
  assert.equal(catalog.audit.checkedAt, WORLD_DATA_AS_OF);
  assert.equal(catalog.audit.m49CountryCodesMatched, 195);
  assert.equal(catalog.audit.currentCountryNamesMatched, 195);
  assert.equal(catalog.audit.currentLocalizedCountryNamesMatched, 195);
  assert.equal(catalog.audit.capitalRecordsMatched, 195);
  assert.match(catalog.sourceVersions.countryRegister, /United Nations.*M49/i);
  assert.ok(catalog.countries.every((country) => country.capitals.length > 0));
});

test("world data includes audited 2026 capital changes and transition notes", () => {
  const byIso = new Map(catalog.countries.map((country) => [country.isoAlpha3, country]));
  assert.equal(byIso.get("TUR").englishName, "Türkiye");
  assert.equal(byIso.get("CZE").englishName, "Czechia");
  assert.ok(byIso.get("VAT").aliases.includes("教廷"));
  assert.equal(byIso.get("GNQ").capitals[0].englishName, "Ciudad de la Paz");
  assert.equal(byIso.get("PLW").capitals[0].englishName, "Ngerulmud");
  assert.match(byIso.get("IDN").capitals[0].role, /现首都/);
  assert.equal(byIso.get("BDI").capitals[0].englishName, "Gitega");
});

test("world map is the audited 2026 UN snapshot and covers every study country", () => {
  assert.equal(map.mapDataAsOf, WORLD_DATA_AS_OF);
  assert.equal(map.sourceRetrievedAt, WORLD_DATA_AS_OF);
  assert.equal(map.sourceItemId, "add1f3d789fd44aa86fc09502e9e065d");
  assert.match(map.sourceVersion, /UN Compliant Boundaries.*2026-06-19/);
  assert.equal(map.audit.studyCountryGeometryCount, 195);
  assert.equal(map.audit.sourceFeatureCount, 205);

  const catalogIds = catalog.countries.map((country) => country.id).sort();
  const playableIds = map.features
    .filter((feature) => feature.properties.playable)
    .map((feature) => feature.properties.id)
    .sort();
  assert.deepEqual(playableIds, catalogIds);
});

test("continent counts match the 195-country catalog", () => {
  const counts = Object.fromEntries(
    Object.entries(Object.groupBy(catalog.countries, (country) => country.continentId))
      .map(([id, countries]) => [id, countries.length]),
  );
  assert.deepEqual(counts, {
    africa: 54,
    asia: 48,
    europe: 44,
    "north-america": 23,
    oceania: 14,
    "south-america": 12,
  });
});

test("China campaign unlock uses 19 explicit main level IDs", () => {
  assert.equal(CHINA_CAMPAIGN_REQUIRED_LEVEL_IDS.length, 19);
  assert.equal(
    CHINA_CAMPAIGN_REQUIRED_LEVEL_IDS.includes(GAUNTLET_LEVEL_ID.MISTAKE_REVENGE),
    false,
  );
  assert.equal(hasCompletedChinaCampaign(CHINA_CAMPAIGN_REQUIRED_LEVEL_IDS), true);
  assert.equal(hasCompletedChinaCampaign(CHINA_CAMPAIGN_REQUIRED_LEVEL_IDS.slice(1)), false);
  assert.equal(WORLD_LEVELS.length, 2);
});

test("world access becomes a permanent stored achievement after China completion", () => {
  const memory = new Map();
  const storage = createTrialProgressStorage(memory);
  assert.equal(ensureWorldAccess(storage, []), null);

  const unlocked = ensureWorldAccess(storage, CHINA_CAMPAIGN_REQUIRED_LEVEL_IDS);
  assert.ok(unlocked);
  assert.deepEqual(
    parseWorldAccessProgress(storage.getItem(WORLD_ACCESS_KEY)),
    unlocked,
  );
  assert.deepEqual(ensureWorldAccess(storage, []), unlocked);
});

test("administrators can access world pages without completing China", () => {
  const memory = new Map();
  const storage = createTrialProgressStorage(memory);

  assert.equal(canAccessWorld(storage, [], true), true);
  assert.equal(storage.getItem(WORLD_ACCESS_KEY), null);
  assert.equal(canAccessWorld(storage, [], false), false);
});
