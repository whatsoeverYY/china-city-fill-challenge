import { visitPositions } from "./map-geometry.ts";
import type { Position } from "../model/map-data.ts";
import type { WorldMapFeature } from "../model/world-map-data.ts";

export const WORLD_MAP_WIDTH = 1000;
export const WORLD_MAP_HEIGHT = 560;
// The overview omits sub-pixel rings; silhouettes still use the full geometry.
const WORLD_OVERVIEW_SIMPLIFY_TOLERANCE = 0.25;
const WORLD_OVERVIEW_MIN_RING_SIZE = 0.3;
const worldFeaturePathCache = new WeakMap<WorldMapFeature, string>();

type ProjectedRing = {
  points: Position[];
  size: number;
  hole: boolean;
};

export function projectWorldPosition([longitude, latitude]: Position): Position {
  const x = 18 + ((longitude + 180) / 360) * (WORLD_MAP_WIDTH - 36);
  const y = 18 + ((90 - latitude) / 180) * (WORLD_MAP_HEIGHT - 36);
  return [x, y];
}

export function worldFeaturePath(feature: WorldMapFeature) {
  const cachedPath = worldFeaturePathCache.get(feature);
  if (cachedPath) return cachedPath;
  const coordinates = feature.geometry.coordinates as unknown[];
  const polygons = feature.geometry.type === "Polygon"
    ? [coordinates]
    : coordinates;
  const rings = polygons.flatMap((polygon) =>
    projectWorldPolygon(polygon)
  );
  const visibleRings = rings.filter((ring) =>
    ring.size >= WORLD_OVERVIEW_MIN_RING_SIZE
  );
  if (!visibleRings.some((ring) => !ring.hole)) {
    const largestOuterRing = rings
      .filter((ring) => !ring.hole)
      .sort((first, second) => second.size - first.size)[0];
    if (largestOuterRing) visibleRings.push(largestOuterRing);
  }
  const path = visibleRings.map(({ points }) =>
    worldRingToPath(points)
  ).join(" ");
  worldFeaturePathCache.set(feature, path);
  return path;
}

function projectWorldPolygon(polygon: unknown): ProjectedRing[] {
  if (!Array.isArray(polygon)) return [];
  return polygon.flatMap((ring, index) => {
    if (!Array.isArray(ring)) return [];
    const points = ring.map((position) =>
      projectWorldPosition(position as Position)
    );
    if (points.length === 0) return [];
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const [x, y] of points) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
    return [{
      points,
      size: Math.max(maxX - minX, maxY - minY),
      hole: index > 0,
    }];
  });
}

function squaredDistance(first: Position, second: Position) {
  const deltaX = first[0] - second[0];
  const deltaY = first[1] - second[1];
  return deltaX * deltaX + deltaY * deltaY;
}

function squaredSegmentDistance(
  point: Position,
  start: Position,
  end: Position,
) {
  const deltaX = end[0] - start[0];
  const deltaY = end[1] - start[1];
  if (deltaX === 0 && deltaY === 0) return squaredDistance(point, start);
  const ratio = Math.max(0, Math.min(1,
    ((point[0] - start[0]) * deltaX + (point[1] - start[1]) * deltaY) /
      (deltaX * deltaX + deltaY * deltaY),
  ));
  const projectedX = start[0] + ratio * deltaX;
  const projectedY = start[1] + ratio * deltaY;
  const distanceX = point[0] - projectedX;
  const distanceY = point[1] - projectedY;
  return distanceX * distanceX + distanceY * distanceY;
}

function simplifyLine(points: readonly Position[], toleranceSquared: number) {
  if (points.length <= 2) return [...points];
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const ranges: Array<[number, number]> = [[0, points.length - 1]];

  while (ranges.length > 0) {
    const [startIndex, endIndex] = ranges.pop()!;
    let farthestIndex = -1;
    let farthestDistance = toleranceSquared;
    for (let index = startIndex + 1; index < endIndex; index += 1) {
      const distance = squaredSegmentDistance(
        points[index],
        points[startIndex],
        points[endIndex],
      );
      if (distance > farthestDistance) {
        farthestDistance = distance;
        farthestIndex = index;
      }
    }
    if (farthestIndex < 0) continue;
    keep[farthestIndex] = 1;
    ranges.push(
      [startIndex, farthestIndex],
      [farthestIndex, endIndex],
    );
  }

  return points.filter((_, index) => keep[index]);
}

