"use client";

import GauntletGame from "@/features/gauntlet/gauntlet-game";
import { useMapData } from "@/features/map/model/map-data";
import { routePath } from "@/shared/lib/app-path";

export default function GauntletRoute() {
  const { data: nationalMap, error: nationalError } = useMapData("100000");

  return (
    <GauntletGame
      nationalMap={nationalMap}
      nationalError={nationalError}
      onExit={() => window.location.assign(routePath("/"))}
    />
  );
}
