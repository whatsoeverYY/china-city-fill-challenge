"use client";

import type { Province } from "@/domain/geography/data/provinces";
import { GAUNTLET_LEVEL_ID } from "@/domain/game/gauntlet-level-ids";
import type { MapRegionQuizItem } from "@/features/gauntlet/data/map-region-quiz-data";
import type { GauntletLevel } from "@/features/gauntlet/model/gauntlet-types";
import { useMapCollection } from "@/features/map/model/map-data";

const LEVEL = GAUNTLET_LEVEL_ID;

export function useGauntletDetailMap({
  currentMapRegion,
  level,
  selectedCityMapProvinces,
}: {
  currentMapRegion: MapRegionQuizItem | null;
  level: GauntletLevel | null;
  selectedCityMapProvinces: Province[];
}) {
  const detailProvinceCode =
    (level === LEVEL.REGION_MAP || level === LEVEL.CITY_NEIGHBORS) &&
      currentMapRegion
    ? currentMapRegion.provinceCode
    : null;
  const detailProvinceCodes = level === LEVEL.PLATE_CITY_MAP
    ? selectedCityMapProvinces.map((province) => province.code)
    : detailProvinceCode
      ? [detailProvinceCode]
      : [];
  const { data: gauntletDetailMap, error: gauntletDetailError } =
    useMapCollection(detailProvinceCodes);
  const detailProvinceCodeSet = new Set(detailProvinceCodes);
  const gauntletDetailReady = Boolean(
    detailProvinceCodes.length && gauntletDetailMap?.features.length &&
    gauntletDetailMap.features.every(
      (feature) =>
        detailProvinceCodeSet.has(feature.properties.provinceCode ?? ""),
    ) &&
    detailProvinceCodes.every((code) =>
      gauntletDetailMap?.features.some(
        (feature) => feature.properties.provinceCode === code,
      )
    ),
  );

  return {
    gauntletDetailError,
    gauntletDetailMap,
    gauntletDetailReady,
  };
}
