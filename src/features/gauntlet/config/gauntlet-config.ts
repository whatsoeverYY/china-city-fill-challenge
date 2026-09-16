import {
  ALL_PROVINCE_CODES,
  PROVINCES,
} from "@/domain/geography/data/provinces";
import { CITY_QUIZ_DATA } from "@/domain/geography/data/city-plates";
import {
  GAUNTLET_LEVELS,
} from "@/domain/game/gauntlet-levels";
import { GAUNTLET_LEVEL_ID } from "@/domain/game/gauntlet-level-ids";
import { CITY_MAP_RECENT_QUESTION_LIMIT } from "@/domain/game/gauntlet-rules";
import type { GauntletLevel } from "@/features/gauntlet/model/gauntlet-types";
import type { ProgressStorage } from "@/infrastructure/storage/progress-storage";

export const MAP_REQUIRED_LEVELS = new Set<GauntletLevel>([
  GAUNTLET_LEVEL_ID.PROVINCE_SHAPE,
  GAUNTLET_LEVEL_ID.CITY_MAP,
  GAUNTLET_LEVEL_ID.NEIGHBOR_CHAIN,
  GAUNTLET_LEVEL_ID.REGION_MAP,
  GAUNTLET_LEVEL_ID.TERRITORY_GROUPS,
  GAUNTLET_LEVEL_ID.PLATE_CITY_MAP,
  GAUNTLET_LEVEL_ID.FINAL_BOSS,
]);

export const FIXED_SCOPE_LEVELS = new Set<GauntletLevel>([
  GAUNTLET_LEVEL_ID.NEIGHBOR_CHAIN,
  GAUNTLET_LEVEL_ID.TERRITORY_GROUPS,
  GAUNTLET_LEVEL_ID.CONFUSABLE_CITIES,
  GAUNTLET_LEVEL_ID.MISTAKE_REVENGE,
  GAUNTLET_LEVEL_ID.FINAL_BOSS,
]);

export const PLATE_QUESTION_LEVELS = new Set<GauntletLevel>([
  GAUNTLET_LEVEL_ID.PLATE_PLACE,
  GAUNTLET_LEVEL_ID.PLATE_COMPLETION,
  GAUNTLET_LEVEL_ID.TRUTH_FLASH,
  GAUNTLET_LEVEL_ID.PLATE_FAULT,
  GAUNTLET_LEVEL_ID.PLATE_CITY_MAP,
]);

export const STREAK_NOTE_LEVELS = new Set<GauntletLevel>([
  GAUNTLET_LEVEL_ID.CITY_PROVINCE,
  GAUNTLET_LEVEL_ID.PLATE_PLACE,
  GAUNTLET_LEVEL_ID.PROVINCE_NEIGHBORS,
  GAUNTLET_LEVEL_ID.PLATE_COMPLETION,
  GAUNTLET_LEVEL_ID.CITY_MAP,
  GAUNTLET_LEVEL_ID.TRUTH_FLASH,
  GAUNTLET_LEVEL_ID.CITY_UNDERCOVER,
  GAUNTLET_LEVEL_ID.REGION_MAP,
  GAUNTLET_LEVEL_ID.TERRITORY_GROUPS,
  GAUNTLET_LEVEL_ID.GEOGRAPHY_ELIMINATION,
  GAUNTLET_LEVEL_ID.PLATE_FAULT,
  GAUNTLET_LEVEL_ID.UNIVERSITY_CITY,
  GAUNTLET_LEVEL_ID.CONFUSABLE_CITIES,
  GAUNTLET_LEVEL_ID.PROVINCE_CITY_COUNT,
  GAUNTLET_LEVEL_ID.PLATE_CITY_MAP,
  GAUNTLET_LEVEL_ID.MISTAKE_REVENGE,
  GAUNTLET_LEVEL_ID.FINAL_BOSS,
]);

export const GAUNTLET_OPENING_FEEDBACK = Object.fromEntries(
  GAUNTLET_LEVELS.map((level) => [level.id, level.openingFeedback]),
) as Record<GauntletLevel, string>;

export const GAUNTLET_ROUND_HEADINGS = Object.fromEntries(
  GAUNTLET_LEVELS.map((level) => [level.id, level.roundHeading]),
) as Record<GauntletLevel, string>;

export const GAUNTLET_TIME_LIMITS = {
  UNLIMITED: 0,
  STANDARD: 90,
  FAST: 60,
} as const;
export type GauntletTimeLimit =
  (typeof GAUNTLET_TIME_LIMITS)[keyof typeof GAUNTLET_TIME_LIMITS];
