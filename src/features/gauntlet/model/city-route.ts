import type {
  CityAdjacencyMap,
  CityRouteChallenge,
} from "@/features/gauntlet/model/gauntlet-types";
import { visitPositions } from "@/features/map/lib/map-geometry";
import type { MapData } from "@/features/map/model/map-data";
import { findShortestPath } from "@/shared/lib/graph";
import { randomShuffle } from "@/shared/lib/random";

const MINIMUM_SHARED_BOUNDARY_POINTS = 3;
const MAXIMUM_RANDOM_ROUTE_ATTEMPTS = 120;

export function buildCityAdjacencyMap(map: MapData): CityAdjacencyMap {
  const pointSets = map.features.map((feature) => {
    const points = new Set<string>();
    visitPositions(feature.geometry.coordinates, ([longitude, latitude]) => {
      points.add(`${longitude.toFixed(5)},${latitude.toFixed(5)}`);
    });
    return { name: feature.properties.name, points };
  });
  const adjacency = Object.fromEntries(
    pointSets.map(({ name }) => [name, [] as string[]]),
  ) as CityAdjacencyMap;

  for (let leftIndex = 0; leftIndex < pointSets.length; leftIndex += 1) {
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < pointSets.length;
      rightIndex += 1
    ) {
      const left = pointSets[leftIndex];
      const right = pointSets[rightIndex];
      const smaller = left.points.size <= right.points.size ? left : right;
      const larger = smaller === left ? right : left;
      let sharedPoints = 0;
      for (const point of smaller.points) {
        if (!larger.points.has(point)) continue;
        sharedPoints += 1;
        if (sharedPoints >= MINIMUM_SHARED_BOUNDARY_POINTS) break;
      }
      if (sharedPoints < MINIMUM_SHARED_BOUNDARY_POINTS) continue;
      adjacency[left.name].push(right.name);
      adjacency[right.name].push(left.name);
    }
  }
  return adjacency;
}

export function createCityRouteChallenge(
  provinceCode: string,
  map: MapData,
  adjacency: CityAdjacencyMap,
  round: number,
): CityRouteChallenge | null {
  const sourceNames = map.features
    .map((feature) => feature.properties.name)
    .filter((name) => (adjacency[name]?.length ?? 0) > 0);
  const offset = sourceNames.length ? round % sourceNames.length : 0;
  const names = [...sourceNames.slice(offset), ...sourceNames.slice(0, offset)];

  for (let attempt = 0; attempt < MAXIMUM_RANDOM_ROUTE_ATTEMPTS; attempt += 1) {
    const [startName, endName] = randomShuffle(names).slice(0, 2);
    if (!startName || !endName) continue;
    const shortestPath = findShortestPath(startName, endName, adjacency);
    if (shortestPath.length >= 3 && shortestPath.length <= 7) {
      return { provinceCode, startName, endName, shortestPath };
    }
  }

  for (const startName of names) {
    for (const endName of names) {
      const shortestPath = findShortestPath(startName, endName, adjacency);
      if (shortestPath.length >= 2) {
        return { provinceCode, startName, endName, shortestPath };
      }
    }
  }
  return null;
}
