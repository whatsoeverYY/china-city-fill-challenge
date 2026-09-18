import { isGauntletLevelId } from "../../domain/game/gauntlet-level-ids.ts";
import { CITY_MAP_RECENT_QUESTION_LIMIT } from "../../domain/game/gauntlet-rules.ts";
import { normalizeMistakeList } from "../../domain/game/mistakes.ts";
import { CURRENT_PROGRESS_SCHEMA_VERSION } from "./progress-config.ts";
import {
  emptyProgressMeta,
  latestProgressIso,
  parseProgressMeta,
  progressScope,
  progressTimestamp,
  type SyncMeta,
} from "./progress-metadata.ts";
import { mergeMistakeProgress } from "./mistake-progress.ts";
import {
  GAUNTLET_MISTAKES_KEY,
  GAUNTLET_PROGRESS_KEY,
  GAUNTLET_PROVINCE_SCOPE_KEY,
  HARD_MODE_KEY,
  HISTORY_KEYS,
  MAP_COMPLETION_MARKER,
  MAP_PROGRESS_KEYS,
  NEIGHBOR_MODE_KEY,
  NEIGHBOR_PROGRESS_KEY,
  PROGRESS_STORAGE_KEYS,
  STORAGE_KEY,
  type ProgressStorageKey,
} from "./progress-keys.ts";

export {
  emptyProgressMeta,
  latestProgressIso,
  parseProgressMeta,
  progressScope,
  progressTimestamp,
} from "./progress-metadata.ts";
export type { SyncMeta } from "./progress-metadata.ts";

export type ProgressSnapshot = {
  schemaVersion: number;
  savedAt: string;
  resetAt?: string;
  values: Partial<Record<ProgressStorageKey, string>> &
    Record<string, string | undefined>;
  meta: SyncMeta;
};

export function parseMapProgress(raw: string | null) {
  if (!raw) return {} as Record<string, string[]>;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string[]] =>
          Array.isArray(entry[1]) &&
          entry[1].every((item) => typeof item === "string"),
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

function normalizeMistakeValue(raw: string) {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return JSON.stringify(normalizeMistakeList(parsed));
  } catch {
    return "[]";
  }
}

export function progressPayloadByteLength(snapshot: ProgressSnapshot) {
  return new TextEncoder().encode(JSON.stringify(snapshot)).byteLength;
}

export function assertSupportedProgressVersion(
  rowSchemaVersion: number | null | undefined,
  payload: unknown,
) {
  const payloadVersion = payload && typeof payload === "object" &&
    "schemaVersion" in payload &&
    typeof payload.schemaVersion === "number"
    ? payload.schemaVersion
    : CURRENT_PROGRESS_SCHEMA_VERSION;
  const newestVersion = Math.max(
    rowSchemaVersion ?? CURRENT_PROGRESS_SCHEMA_VERSION,
    payloadVersion,
  );
  if (newestVersion > CURRENT_PROGRESS_SCHEMA_VERSION) {
    throw new Error("云存档来自更新版本，请刷新页面后再同步");
  }
}

export function createResetProgressSnapshot(
  resetAt = new Date().toISOString(),
): ProgressSnapshot {
  return {
    schemaVersion: CURRENT_PROGRESS_SCHEMA_VERSION,
    savedAt: resetAt,
    resetAt,
    values: {},
    meta: { ...emptyProgressMeta(), resetAll: resetAt },
  };
}

