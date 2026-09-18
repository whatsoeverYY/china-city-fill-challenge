export const STORAGE_KEY = "china-city-fill-progress-v1";
export const MAP_COMPLETION_MARKER = "__complete__";
export const HARD_MODE_KEY = "china-city-fill-hard-mode-v1";
export const NEIGHBOR_MODE_KEY = "china-city-fill-neighbor-mode-v1";
export const NEIGHBOR_PROGRESS_KEY = "china-city-fill-neighbor-progress-v1";

// This key versions the serialized shape, not the number or order of levels.
export const GAUNTLET_PROGRESS_KEY =
  "china-city-fill-gauntlet-completed-level-ids-v1";
export const GAUNTLET_MISTAKES_KEY = "china-city-fill-gauntlet-mistakes-v1";
export const GAUNTLET_PROVINCE_SCOPE_KEY =
  "china-city-fill-gauntlet-province-scope-v1";
export const GAUNTLET_REGION_MAP_HISTORY_KEY =
  "china-city-fill-region-map-history-v1";
export const GAUNTLET_PLATE_CITY_MAP_HISTORY_KEY =
  "china-city-fill-plate-city-map-history-v1";

export const PROGRESS_STORAGE_KEYS = [
  STORAGE_KEY,
  HARD_MODE_KEY,
  NEIGHBOR_MODE_KEY,
  NEIGHBOR_PROGRESS_KEY,
  GAUNTLET_PROGRESS_KEY,
  GAUNTLET_MISTAKES_KEY,
  GAUNTLET_PROVINCE_SCOPE_KEY,
  GAUNTLET_REGION_MAP_HISTORY_KEY,
  GAUNTLET_PLATE_CITY_MAP_HISTORY_KEY,
] as const;

export type ProgressStorageKey = (typeof PROGRESS_STORAGE_KEYS)[number];
export type MapProgressKey = typeof STORAGE_KEY | typeof NEIGHBOR_PROGRESS_KEY;

export const MAP_PROGRESS_KEYS = new Set<string>([
  STORAGE_KEY,
  NEIGHBOR_PROGRESS_KEY,
]);

export const HISTORY_KEYS = new Set<string>([
  GAUNTLET_REGION_MAP_HISTORY_KEY,
  GAUNTLET_PLATE_CITY_MAP_HISTORY_KEY,
]);
