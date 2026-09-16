import { mapFeatureId, type MapData } from "../../map/model/map-data.ts";
import type { CityAnswer } from "./city-challenge-types.ts";

export function createCityAnswers(map: MapData | null): CityAnswer[] {
  return map?.features.map((feature) => ({
    id: mapFeatureId(feature),
    name: feature.properties.name,
    provinceCode: feature.properties.provinceCode ?? "",
  })) ?? [];
}

export function normalizeStoredRegionIds(
  values: Iterable<string>,
  answers: CityAnswer[],
) {
  const validIds = new Set(answers.map((answer) => answer.id));
  const idByName = new Map(answers.map((answer) => [answer.name, answer.id]));
  return new Set(
    Array.from(values)
      .map((value) => validIds.has(value) ? value : idByName.get(value))
      .filter((value): value is string => Boolean(value)),
  );
}
