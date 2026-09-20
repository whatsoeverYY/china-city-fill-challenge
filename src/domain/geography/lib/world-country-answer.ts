import type { WorldCountry } from "../data/world-countries.ts";
import { normalizePlaceName, stripAdministrativeSuffix } from "../../../shared/lib/place-name.ts";

function normalizeCountryAnswer(value: string) {
  return stripAdministrativeSuffix(normalizePlaceName(value)).toLocaleLowerCase();
}

export function worldCountryAnswerMatches(
  answer: string,
  country: WorldCountry,
) {
  const candidate = normalizeCountryAnswer(answer);
  if (!candidate) return false;
  return [country.name, country.englishName, ...country.aliases].some(
    (target) => normalizeCountryAnswer(target) === candidate,
  );
}
