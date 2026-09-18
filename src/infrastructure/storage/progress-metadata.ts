export type SyncMeta = {
  keys: Record<string, string>;
  scopes: Record<string, string>;
  resets: Record<string, string>;
  resetAll?: string;
};

export function emptyProgressMeta(): SyncMeta {
  return { keys: {}, scopes: {}, resets: {} };
}

export function parseProgressMeta(raw: string | null): SyncMeta {
  if (!raw) return emptyProgressMeta();
  try {
    const parsed = JSON.parse(raw) as Partial<SyncMeta>;
    return {
      keys: parsed.keys && typeof parsed.keys === "object" ? parsed.keys : {},
      scopes:
        parsed.scopes && typeof parsed.scopes === "object" ? parsed.scopes : {},
      resets:
        parsed.resets && typeof parsed.resets === "object" ? parsed.resets : {},
      resetAll:
        typeof parsed.resetAll === "string" ? parsed.resetAll : undefined,
    };
  } catch {
    return emptyProgressMeta();
  }
}

export function progressTimestamp(value: string | undefined) {
  const parsed = value ? Date.parse(value) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

export function latestProgressIso(...values: Array<string | undefined>) {
  const latest = Math.max(...values.map(progressTimestamp), 0);
  return latest ? new Date(latest).toISOString() : new Date(0).toISOString();
}

export function progressScope(key: string, itemId: string) {
  return `${key}:${itemId}`;
}
