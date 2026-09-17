"use client";

import GauntletScreen from "@/features/gauntlet/components/gauntlet-screen";
import { GauntletDerivedProvider } from "@/features/gauntlet/model/gauntlet-derived-context";
import { GauntletSessionProvider } from "@/features/gauntlet/model/gauntlet-session-context";
import type { MapData } from "@/features/map/model/map-data";
import type { GauntletLevelId } from "@/domain/game/gauntlet-level-ids";

export default function GauntletGame({
  nationalMap,
  nationalError,
  initialLevel,
}: {
  nationalMap: MapData | null;
  nationalError: boolean;
  initialLevel: GauntletLevelId | null;
}) {
  return (
    <GauntletSessionProvider
      nationalMap={nationalMap}
      nationalError={nationalError}
    >
      <GauntletDerivedProvider>
        <GauntletScreen initialLevel={initialLevel} />
      </GauntletDerivedProvider>
    </GauntletSessionProvider>
  );
}
