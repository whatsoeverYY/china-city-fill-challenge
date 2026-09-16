"use client";

import { useMemo } from "react";
import { GAUNTLET_LEVEL_ID } from "@/domain/game/gauntlet-level-ids";
import type { MapRegionQuizItem } from "@/features/gauntlet/data/map-region-quiz-data";
import type { GauntletLevel } from "@/features/gauntlet/model/gauntlet-types";
import type { MapData } from "@/features/map/model/map-data";
import {
  createCityNeighborQuestionIndex,
  type CityNeighborQuestion,
} from "./city-neighbor-question";

export function useCityNeighborQuestion({
  currentRegion,
  detailMap,
  level,
}: {
  currentRegion: MapRegionQuizItem | null;
  detailMap: MapData | null;
  level: GauntletLevel | null;
}) {
  const questionIndex = useMemo(
    () => level === GAUNTLET_LEVEL_ID.CITY_NEIGHBORS && detailMap
      ? createCityNeighborQuestionIndex(detailMap)
      : new Map<string, CityNeighborQuestion>(),
    [detailMap, level],
  );
  const currentCityNeighborQuestion = currentRegion
    ? questionIndex.get(currentRegion.id) ?? null
    : null;

  return currentCityNeighborQuestion;
}
