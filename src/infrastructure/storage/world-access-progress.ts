import {
  CHINA_CAMPAIGN_RULESET_VERSION,
  hasCompletedChinaCampaign,
} from "../../domain/game/china-campaign.ts";
import { WORLD_ACCESS_KEY } from "./progress-keys.ts";
import type { ProgressStorage } from "./progress-storage.ts";

export type WorldAccessProgress = {
  unlockedAt: string;
  rulesetVersion: number;
};

export function parseWorldAccessProgress(
  raw: string | null | undefined,
): WorldAccessProgress | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<WorldAccessProgress>;
    if (
      typeof value.unlockedAt !== "string" ||
      !Number.isFinite(Date.parse(value.unlockedAt)) ||
      !Number.isInteger(value.rulesetVersion) ||
      (value.rulesetVersion ?? 0) < 1
    ) {
      return null;
    }
    return {
      unlockedAt: value.unlockedAt,
      rulesetVersion: value.rulesetVersion!,
    };
  } catch {
    return null;
  }
}

export function ensureWorldAccess(
  progressStorage: ProgressStorage,
  completedLevelIds?: Iterable<string>,
) {
  const existing = parseWorldAccessProgress(
    progressStorage.getItem(WORLD_ACCESS_KEY),
  );
  if (existing) return existing;

  if (!completedLevelIds || !hasCompletedChinaCampaign(completedLevelIds)) {
    return null;
  }

  const unlocked: WorldAccessProgress = {
    unlockedAt: new Date().toISOString(),
    rulesetVersion: CHINA_CAMPAIGN_RULESET_VERSION,
  };
  progressStorage.setItem(WORLD_ACCESS_KEY, JSON.stringify(unlocked));
  return unlocked;
}

export function canAccessWorld(
  progressStorage: ProgressStorage,
  completedLevelIds: Iterable<string>,
  isAdmin: boolean,
) {
  if (isAdmin) return true;
  return Boolean(ensureWorldAccess(progressStorage, completedLevelIds));
}

export function mergeWorldAccessProgress(
  firstRaw: string | undefined,
  secondRaw: string | undefined,
) {
  const records = [
    parseWorldAccessProgress(firstRaw),
    parseWorldAccessProgress(secondRaw),
  ].filter((record): record is WorldAccessProgress => Boolean(record));
  if (records.length === 0) return undefined;
  const earliest = records.sort((first, second) =>
    first.unlockedAt.localeCompare(second.unlockedAt)
  )[0];
  return JSON.stringify(earliest);
}
