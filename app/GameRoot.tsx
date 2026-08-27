"use client";

import CityGame from "./CityGame";
import { usePlayerData } from "./PlayerDataProvider";

export default function GameRoot() {
  const { progressEpoch } = usePlayerData();
  return <CityGame key={progressEpoch} />;
}
