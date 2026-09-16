import { NO_CITY_NEIGHBOR_ANSWERS } from "../../../domain/geography/data/city-neighbor-rules.ts";
import {
  normalizePlaceName,
  stripAdministrativeSuffix,
} from "../../../shared/lib/place-name.ts";
import {
  mapFeatureId,
  type MapData,
  type MapFeature,
  type Position,
} from "../../map/model/map-data.ts";

export type CityNeighborQuestion = {
  id: string;
  city: string;
  regionId: string;
  neighbors: Array<{
    id: string;
    name: string;
  }>;
};

const ANSWER_SEPARATOR = /[\s、,，;；/|]+/u;

function visitPositions(value: unknown, callback: (position: Position) => void) {
  if (!Array.isArray(value)) return;
  if (
    value.length >= 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number"
  ) {
    callback(value as Position);
    return;
  }
  value.forEach((part) => visitPositions(part, callback));
}

function featureVertexKeys(feature: MapFeature) {
  const keys = new Set<string>();
  visitPositions(feature.geometry.coordinates, ([longitude, latitude]) => {
    keys.add(`${longitude.toFixed(6)},${latitude.toFixed(6)}`);
  });
  return keys;
}

function pairKey(left: string, right: string) {
  return left < right ? `${left}:${right}` : `${right}:${left}`;
}

/**
 * Derives land adjacency from shared boundary vertices in one province map.
 * A single shared point is deliberately ignored because it is only a corner
 * touch; two or more shared vertices represent a shared boundary segment.
 */
export function createCityNeighborQuestionIndex(map: MapData) {
  const featuresById = new Map(
    map.features.map((feature) => [mapFeatureId(feature), feature]),
  );
  const regionIdsByVertex = new Map<string, string[]>();

  for (const [regionId, feature] of featuresById) {
    for (const vertexKey of featureVertexKeys(feature)) {
      const regionIds = regionIdsByVertex.get(vertexKey) ?? [];
      regionIds.push(regionId);
      regionIdsByVertex.set(vertexKey, regionIds);
    }
  }

  const sharedVertexCounts = new Map<string, number>();
  for (const regionIds of regionIdsByVertex.values()) {
    for (let leftIndex = 0; leftIndex < regionIds.length; leftIndex += 1) {
      for (
        let rightIndex = leftIndex + 1;
        rightIndex < regionIds.length;
        rightIndex += 1
      ) {
        const key = pairKey(regionIds[leftIndex], regionIds[rightIndex]);
        sharedVertexCounts.set(key, (sharedVertexCounts.get(key) ?? 0) + 1);
      }
    }
  }

  const neighborIdsByRegion = new Map<string, Set<string>>();
  for (const [key, sharedVertexCount] of sharedVertexCounts) {
    if (sharedVertexCount < 2) continue;
    const [leftId, rightId] = key.split(":");
    const leftNeighbors = neighborIdsByRegion.get(leftId) ?? new Set<string>();
    const rightNeighbors = neighborIdsByRegion.get(rightId) ?? new Set<string>();
    leftNeighbors.add(rightId);
    rightNeighbors.add(leftId);
    neighborIdsByRegion.set(leftId, leftNeighbors);
    neighborIdsByRegion.set(rightId, rightNeighbors);
  }

  return new Map(
    Array.from(featuresById.entries(), ([regionId, feature]) => {
      const neighbors = Array.from(
        neighborIdsByRegion.get(regionId) ?? [],
        (neighborId) => {
          const neighbor = featuresById.get(neighborId);
          return neighbor
            ? { id: neighborId, name: neighbor.properties.name }
            : null;
        },
      ).filter((item): item is { id: string; name: string } => Boolean(item));
      return [
        regionId,
        {
          id: `city-neighbors:${regionId}`,
          city: feature.properties.name,
          regionId,
          neighbors,
        } satisfies CityNeighborQuestion,
      ];
    }),
  );
}

function normalizeCityName(value: string) {
  return stripAdministrativeSuffix(normalizePlaceName(value));
}

export function cityNeighborAnswerMatches(
  answer: string,
  neighborNames: readonly string[],
) {
  const normalizedAnswer = normalizePlaceName(answer);
  if (neighborNames.length === 0) {
    return normalizedAnswer.length === 0 ||
      NO_CITY_NEIGHBOR_ANSWERS.has(normalizedAnswer);
  }
  const submitted = new Set(
    answer
      .split(ANSWER_SEPARATOR)
      .map(normalizeCityName)
      .filter(Boolean),
  );
  const expected = new Set(neighborNames.map(normalizeCityName));
  return submitted.size === expected.size &&
    Array.from(expected).every((name) => submitted.has(name));
}
