"use client";

import { useEffect, useState } from "react";
import { isWorldLevelId, type WorldLevelId } from "@/domain/game/world-level-ids";
import { usePlayerData } from "@/features/player/player-data-context";
import { WORLD_GAUNTLET_PROGRESS_KEY } from "@/infrastructure/storage/progress-storage";

function parseCompletedWorldLevels(raw: string | null) {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw) as unknown;
    return Array.isArray(value)
      ? Array.from(new Set(value.filter(isWorldLevelId)))
      : [];
  } catch {
    return [];
  }
}

export function useWorldGauntletProgress() {
  const { progressEpoch, progressStorage } = usePlayerData();
  const [completedLevels, setCompletedLevels] = useState<Set<WorldLevelId>>(
    new Set(),
  );

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setCompletedLevels(new Set(parseCompletedWorldLevels(
        progressStorage.getItem(WORLD_GAUNTLET_PROGRESS_KEY),
      )));
    });
    return () => {
      cancelled = true;
    };
  }, [progressEpoch, progressStorage]);

  const completeLevel = (levelId: WorldLevelId) => {
    const raw = progressStorage.updateItem(
      WORLD_GAUNTLET_PROGRESS_KEY,
      (previousValue) => JSON.stringify(Array.from(new Set([
        ...parseCompletedWorldLevels(previousValue),
        levelId,
      ]))),
    );
    setCompletedLevels(new Set(parseCompletedWorldLevels(raw)));
  };

  return { completedLevels, completeLevel };
}