export function normalizeProgressSnapshot(value: unknown): ProgressSnapshot {
  if (!value || typeof value !== "object") {
    return {
      schemaVersion: CURRENT_PROGRESS_SCHEMA_VERSION,
      savedAt: new Date(0).toISOString(),
      values: {},
      meta: emptyProgressMeta(),
    };
  }
  const candidate = value as Partial<ProgressSnapshot>;
  const meta = parseProgressMeta(JSON.stringify(candidate.meta ?? {}));
  const resetAt = latestProgressIso(
    typeof candidate.resetAt === "string" ? candidate.resetAt : undefined,
    meta.resetAll,
  );
  const rawValues = candidate.values && typeof candidate.values === "object"
    ? candidate.values
    : {};
  const values: ProgressSnapshot["values"] = {};
  for (const [key, rawValue] of Object.entries(rawValues)) {
    if (typeof rawValue !== "string") continue;
    values[key] = key === GAUNTLET_MISTAKES_KEY
      ? normalizeMistakeValue(rawValue)
      : rawValue;
  }
  return {
    schemaVersion:
      typeof candidate.schemaVersion === "number" &&
      Number.isInteger(candidate.schemaVersion) &&
      candidate.schemaVersion > 0
        ? candidate.schemaVersion
        : CURRENT_PROGRESS_SCHEMA_VERSION,
    savedAt:
      typeof candidate.savedAt === "string"
        ? candidate.savedAt
        : new Date(0).toISOString(),
    resetAt: progressTimestamp(resetAt) ? resetAt : undefined,
    values,
    meta: progressTimestamp(resetAt) ? { ...meta, resetAll: resetAt } : meta,
  };
}

function applyResetBoundary(
  snapshot: ProgressSnapshot,
  resetAt: string,
): ProgressSnapshot {
  const resetTime = progressTimestamp(resetAt);
  if (!resetTime) return snapshot;
  if (progressTimestamp(snapshot.resetAt) < resetTime) {
    return createResetProgressSnapshot(resetAt);
  }

  const values: ProgressSnapshot["values"] = {};
  for (const key of Object.keys(snapshot.values)) {
    const value = snapshot.values[key];
    if (typeof value !== "string") continue;

    if (MAP_PROGRESS_KEYS.has(key)) {
      const mapValue = parseMapProgress(value);
      const keptEntries = Object.entries(mapValue).filter(([provinceCode]) =>
        progressTimestamp(
          snapshot.meta.scopes[progressScope(key, provinceCode)] ??
          snapshot.meta.keys[key],
        ) > resetTime,
      );
      if (keptEntries.length > 0) {
        values[key] = JSON.stringify(Object.fromEntries(keptEntries));
      }
      continue;
    }

    if (progressTimestamp(snapshot.meta.keys[key]) > resetTime) {
      values[key] = value;
    }
  }

  return {
    ...snapshot,
    savedAt: latestProgressIso(resetAt, ...Object.values(snapshot.meta.keys)),
    resetAt,
    values,
    meta: { ...snapshot.meta, resetAll: resetAt },
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
    const localTime = progressTimestamp(
      local.meta.scopes[scope] ?? local.meta.keys[key],
    );
    const remoteTime = progressTimestamp(
      remote.meta.scopes[scope] ?? remote.meta.keys[key],
    );
    const localReset = progressTimestamp(local.meta.resets[scope]);
    const remoteReset = progressTimestamp(remote.meta.resets[scope]);
    const localValue = localMap[provinceCode] ?? [];
    const remoteValue = remoteMap[provinceCode] ?? [];

    if (localReset && !remoteReset) {
      mergedMap[provinceCode] = localValue;
    } else if (remoteReset && !localReset) {
      mergedMap[provinceCode] = remoteValue;
    } else if (localReset > remoteTime) {
      mergedMap[provinceCode] = localValue;
    } else if (remoteReset > localTime) {
      mergedMap[provinceCode] = remoteValue;
    } else if (!localTime) {
      mergedMap[provinceCode] = remoteValue;
    } else if (!remoteTime) {
      mergedMap[provinceCode] = localValue;
    } else {
      const complete = localValue.includes(MAP_COMPLETION_MARKER) ||
        remoteValue.includes(MAP_COMPLETION_MARKER);
      const names = Array.from(
        new Set(
          [...localValue, ...remoteValue].filter(
            (item) => item !== MAP_COMPLETION_MARKER,
          ),
        ),
      );
      mergedMap[provinceCode] = complete
        ? [MAP_COMPLETION_MARKER, ...names]
        : names;
    }

    mergedMeta.scopes[scope] = latestProgressIso(
      local.meta.scopes[scope] ?? local.meta.keys[key],
      remote.meta.scopes[scope] ?? remote.meta.keys[key],
    );
    const resetAt = latestProgressIso(
      local.meta.resets[scope],
      remote.meta.resets[scope],
    );
    if (progressTimestamp(resetAt)) mergedMeta.resets[scope] = resetAt;
  }
  return JSON.stringify(mergedMap);
}

