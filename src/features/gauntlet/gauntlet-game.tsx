"use client";

import GauntletScreen from "@/features/gauntlet/components/gauntlet-screen";
import { GauntletDerivedProvider } from "@/features/gauntlet/model/gauntlet-derived-context";
import { GauntletSessionProvider } from "@/features/gauntlet/model/gauntlet-session-context";
import type { MapData } from "@/features/map/model/map-data";

export default function GauntletGame({
  nationalMap,
  nationalError,
  onExit,
}: {
  nationalMap: MapData | null;
  nationalError: boolean;
  onExit: () => void;
}) {
  return (
    <GauntletSessionProvider
      nationalMap={nationalMap}
      nationalError={nationalError}
      onExit={onExit}
    >
      <GauntletDerivedProvider>
        <GauntletScreen />
      </GauntletDerivedProvider>
    </GauntletSessionProvider>
  );
}
