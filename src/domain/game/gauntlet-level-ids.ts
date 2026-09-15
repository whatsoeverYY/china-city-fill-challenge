export const GAUNTLET_LEVEL_ID = {
  PROVINCE_SHAPE: "province-shape",
  CITY_PROVINCE: "city-province",
  PLATE_PLACE: "plate-place",
  PROVINCE_NEIGHBORS: "province-neighbors",
  PLATE_COMPLETION: "plate-completion",
  CITY_MAP: "city-map",
  TRUTH_FLASH: "truth-flash",
  NEIGHBOR_CHAIN: "neighbor-chain",
  PROVINCE_PUZZLE: "province-puzzle",
  CITY_UNDERCOVER: "city-undercover",
  REGION_MAP: "region-map",
  TERRITORY_GROUPS: "territory-groups",
  PROVINCE_SHORTEST_ROUTE: "province-shortest-route",
  GEOGRAPHY_ELIMINATION: "geography-elimination",
  PLATE_FAULT: "plate-fault",
  UNIVERSITY_CITY: "university-city",
  CONFUSABLE_CITIES: "confusable-cities",
  CITY_SHORTEST_ROUTE: "city-shortest-route",
  PROVINCE_CITY_COUNT: "province-city-count",
  PLATE_CITY_MAP: "plate-city-map",
  MISTAKE_REVENGE: "mistake-revenge",
  FINAL_BOSS: "final-boss",
} as const;

export type GauntletLevelId =
  (typeof GAUNTLET_LEVEL_ID)[keyof typeof GAUNTLET_LEVEL_ID];

const GAUNTLET_LEVEL_IDS: ReadonlySet<string> = new Set(
  Object.values(GAUNTLET_LEVEL_ID),
);

export function isGauntletLevelId(value: unknown): value is GauntletLevelId {
  return typeof value === "string" && GAUNTLET_LEVEL_IDS.has(value);
}
