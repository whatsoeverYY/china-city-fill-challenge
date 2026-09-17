"use client";

import GauntletGame from "@/features/gauntlet/gauntlet-game";
import { NATIONAL_MAP_CODE } from "@/domain/geography/data/provinces";
import { useMapData } from "@/features/map/model/map-data";
import type { GauntletLevelId } from "@/domain/game/gauntlet-level-ids";

export default function GauntletRoute({
  initialLevel = null,
}: {
  initialLevel?: GauntletLevelId | null;
}) {
  const { data: nationalMap, error: nationalError } = useMapData(NATIONAL_MAP_CODE);

  return (
    <GauntletGame
      nationalMap={nationalMap}
      nationalError={nationalError}
      initialLevel={initialLevel}
    />
  );
}
