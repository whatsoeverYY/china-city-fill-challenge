export const WORLD_LEVEL_ID = {
  MAP_COUNTRY_NAMES: "world-map-country-names",
  COUNTRY_SHAPES: "world-country-shapes",
} as const;

export type WorldLevelId =
  (typeof WORLD_LEVEL_ID)[keyof typeof WORLD_LEVEL_ID];

const WORLD_LEVEL_IDS: ReadonlySet<string> = new Set(
  Object.values(WORLD_LEVEL_ID),
);

export function isWorldLevelId(value: unknown): value is WorldLevelId {
  return typeof value === "string" && WORLD_LEVEL_IDS.has(value);
}
