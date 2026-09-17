"use client";

import CityGame from "./city-game";
import { usePlayerData } from "@/features/player/player-data-context";

export default function GameRoot({
  initialProvinceCode = null,
}: {
  initialProvinceCode?: string | null;
}) {
  const { progressEpoch } = usePlayerData();
  return (
    <CityGame
      key={`${progressEpoch}-${initialProvinceCode ?? "national"}`}
      initialProvinceCode={initialProvinceCode}
    />
  );
}
