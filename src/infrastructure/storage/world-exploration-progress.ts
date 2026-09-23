import type { WorldCountryId } from "../../domain/geography/data/world-countries.ts";

const WORLD_COUNTRY_ID_PATTERN = /^country:\d{3}$/u;

function isStoredWorldCountryId(value: unknown): value is WorldCountryId {
  return typeof value === "string" && WORLD_COUNTRY_ID_PATTERN.test(value);
}

export function parseWorldExplorationProgress(
  raw: string | null | undefined,
): WorldCountryId[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw) as unknown;
    return Array.isArray(value)
      ? Array.from(new Set(value.filter(isStoredWorldCountryId)))
      : [];
  } catch {
    return [];
  }
}

export function mergeWorldExplorationProgress(
  firstRaw: string | undefined,
  secondRaw: string | undefined,
) {
  return JSON.stringify(Array.from(new Set([
    ...parseWorldExplorationProgress(firstRaw),
    ...parseWorldExplorationProgress(secondRaw),
  ])).sort());
}
