import {
  GAUNTLET_MISTAKES_KEY,
  MAP_COMPLETION_MARKER,
  MAP_PROGRESS_KEYS,
  PROGRESS_STORAGE_KEYS,
  type MapProgressKey,
} from "./progress-keys.ts";
import { parseMistakeProgress } from "./mistake-progress.ts";
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
export { parseMistakeProgress } from "./mistake-progress.ts";
export type { ProgressSnapshot } from "./progress-snapshot.ts";

export type ProgressStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  updateItem: (
    key: string,
    resolveValue: (previousValue: string | null) => string,
  ) => string;
  setMapProgress: (
    key: MapProgressKey,
    provinceCode: string,
    regionIds: string[],
  ) => void;
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

export function isUserProgressStorageKey(
  userId: string,
  storageKey: string | null,
) {
  return storageKey !== null && PROGRESS_STORAGE_KEYS.some(
    (key) => storageKey === userKey(userId, key),
  );
}

function mergeProvinceProgressWrite(
  previousValue: string | null,
  provinceCode: string,
  nextRegionIds: string[],
  observedRegionIds: string[],
) {
  const previous = parseMapProgress(previousValue);
  if (nextRegionIds.length === 0) {
    return JSON.stringify({ ...previous, [provinceCode]: [] });
  }

  const observedIds = new Set(observedRegionIds.filter(
    (id) => id === MAP_COMPLETION_MARKER || /^\d+$/.test(id),
  ));
  const addedRegionIds = nextRegionIds.filter(
    (id) => !observedIds.has(id),
  );
  const combinedRegionIds = Array.from(new Set([
    ...(previous[provinceCode] ?? []),
    ...addedRegionIds,
  ])).filter(
    (id) => id === MAP_COMPLETION_MARKER || /^\d+$/.test(id),
  );
  const regionIds = combinedRegionIds.includes(MAP_COMPLETION_MARKER)
    ? [
        MAP_COMPLETION_MARKER,
        ...combinedRegionIds.filter((id) => id !== MAP_COMPLETION_MARKER),
      ]
    : combinedRegionIds;

  return JSON.stringify({ ...previous, [provinceCode]: regionIds });
}

function updateMetadataForWrite(
  meta: SyncMeta,
  key: string,
  previousValue: string | null,
  nextValue: string,
  now: string,
) {
  meta.keys[key] = now;
  if (MAP_PROGRESS_KEYS.has(key)) {
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
    return;
  }
  if (key !== GAUNTLET_MISTAKES_KEY) return;

  const previous = new Map(
    parseMistakeProgress(previousValue).map((item) => [item.id, item]),
  );
  const next = new Map(
    parseMistakeProgress(nextValue).map((item) => [item.id, item]),
  );
  for (const id of new Set([...previous.keys(), ...next.keys()])) {
    if (JSON.stringify(previous.get(id)) === JSON.stringify(next.get(id))) continue;
    const scope = progressScope(key, id);
    meta.scopes[scope] = now;
    if (previous.has(id) && !next.has(id)) meta.resets[scope] = now;
  }
}

export function createTrialProgressStorage(memory: Map<string, string>): ProgressStorage {
  return {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => {
      memory.set(key, value);
    },
    updateItem: (key, resolveValue) => {
      const nextValue = resolveValue(memory.get(key) ?? null);
      memory.set(key, nextValue);
      return nextValue;
    },
    setMapProgress: (key, provinceCode, regionIds) => {
      memory.set(
        key,
        mergeProvinceProgressWrite(
          memory.get(key) ?? null,
          provinceCode,
          regionIds,
          parseMapProgress(memory.get(key) ?? null)[provinceCode] ?? [],
        ),
      );
    },
  };
}

export function createUserProgressStorage(
  userId: string,
): ProgressStorage {
  const observedMaps = new Map<
    MapProgressKey,
    Record<string, string[]>
  >();
  const writeItem = (
    key: string,
    resolveValue: (previousValue: string | null) => string,
  ) => {
    const scopedStorageKey = userKey(userId, key);
    const previousValue = localStorage.getItem(scopedStorageKey);
    const nextValue = resolveValue(previousValue);
    if (previousValue === nextValue) return nextValue;
    localStorage.setItem(scopedStorageKey, nextValue);
    const metaKey = userKey(userId, SYNC_META_KEY);
    const meta = parseProgressMeta(localStorage.getItem(metaKey));
    updateMetadataForWrite(
      meta,
      key,
      previousValue,
      nextValue,
      new Date().toISOString(),
    );
    localStorage.setItem(metaKey, JSON.stringify(meta));
    window.dispatchEvent(
      new CustomEvent(PROGRESS_STORAGE_EVENT, { detail: { userId } }),
    );
    return nextValue;
  };

  const observeMapValue = (key: string, value: string | null) => {
    if (MAP_PROGRESS_KEYS.has(key)) {
      observedMaps.set(key as MapProgressKey, parseMapProgress(value));
    }
    return value;
  };

  return {
    getItem: (key) => observeMapValue(
      key,
      localStorage.getItem(userKey(userId, key)),
    ),
    setItem: (key, value) => {
      observeMapValue(key, writeItem(key, () => value));
    },
    updateItem: (key, resolveValue) => {
      const nextValue = writeItem(key, resolveValue);
      observeMapValue(key, nextValue);
      return nextValue;
    },
    setMapProgress: (key, provinceCode, regionIds) => {
      const observedRegionIds = observedMaps.get(key)?.[provinceCode] ?? [];
      const nextValue = writeItem(
        key,
        (previousValue) => mergeProvinceProgressWrite(
          previousValue,
          provinceCode,
          regionIds,
          observedRegionIds,
        ),
      );
      observeMapValue(key, nextValue);
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