export const GAUNTLET_TIME_LIMIT = GAUNTLET_TIME_LIMITS.STANDARD;
export const GAUNTLET_URGENT_TIME_SECONDS = 15;
export const GAUNTLET_TIMER_TICK_MS = 1_000;
export const ROTATED_SILHOUETTE_STREAK_TARGET = 20;
export const NEIGHBOR_CHAIN_TARGET = 10;
export const GAUNTLET_REGION_MAP_MAX_TARGET = 30;
export const FINAL_BOSS_QUESTION_COUNT = 30;
export const FINAL_BOSS_LIFE_COUNT = 3;
export const FINAL_BOSS_CHECKPOINT_SIZE = 10;
export const GAUNTLET_FIXED_TARGETS: Partial<Record<GauntletLevel, number>> = {
  [GAUNTLET_LEVEL_ID.CITY_PROVINCE]: 30,
  [GAUNTLET_LEVEL_ID.PLATE_PLACE]: 20,
  [GAUNTLET_LEVEL_ID.PROVINCE_NEIGHBORS]: 10,
  [GAUNTLET_LEVEL_ID.PLATE_COMPLETION]: 20,
  [GAUNTLET_LEVEL_ID.CITY_MAP]: 30,
  [GAUNTLET_LEVEL_ID.TRUTH_FLASH]: 30,
  [GAUNTLET_LEVEL_ID.NEIGHBOR_CHAIN]: NEIGHBOR_CHAIN_TARGET,
  [GAUNTLET_LEVEL_ID.CITY_UNDERCOVER]: 20,
  [GAUNTLET_LEVEL_ID.REGION_MAP]: GAUNTLET_REGION_MAP_MAX_TARGET,
  [GAUNTLET_LEVEL_ID.GEOGRAPHY_ELIMINATION]: 16,
  [GAUNTLET_LEVEL_ID.PLATE_FAULT]: 20,
  [GAUNTLET_LEVEL_ID.UNIVERSITY_CITY]: 20,
  [GAUNTLET_LEVEL_ID.CONFUSABLE_CITIES]: 20,
  [GAUNTLET_LEVEL_ID.PROVINCE_CITY_COUNT]: 20,
  [GAUNTLET_LEVEL_ID.PLATE_CITY_MAP]: 30,
  [GAUNTLET_LEVEL_ID.FINAL_BOSS]: FINAL_BOSS_QUESTION_COUNT,
};

export function nextGauntletTimeLimit(current: GauntletTimeLimit) {
  if (current === GAUNTLET_TIME_LIMITS.UNLIMITED) {
    return GAUNTLET_TIME_LIMITS.STANDARD;
  }
  if (current === GAUNTLET_TIME_LIMITS.STANDARD) {
    return GAUNTLET_TIME_LIMITS.FAST;
  }
  return GAUNTLET_TIME_LIMITS.UNLIMITED;
}
export const GAUNTLET_ROTATED_SILHOUETTE_FEEDBACK =
  "第二阶段：忽略旋转方向，连续辨认省份轮廓";

export const ALL_GAUNTLET_SHAPE_PROVINCE_CODES = PROVINCES.map(
  (item) => item.code,
);

export const ALL_GAUNTLET_PROVINCE_CODES = new Set(
  CITY_QUIZ_DATA.map((item) => item.provinceCode),
);

export function parseGauntletProvinceScope(raw: string | null) {
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        const validCodes = parsed.filter(
          (item): item is string =>
            typeof item === "string" && ALL_PROVINCE_CODES.includes(item),
        );
        if (validCodes.length > 0) return new Set(validCodes);
      }
    } catch {
      // Malformed preferences safely fall back to the full country.
    }
  }
  return new Set(ALL_GAUNTLET_SHAPE_PROVINCE_CODES);
}

export function readRecentQuestionHistory(
  storage: ProgressStorage,
  storageKey: string,
) {
  try {
    const saved = JSON.parse(storage.getItem(storageKey) ?? "[]") as unknown[];
    return saved
      .filter((item): item is string => typeof item === "string")
      .slice(-CITY_MAP_RECENT_QUESTION_LIMIT);
  } catch {
    return [];
  }
}

export function writeRecentQuestionHistory(
  storage: ProgressStorage,
  storageKey: string,
  history: string[],
) {
  try {
    storage.setItem(storageKey, JSON.stringify(history));
  } catch {
    // 浏览器禁用本地存储时，当前页面内的去重队列仍然有效。
  }
}