function uniqueRecent(values: string[]) {
  return values
    .filter((value, index) => values.lastIndexOf(value) === index)
    .slice(-CITY_MAP_RECENT_QUESTION_LIMIT);
}

export function mergeProgressSnapshots(
  localValue: unknown,
  remoteValue: unknown,
): ProgressSnapshot {
  const normalizedLocal = normalizeProgressSnapshot(localValue);
  const normalizedRemote = normalizeProgressSnapshot(remoteValue);
  const resetAt = latestProgressIso(
    normalizedLocal.resetAt,
    normalizedRemote.resetAt,
  );
  const local = applyResetBoundary(normalizedLocal, resetAt);
  const remote = applyResetBoundary(normalizedRemote, resetAt);
  const meta = emptyProgressMeta();
  const values: ProgressSnapshot["values"] = {};

  if (progressTimestamp(resetAt)) meta.resetAll = resetAt;

  const allValueKeys = new Set([
    ...Object.keys(local.values),
    ...Object.keys(remote.values),
    ...PROGRESS_STORAGE_KEYS,
  ]);
  for (const key of allValueKeys) {
    meta.keys[key] = latestProgressIso(local.meta.keys[key], remote.meta.keys[key]);
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
        ...parseStringList(local.values[GAUNTLET_PROGRESS_KEY]).filter(
          isGauntletLevelId,
        ),
        ...parseStringList(remote.values[GAUNTLET_PROGRESS_KEY]).filter(
          isGauntletLevelId,
        ),
      ]),
    ).sort(),
  );

  values[GAUNTLET_MISTAKES_KEY] = mergeMistakeProgress(local, remote, meta);

  for (const key of HISTORY_KEYS) {
    const typedKey = key as ProgressStorageKey;
    const localIsNewer = progressTimestamp(local.meta.keys[key]) >=
      progressTimestamp(remote.meta.keys[key]);
    const older = localIsNewer ? remote.values[typedKey] : local.values[typedKey];
    const newer = localIsNewer ? local.values[typedKey] : remote.values[typedKey];
    values[typedKey] = JSON.stringify(
      uniqueRecent([...parseStringList(older), ...parseStringList(newer)]),
    );
  }

  for (const key of [
    HARD_MODE_KEY,
    NEIGHBOR_MODE_KEY,
    GAUNTLET_PROVINCE_SCOPE_KEY,
  ] as const) {
    const localTime = progressTimestamp(local.meta.keys[key]);
    const remoteTime = progressTimestamp(remote.meta.keys[key]);
    values[key] = localTime >= remoteTime
      ? local.values[key] ?? remote.values[key]
      : remote.values[key] ?? local.values[key];
  }

  for (const key of allValueKeys) {
    if ((PROGRESS_STORAGE_KEYS as readonly string[]).includes(key)) continue;
    const localTime = progressTimestamp(local.meta.keys[key]);
    const remoteTime = progressTimestamp(remote.meta.keys[key]);
    values[key] = localTime >= remoteTime
      ? local.values[key] ?? remote.values[key]
      : remote.values[key] ?? local.values[key];
  }

  return {
    schemaVersion: CURRENT_PROGRESS_SCHEMA_VERSION,
    savedAt: latestProgressIso(
      resetAt,
      local.savedAt,
      remote.savedAt,
      ...Object.values(meta.keys),
    ),
    resetAt: progressTimestamp(resetAt) ? resetAt : undefined,
    values,
    meta,
  };
}
