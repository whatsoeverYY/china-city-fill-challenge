export const STORAGE_KEY = "china-city-fill-progress-v1";
export const HARD_MODE_KEY = "china-city-fill-hard-mode-v1";
export const NEIGHBOR_MODE_KEY = "china-city-fill-neighbor-mode-v1";
export const NEIGHBOR_PROGRESS_KEY = "china-city-fill-neighbor-progress-v1";
export const GAUNTLET_PROGRESS_KEY = "china-city-fill-gauntlet-progress-v5";
export const LEGACY_GAUNTLET_PROGRESS_KEYS = [
  "china-city-fill-gauntlet-progress-v4",
  "china-city-fill-gauntlet-progress-v3",
  "china-city-fill-gauntlet-progress-v2",
  "china-city-fill-gauntlet-progress-v1",
] as const;
export const GAUNTLET_MISTAKES_KEY = "china-city-fill-gauntlet-mistakes-v1";
export const GAUNTLET_LEVEL_13_HISTORY_KEY =
  "china-city-fill-level-13-history-v1";
export const GAUNTLET_LEVEL_25_HISTORY_KEY =
  "china-city-fill-level-25-history-v1";

export const PROGRESS_STORAGE_KEYS = [
  STORAGE_KEY,
  HARD_MODE_KEY,
  NEIGHBOR_MODE_KEY,
  NEIGHBOR_PROGRESS_KEY,
  GAUNTLET_PROGRESS_KEY,
  GAUNTLET_MISTAKES_KEY,
  GAUNTLET_LEVEL_13_HISTORY_KEY,
  GAUNTLET_LEVEL_25_HISTORY_KEY,
] as const;

export type ProgressStorageKey = (typeof PROGRESS_STORAGE_KEYS)[number];

export type ProgressStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

type SyncMeta = {
  keys: Record<string, string>;
  scopes: Record<string, string>;
  resets: Record<string, string>;
};

export type ProgressSnapshot = {
  schemaVersion: 1;
  savedAt: string;
  values: Partial<Record<ProgressStorageKey, string>>;
  meta: SyncMeta;
};

const USER_NAMESPACE = "china-city-fill-user-v1";
const SYNC_META_KEY = "__sync_meta__";
const LEGACY_CLAIM_KEY = "china-city-fill-legacy-claimed-by-v1";
export const PROGRESS_STORAGE_EVENT = "china-city-fill-progress-changed";
const MAP_PROGRESS_KEYS = new Set<string>([STORAGE_KEY, NEIGHBOR_PROGRESS_KEY]);
const HISTORY_KEYS = new Set<string>([
  GAUNTLET_LEVEL_13_HISTORY_KEY,
  GAUNTLET_LEVEL_25_HISTORY_KEY,
]);

function emptyMeta(): SyncMeta {
  return { keys: {}, scopes: {}, resets: {} };
}

function userPrefix(userId: string) {
  return `${USER_NAMESPACE}:${userId}:`;
}

function userKey(userId: string, key: string) {
  return `${userPrefix(userId)}${key}`;
}

function parseMeta(raw: string | null): SyncMeta {
  if (!raw) return emptyMeta();
  try {
    const parsed = JSON.parse(raw) as Partial<SyncMeta>;
    return {
      keys: parsed.keys && typeof parsed.keys === "object" ? parsed.keys : {},
      scopes:
        parsed.scopes && typeof parsed.scopes === "object" ? parsed.scopes : {},
      resets:
        parsed.resets && typeof parsed.resets === "object" ? parsed.resets : {},
    };
  } catch {
    return emptyMeta();
  }
}

function parseMapProgress(raw: string | null) {
  if (!raw) return {} as Record<string, string[]>;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string[]] =>
          Array.isArray(entry[1]) && entry[1].every((item) => typeof item === "string"),
      ),
    );
  } catch {
    return {};
  }
}

function parseStringList(raw: string | undefined) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function parseNumberList(raw: string | undefined) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is number => Number.isInteger(item))
      : [];
  } catch {
    return [];
  }
}

