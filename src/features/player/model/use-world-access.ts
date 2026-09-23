"use client";

import { useEffect, useState } from "react";
import { isGauntletLevelId } from "@/domain/game/gauntlet-level-ids";
import { usePlayerData } from "@/features/player/player-data-context";
import { GAUNTLET_PROGRESS_KEY } from "@/infrastructure/storage/progress-storage";
import { canAccessWorld } from "@/infrastructure/storage/world-access-progress";
import {
  isWorldAuthorizationPending,
  type WorldAccessState,
} from "./world-access-state";

function readCompletedChinaLevels(raw: string | null) {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw) as unknown;
    return Array.isArray(value) ? value.filter(isGauntletLevelId) : [];
  } catch {
    return [];
  }
}

export function useWorldAccess() {
  const {
    identity,
    initialized,
    isAdmin,
    profile,
    progressEpoch,
    progressStorage,
  } = usePlayerData();
  const [state, setState] = useState<WorldAccessState>("checking");
  const authorizationPending = isWorldAuthorizationPending(
    initialized,
    identity?.id ?? null,
    profile?.id ?? null,
  );

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      if (authorizationPending) {
        setState("checking");
        return;
      }
      const completedLevels = readCompletedChinaLevels(
        progressStorage.getItem(GAUNTLET_PROGRESS_KEY),
      );
      setState(
        canAccessWorld(progressStorage, completedLevels, isAdmin)
          ? "unlocked"
          : "locked",
      );
    });
    return () => {
      cancelled = true;
    };
  }, [authorizationPending, isAdmin, progressEpoch, progressStorage]);

  return authorizationPending ? "checking" : state;
}
