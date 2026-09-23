"use client";

import { useEffect, useState } from "react";
import {
  WORLD_COUNTRY_BY_ID,
  type WorldCountryId,
} from "@/domain/geography/data/world-countries";
import { usePlayerData } from "@/features/player/player-data-context";
import { WORLD_EXPLORED_COUNTRIES_KEY } from "@/infrastructure/storage/progress-storage";
import { parseWorldExplorationProgress } from "@/infrastructure/storage/world-exploration-progress";

function parseKnownCountryIds(raw: string | null) {
  return parseWorldExplorationProgress(raw).filter((countryId) =>
    WORLD_COUNTRY_BY_ID.has(countryId)
  );
}

export function useWorldExplorationProgress() {
  const { progressEpoch, progressStorage } = usePlayerData();
  const [exploredCountryIds, setExploredCountryIds] = useState<
    Set<WorldCountryId>
  >(new Set());

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setExploredCountryIds(new Set(parseKnownCountryIds(
        progressStorage.getItem(WORLD_EXPLORED_COUNTRIES_KEY),
      )));
    });
    return () => {
      cancelled = true;
    };
  }, [progressEpoch, progressStorage]);

  const exploreCountry = (countryId: WorldCountryId) => {
    const raw = progressStorage.updateItem(
      WORLD_EXPLORED_COUNTRIES_KEY,
      (previousValue) => JSON.stringify(Array.from(new Set([
        ...parseKnownCountryIds(previousValue),
        countryId,
      ]))),
    );
    setExploredCountryIds(new Set(parseKnownCountryIds(raw)));
  };

  return { exploredCountryIds, exploreCountry };
}