function timestamp(value: string | undefined) {
  const parsed = value ? Date.parse(value) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function latestIso(...values: Array<string | undefined>) {
  const latest = Math.max(...values.map(timestamp), 0);
  return latest ? new Date(latest).toISOString() : new Date(0).toISOString();
}

function progressScope(key: string, provinceCode: string) {
  return `${key}:${provinceCode}`;
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

function migrateGauntletProgress(userId: string, meta: SyncMeta) {
  const currentKey = userKey(userId, GAUNTLET_PROGRESS_KEY);
  if (localStorage.getItem(currentKey)) return;

  for (const [index, legacyKey] of LEGACY_GAUNTLET_PROGRESS_KEYS.entries()) {
    const raw = localStorage.getItem(userKey(userId, legacyKey));
    if (!raw) continue;
    const legacyBossLevel = [25, 24, 21, 20][index];
    const migrated = parseNumberList(raw).map((level) =>
      level === legacyBossLevel ? 26 : level,
    );
    localStorage.setItem(currentKey, JSON.stringify(migrated));
    meta.keys[GAUNTLET_PROGRESS_KEY] = new Date().toISOString();
    return;
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
      const meta = parseMeta(localStorage.getItem(metaKey));
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

export function claimLegacyProgress(userId: string) {
  const hasUserProgress = PROGRESS_STORAGE_KEYS.some((key) =>
    localStorage.getItem(userKey(userId, key)),
  );
  if (hasUserProgress) return false;

  const claimedBy = localStorage.getItem(LEGACY_CLAIM_KEY);
  if (claimedBy && claimedBy !== userId) return false;

  const now = new Date().toISOString();
  const meta = emptyMeta();
  let copied = false;
  const legacyKeys = [...PROGRESS_STORAGE_KEYS, ...LEGACY_GAUNTLET_PROGRESS_KEYS];
  for (const key of legacyKeys) {
    const value = localStorage.getItem(key);
    if (value === null) continue;
    localStorage.setItem(userKey(userId, key), value);
    meta.keys[key] = now;
    if (MAP_PROGRESS_KEYS.has(key)) {
      for (const provinceCode of Object.keys(parseMapProgress(value))) {
        meta.scopes[progressScope(key, provinceCode)] = now;
      }
    }
    copied = true;
  }
  if (!copied) return false;

  migrateGauntletProgress(userId, meta);
  localStorage.setItem(userKey(userId, SYNC_META_KEY), JSON.stringify(meta));
  localStorage.setItem(LEGACY_CLAIM_KEY, userId);
  return true;
}

export function readLocalProgressSnapshot(userId: string): ProgressSnapshot {
  const metaKey = userKey(userId, SYNC_META_KEY);
  const meta = parseMeta(localStorage.getItem(metaKey));
  migrateGauntletProgress(userId, meta);
  const values: ProgressSnapshot["values"] = {};
  for (const key of PROGRESS_STORAGE_KEYS) {
    const value = localStorage.getItem(userKey(userId, key));
    if (value !== null) values[key] = value;
  }
  localStorage.setItem(metaKey, JSON.stringify(meta));
  return {
    schemaVersion: 1,
    savedAt: latestIso(...Object.values(meta.keys)),
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
  localStorage.setItem(
    userKey(userId, SYNC_META_KEY),
    JSON.stringify(snapshot.meta),
  );
}

export function normalizeProgressSnapshot(value: unknown): ProgressSnapshot {
  if (!value || typeof value !== "object") {
    return { schemaVersion: 1, savedAt: new Date(0).toISOString(), values: {}, meta: emptyMeta() };
  }
  const candidate = value as Partial<ProgressSnapshot>;
  const rawValues = candidate.values && typeof candidate.values === "object"
    ? candidate.values
    : {};
  const values: ProgressSnapshot["values"] = {};
  for (const key of PROGRESS_STORAGE_KEYS) {
    if (typeof rawValues[key] === "string") values[key] = rawValues[key];
  }
  return {
    schemaVersion: 1,
    savedAt:
      typeof candidate.savedAt === "string"
        ? candidate.savedAt
        : new Date(0).toISOString(),
    values,
    meta: parseMeta(JSON.stringify(candidate.meta ?? {})),
  };
}

function mergeMapValue(
  key: typeof STORAGE_KEY | typeof NEIGHBOR_PROGRESS_KEY,
  local: ProgressSnapshot,
  remote: ProgressSnapshot,
  mergedMeta: SyncMeta,
) {
  const localMap = parseMapProgress(local.values[key] ?? null);
  const remoteMap = parseMapProgress(remote.values[key] ?? null);
  const mergedMap: Record<string, string[]> = {};

  for (const provinceCode of new Set([
    ...Object.keys(localMap),
    ...Object.keys(remoteMap),
  ])) {
    const scope = progressScope(key, provinceCode);
    const localTime = timestamp(local.meta.scopes[scope] ?? local.meta.keys[key]);
    const remoteTime = timestamp(remote.meta.scopes[scope] ?? remote.meta.keys[key]);
    const localReset = timestamp(local.meta.resets[scope]);
    const remoteReset = timestamp(remote.meta.resets[scope]);
    const localValue = localMap[provinceCode] ?? [];
    const remoteValue = remoteMap[provinceCode] ?? [];

    if (localReset > remoteTime) {
      mergedMap[provinceCode] = localValue;
    } else if (remoteReset > localTime) {
      mergedMap[provinceCode] = remoteValue;
    } else if (!localTime) {
      mergedMap[provinceCode] = remoteValue;
    } else if (!remoteTime) {
      mergedMap[provinceCode] = localValue;
    } else {
      const complete = localValue.includes("__complete__") || remoteValue.includes("__complete__");
      const names = Array.from(
        new Set([...localValue, ...remoteValue].filter((item) => item !== "__complete__")),
      );
      mergedMap[provinceCode] = complete ? ["__complete__", ...names] : names;
    }

    mergedMeta.scopes[scope] = latestIso(
      local.meta.scopes[scope] ?? local.meta.keys[key],
      remote.meta.scopes[scope] ?? remote.meta.keys[key],
    );
    const resetAt = latestIso(local.meta.resets[scope], remote.meta.resets[scope]);
    if (timestamp(resetAt)) mergedMeta.resets[scope] = resetAt;
  }
  return JSON.stringify(mergedMap);
}

function uniqueRecent(values: string[]) {
  return values.filter((value, index) => values.lastIndexOf(value) === index).slice(-90);
}

export function mergeProgressSnapshots(
  localValue: unknown,
  remoteValue: unknown,
): ProgressSnapshot {
  const local = normalizeProgressSnapshot(localValue);
  const remote = normalizeProgressSnapshot(remoteValue);
  const meta = emptyMeta();
  const values: ProgressSnapshot["values"] = {};

  for (const key of PROGRESS_STORAGE_KEYS) {
    meta.keys[key] = latestIso(local.meta.keys[key], remote.meta.keys[key]);
  }
  values[STORAGE_KEY] = mergeMapValue(STORAGE_KEY, local, remote, meta);
  values[NEIGHBOR_PROGRESS_KEY] = mergeMapValue(
    NEIGHBOR_PROGRESS_KEY,
    local,
    remote,
    meta,
  );

  values[GAUNTLET_PROGRESS_KEY] = JSON.stringify(
    Array.from(
      new Set([
        ...parseNumberList(local.values[GAUNTLET_PROGRESS_KEY]),
        ...parseNumberList(remote.values[GAUNTLET_PROGRESS_KEY]),
      ]),
    ).sort((a, b) => a - b),
  );

  for (const key of HISTORY_KEYS) {
    const typedKey = key as ProgressStorageKey;
    const localIsNewer = timestamp(local.meta.keys[key]) >= timestamp(remote.meta.keys[key]);
    const older = localIsNewer ? remote.values[typedKey] : local.values[typedKey];
    const newer = localIsNewer ? local.values[typedKey] : remote.values[typedKey];
    values[typedKey] = JSON.stringify(
      uniqueRecent([...parseStringList(older), ...parseStringList(newer)]),
    );
  }

  for (const key of [
    HARD_MODE_KEY,
    NEIGHBOR_MODE_KEY,
    GAUNTLET_MISTAKES_KEY,
  ] as const) {
    const localTime = timestamp(local.meta.keys[key]);
    const remoteTime = timestamp(remote.meta.keys[key]);
    values[key] = localTime >= remoteTime
      ? local.values[key] ?? remote.values[key]
      : remote.values[key] ?? local.values[key];
  }

  return {
    schemaVersion: 1,
    savedAt: latestIso(local.savedAt, remote.savedAt, ...Object.values(meta.keys)),
    values,
    meta,
  };
}