function simplifyClosedRing(points: readonly Position[]) {
  if (points.length <= 4) return [...points];
  const closed = squaredDistance(points[0], points[points.length - 1]) < 0.0001;
  const openPoints = closed ? points.slice(0, -1) : [...points];
  if (openPoints.length <= 3) return [...points];

  let oppositeIndex = 1;
  let oppositeDistance = 0;
  for (let index = 1; index < openPoints.length; index += 1) {
    const distance = squaredDistance(openPoints[0], openPoints[index]);
    if (distance > oppositeDistance) {
      oppositeDistance = distance;
      oppositeIndex = index;
    }
  }

  const toleranceSquared = WORLD_OVERVIEW_SIMPLIFY_TOLERANCE ** 2;
  const firstArc = simplifyLine(
    openPoints.slice(0, oppositeIndex + 1),
    toleranceSquared,
  );
  const secondArc = simplifyLine(
    [...openPoints.slice(oppositeIndex), openPoints[0]],
    toleranceSquared,
  );
  const simplified = [
    ...firstArc.slice(0, -1),
    ...secondArc.slice(0, -1),
  ];
  return simplified.length >= 3
    ? [...simplified, simplified[0]]
    : [...points];
}

function worldRingToPath(projected: readonly Position[]) {
  const simplified = simplifyClosedRing(projected);
  return `${simplified.map(([x, y], index) =>
    `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`
  ).join(" ")} Z`;
}

function circularProjectionStart(longitudes: number[]) {
  const sorted = Array.from(new Set(longitudes.map((value) =>
    ((value % 360) + 360) % 360
  ))).sort((first, second) => first - second);
  if (sorted.length < 2) return sorted[0] ?? 0;
  let largestGap = -1;
  let start = sorted[0];
  for (let index = 0; index < sorted.length; index += 1) {
    const current = sorted[index];
    const next = index === sorted.length - 1
      ? sorted[0] + 360
      : sorted[index + 1];
    if (next - current > largestGap) {
      largestGap = next - current;
      start = next % 360;
    }
  }
  return start;
}

export function makeWorldFeatureProjection(
  feature: WorldMapFeature,
  width: number,
  height: number,
  padding = 28,
) {
  const positions: Position[] = [];
  visitPositions(feature.geometry.coordinates, (position) => positions.push(position));
  const start = circularProjectionStart(positions.map(([longitude]) => longitude));
  const unwrapped = positions.map(([longitude, latitude]) => {
    const normalized = ((longitude % 360) + 360) % 360;
    return [normalized < start ? normalized + 360 : normalized, latitude] as Position;
  });
  const minX = Math.min(...unwrapped.map(([longitude]) => longitude));
  const maxX = Math.max(...unwrapped.map(([longitude]) => longitude));
  const minY = Math.min(...unwrapped.map(([, latitude]) => latitude));
  const maxY = Math.max(...unwrapped.map(([, latitude]) => latitude));
  const spanX = Math.max(maxX - minX, 0.01);
  const spanY = Math.max(maxY - minY, 0.01);
  const scale = Math.min(
    (width - padding * 2) / spanX,
    (height - padding * 2) / spanY,
  );
  const offsetX = (width - spanX * scale) / 2;
  const offsetY = (height - spanY * scale) / 2;

  return ([longitude, latitude]: Position): Position => {
    const normalized = ((longitude % 360) + 360) % 360;
    const unwrappedLongitude = normalized < start ? normalized + 360 : normalized;
    return [
      offsetX + (unwrappedLongitude - minX) * scale,
      offsetY + (maxY - latitude) * scale,
    ];
  };
}
