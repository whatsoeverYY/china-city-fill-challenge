import { useCallback, useEffect, useRef, useState } from "react";
import { PROVINCES } from "@/domain/geography/data/provinces";
import {
  HARD_MODE_KEY,
  MAP_COMPLETION_MARKER,
  NEIGHBOR_MODE_KEY,
  NEIGHBOR_PROGRESS_KEY,
  STORAGE_KEY,
  type ProgressStorage,
} from "@/infrastructure/storage/progress-storage";

export function nationalChallengeMessage(
  hardMode: boolean,
  neighborMode: boolean,
) {
  if (hardMode) return "难度提升：点击省级行政区并输入名称解锁";
  if (neighborMode) return "邻省连城：选择一个省份，联动它的所有接壤省份";
  return "请选择一个省级行政区开始挑战";
}

export function useCityProgress(
  progressStorage: ProgressStorage,
  setMessage: (message: string) => void,
) {
  const [hardMode, setHardMode] = useState(false);
  const [neighborMode, setNeighborMode] = useState(false);
  const [completedProvinceCodes, setCompletedProvinceCodes] = useState<Set<string>>(
    new Set(),
  );
  const [completedNeighborCodes, setCompletedNeighborCodes] = useState<Set<string>>(
    new Set(),
  );
  const progressRef = useRef<Record<string, string[]>>({});
  const neighborProgressRef = useRef<Record<string, string[]>>({});

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const saved = JSON.parse(
          progressStorage.getItem(STORAGE_KEY) ?? "{}",
        ) as Record<string, string[]>;
        const savedHardMode = progressStorage.getItem(HARD_MODE_KEY) === "true";
        const savedNeighborMode =
          progressStorage.getItem(NEIGHBOR_MODE_KEY) === "true";
        const savedNeighborProgress = JSON.parse(
          progressStorage.getItem(NEIGHBOR_PROGRESS_KEY) ?? "{}",
        ) as Record<string, string[]>;
        progressRef.current = saved;
        neighborProgressRef.current = savedNeighborProgress;
        setHardMode(savedHardMode);
        setNeighborMode(savedNeighborMode);
        setMessage(nationalChallengeMessage(savedHardMode, savedNeighborMode));
        setCompletedProvinceCodes(
          new Set(
            PROVINCES.filter(
              (item) => saved[item.code]?.[0] === MAP_COMPLETION_MARKER,
            ).map((item) => item.code),
          ),
        );
        setCompletedNeighborCodes(
          new Set(
            PROVINCES.filter(
              (item) =>
                savedNeighborProgress[item.code]?.[0] === MAP_COMPLETION_MARKER,
            ).map((item) => item.code),
          ),
        );
      } catch {
        progressRef.current = {};
        neighborProgressRef.current = {};
      }
    });
    return () => {
      cancelled = true;
    };
  }, [progressStorage, setMessage]);

  const saveProgress = useCallback(
    (code: string, regionIds: Set<string>, complete: boolean, joined: boolean) => {
      const progress = joined ? neighborProgressRef.current : progressRef.current;
      progress[code] = complete
        ? [MAP_COMPLETION_MARKER, ...Array.from(regionIds)]
        : Array.from(regionIds);
      progressStorage.setItem(
        joined ? NEIGHBOR_PROGRESS_KEY : STORAGE_KEY,
        JSON.stringify(progress),
      );
    },
    [progressStorage],
  );

  return {
    completedNeighborCodes,
    completedProvinceCodes,
    hardMode,
    neighborMode,
    neighborProgressRef,
    progressRef,
    saveProgress,
    setCompletedNeighborCodes,
    setCompletedProvinceCodes,
    setHardMode,
    setNeighborMode,
  };
}
