import {
  GAUNTLET_LEVEL_ID,
  type GauntletLevelId,
} from "@/domain/game/gauntlet-level-ids";

export const GAUNTLET_LEVEL_BADGE_CLASS: Record<GauntletLevelId, string> = {
  [GAUNTLET_LEVEL_ID.PROVINCE_SHAPE]: "bg-level-province-shape",
  [GAUNTLET_LEVEL_ID.CITY_PROVINCE]: "bg-level-city-province",
  [GAUNTLET_LEVEL_ID.PLATE_PLACE]: "bg-level-plate-place",
  [GAUNTLET_LEVEL_ID.PROVINCE_NEIGHBORS]: "bg-level-province-neighbors",
  [GAUNTLET_LEVEL_ID.PLATE_COMPLETION]: "bg-level-plate-completion",
  [GAUNTLET_LEVEL_ID.CITY_MAP]: "bg-level-city-map",
  [GAUNTLET_LEVEL_ID.TRUTH_FLASH]: "bg-level-truth-flash",
  [GAUNTLET_LEVEL_ID.NEIGHBOR_CHAIN]: "bg-level-neighbor-chain",
  [GAUNTLET_LEVEL_ID.CITY_UNDERCOVER]: "bg-level-city-undercover",
  [GAUNTLET_LEVEL_ID.REGION_MAP]: "bg-level-region-map",
  [GAUNTLET_LEVEL_ID.TERRITORY_GROUPS]: "bg-level-territory-groups",
  [GAUNTLET_LEVEL_ID.GEOGRAPHY_ELIMINATION]: "bg-level-geography-elimination",
  [GAUNTLET_LEVEL_ID.PLATE_FAULT]: "bg-level-plate-fault",
  [GAUNTLET_LEVEL_ID.UNIVERSITY_CITY]: "bg-level-university-city",
  [GAUNTLET_LEVEL_ID.CONFUSABLE_CITIES]: "bg-level-confusable-cities",
  [GAUNTLET_LEVEL_ID.PROVINCE_CITY_COUNT]: "bg-level-city-count",
  [GAUNTLET_LEVEL_ID.CITY_NEIGHBORS]: "bg-level-city-neighbors",
  [GAUNTLET_LEVEL_ID.PLATE_CITY_MAP]: "bg-level-plate-city-map",
  [GAUNTLET_LEVEL_ID.MISTAKE_REVENGE]: "bg-level-mistake-revenge",
  [GAUNTLET_LEVEL_ID.FINAL_BOSS]: "bg-level-final-boss",
};
