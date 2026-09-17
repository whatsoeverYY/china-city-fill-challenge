import { routePath } from "@/shared/lib/app-path";

export type CityChallengeSettings = {
  hardMode: boolean;
  neighborMode: boolean;
};

export function cityChallengePath(
  provinceCode: string | null,
  settings: CityChallengeSettings,
) {
  const path = provinceCode
    ? routePath(`/city-fill/${provinceCode}`)
    : routePath("/");
  const search = new URLSearchParams();
  if (settings.neighborMode) search.set("scope", "neighbors");
  if (settings.hardMode) search.set("answer", "manual");
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

export function challengeSettingsFromSearch(
  search: string,
  fallback: CityChallengeSettings,
): CityChallengeSettings {
  const params = new URLSearchParams(search);
  return {
    neighborMode: params.has("scope")
      ? params.get("scope") === "neighbors"
      : fallback.neighborMode,
    hardMode: params.has("answer")
      ? params.get("answer") === "manual"
      : fallback.hardMode,
  };
}

export function replaceChallengeSettingsInUrl(
  provinceCode: string | null,
  settings: CityChallengeSettings,
) {
  window.history.replaceState(null, "", cityChallengePath(provinceCode, settings));
}
