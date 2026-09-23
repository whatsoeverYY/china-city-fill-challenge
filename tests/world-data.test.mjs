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
  WORLD_EXPLORED_COUNTRIES_KEY,
  createTrialProgressStorage,
} from "../src/infrastructure/storage/progress-storage.ts";
import { parseWorldExplorationProgress } from "../src/infrastructure/storage/world-exploration-progress.ts";
import { WORLD_MAP_ROUTE_SEEDS } from "../src/features/world-gauntlet/config/world-map-route-seeds.ts";
import { isWorldAuthorizationPending } from "../src/features/player/model/world-access-state.ts";

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

test("world map routes cover every study country exactly once", () => {
  const routeSubregions = WORLD_MAP_ROUTE_SEEDS.flatMap(
    (route) => route.subregions,
  );
  assert.equal(new Set(routeSubregions).size, routeSubregions.length);

  const coveredCountryIds = WORLD_MAP_ROUTE_SEEDS.flatMap((route) =>
    catalog.countries
      .filter((country) => route.subregions.includes(country.subregion))
      .map((country) => country.id),
  );
  assert.equal(WORLD_MAP_ROUTE_SEEDS.length, 15);
  assert.equal(coveredCountryIds.length, 195);
  assert.equal(new Set(coveredCountryIds).size, 195);
  assert.deepEqual(
    coveredCountryIds.toSorted(),
    catalog.countries.map((country) => country.id).toSorted(),
  );
});

test("world silhouette missions have a viable question pool for every continent", () => {
  const countryById = new Map(
    catalog.countries.map((country) => [country.id, country]),
  );
  const counts = {};
  const eligibleFeatures = map.features.filter((feature) =>
    feature.properties.playable && feature.properties.shapeEligible
  );
  for (const feature of eligibleFeatures) {
    const country = countryById.get(feature.properties.id);
    assert.ok(country);
    counts[country.continentId] = (counts[country.continentId] ?? 0) + 1;
  }

  assert.equal(eligibleFeatures.length, 162);
  assert.deepEqual(counts, {
    africa: 49,
    asia: 41,
    "south-america": 12,
    oceania: 7,
    "north-america": 16,
    europe: 37,
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

test("world access waits for a signed-in player's role before showing the lock page", () => {
  assert.equal(isWorldAuthorizationPending(false, null, null), true);
  assert.equal(isWorldAuthorizationPending(true, "admin-id", null), true);
  assert.equal(
    isWorldAuthorizationPending(true, "admin-id", "different-user-id"),
    true,
  );
  assert.equal(
    isWorldAuthorizationPending(true, "admin-id", "admin-id"),
    false,
  );
  assert.equal(isWorldAuthorizationPending(true, null, null), false);
});

test("world exploration stores only stable country IDs without duplicates", () => {
  const memory = new Map();
  const storage = createTrialProgressStorage(memory);
  storage.setItem(WORLD_EXPLORED_COUNTRIES_KEY, JSON.stringify([
    "country:156",
    "country:156",
    "country:840",
    "unknown-country",
  ]));

  assert.deepEqual(
    parseWorldExplorationProgress(
      storage.getItem(WORLD_EXPLORED_COUNTRIES_KEY),
    ),
    ["country:156", "country:840"],
  );
});
