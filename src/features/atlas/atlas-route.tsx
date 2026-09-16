"use client";

import { ALL_PROVINCE_CODES, NATIONAL_MAP_CODE } from "@/domain/geography/data/provinces";
import NationalCityAtlas from "@/features/atlas/national-city-atlas";
import { useMapCollection, useMapData } from "@/features/map/model/map-data";
import { routePath } from "@/shared/lib/app-path";

export default function AtlasRoute() {
  const { data: nationalMap, error: nationalError } = useMapData(NATIONAL_MAP_CODE);
  const { data: map, error } = useMapCollection(ALL_PROVINCE_CODES);

  return (
    <NationalCityAtlas
      map={map}
      nationalMap={nationalMap}
      error={error || nationalError}
      onExit={() => window.location.assign(routePath("/"))}
    />
  );
}
