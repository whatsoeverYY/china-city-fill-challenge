import {
  MAP_PROGRESS_KEYS,
  PROGRESS_STORAGE_KEYS,
} from "./progress-keys.ts";
import { CURRENT_PROGRESS_SCHEMA_VERSION } from "./progress-config.ts";
import {
  latestProgressIso,
  parseMapProgress,
  parseProgressMeta,
  progressScope,
  progressTimestamp,
  type ProgressSnapshot,
  type SyncMeta,
} from "./progress-snapshot.ts";

export * from "./progress-keys.ts";
export {
  assertSupportedProgressVersion,
  createResetProgressSnapshot,
  mergeProgressSnapshots,
  normalizeProgressSnapshot,
  progressPayloadByteLength,
} from "./progress-snapshot.ts";
export type { ProgressSnapshot } from "./progress-snapshot.ts";

export type ProgressStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

const USER_NAMESPACE = "china-city-fill-user-v1";
const SYNC_META_KEY = "__sync_meta__";
export const PROGRESS_STORAGE_EVENT = "china-city-fill-progress-changed";
function userPrefix(userId: string) {
  return `${USER_NAMESPACE}:${userId}:`;
}

function userKey(userId: string, key: string) {
  return `${userPrefix(userId)}${key}`;
}

function updateMetadataForWrite(
  meta: SyncMeta,
  key: string,
  previousValue: string | null,
  nextValue: string,
  now: string,
) {
  meta.keys[key] = now;
  if (!MAP_PROGRESS_KEYS.has(key)) return;

  const previous = parseMapProgress(previousValue);
  const next = parseMapProgress(nextValue);
  for (const provinceCode of new Set([
    ...Object.keys(previous),
    ...Object.keys(next),
  ])) {
    if (JSON.stringify(previous[provinceCode] ?? []) === JSON.stringify(next[provinceCode] ?? [])) {
      continue;
    }
    const scope = progressScope(key, provinceCode);
    meta.scopes[scope] = now;
    if ((previous[provinceCode]?.length ?? 0) > 0 && (next[provinceCode]?.length ?? 0) === 0) {
      meta.resets[scope] = now;
    }
  }
}

export function createTrialProgressStorage(memory: Map<string, string>): ProgressStorage {
  return {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => {
      memory.set(key, value);
    },
  };
}

export function createUserProgressStorage(
  userId: string,
): ProgressStorage {
  return {
    getItem: (key) => localStorage.getItem(userKey(userId, key)),
    setItem: (key, value) => {
      const storageKey = userKey(userId, key);
      const previousValue = localStorage.getItem(storageKey);
      if (previousValue === value) return;
      localStorage.setItem(storageKey, value);
      const metaKey = userKey(userId, SYNC_META_KEY);
      const meta = parseProgressMeta(localStorage.getItem(metaKey));
      updateMetadataForWrite(
        meta,
        key,
        previousValue,
        value,
        new Date().toISOString(),
      );
      localStorage.setItem(metaKey, JSON.stringify(meta));
      window.dispatchEvent(
        new CustomEvent(PROGRESS_STORAGE_EVENT, { detail: { userId } }),
      );
    },
  };
}

export function readLocalProgressSnapshot(userId: string): ProgressSnapshot {
  const metaKey = userKey(userId, SYNC_META_KEY);
  const meta = parseProgressMeta(localStorage.getItem(metaKey));
  const values: ProgressSnapshot["values"] = {};
  for (const key of PROGRESS_STORAGE_KEYS) {
    const value = localStorage.getItem(userKey(userId, key));
    if (value !== null) values[key] = value;
  }
  localStorage.setItem(metaKey, JSON.stringify(meta));
  return {
    schemaVersion: CURRENT_PROGRESS_SCHEMA_VERSION,
    savedAt: latestProgressIso(meta.resetAll, ...Object.values(meta.keys)),
    resetAt: meta.resetAll,
    values,
    meta,
  };
}

export function writeLocalProgressSnapshot(
  userId: string,
  snapshot: ProgressSnapshot,
) {
  for (const key of PROGRESS_STORAGE_KEYS) {
    const value = snapshot.values[key];
    if (typeof value === "string") {
      localStorage.setItem(userKey(userId, key), value);
    } else {
      localStorage.removeItem(userKey(userId, key));
    }
  }
  const resetAt = latestProgressIso(snapshot.resetAt, snapshot.meta.resetAll);
  const meta = progressTimestamp(resetAt)
    ? { ...snapshot.meta, resetAll: resetAt }
    : snapshot.meta;
  localStorage.setItem(userKey(userId, SYNC_META_KEY), JSON.stringify(meta));
}
