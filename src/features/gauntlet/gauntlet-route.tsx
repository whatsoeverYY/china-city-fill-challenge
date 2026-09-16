"use client";

import GauntletGame from "@/features/gauntlet/gauntlet-game";
import { NATIONAL_MAP_CODE } from "@/domain/geography/data/provinces";
import { useMapData } from "@/features/map/model/map-data";
import { routePath } from "@/shared/lib/app-path";

export default function GauntletRoute() {
  const { data: nationalMap, error: nationalError } = useMapData(NATIONAL_MAP_CODE);

  return (
    <GauntletGame
      nationalMap={nationalMap}
      nationalError={nationalError}
      onExit={() => window.location.assign(routePath("/"))}
    />
  );
}
