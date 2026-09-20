import { geometryToPath, visitPositions } from "./map-geometry.ts";
import type { Position } from "../model/map-data.ts";
import type { WorldMapFeature } from "../model/world-map-data.ts";

export const WORLD_MAP_WIDTH = 1000;
export const WORLD_MAP_HEIGHT = 560;

export function projectWorldPosition([longitude, latitude]: Position): Position {
  const x = 18 + ((longitude + 180) / 360) * (WORLD_MAP_WIDTH - 36);
  const y = 18 + ((90 - latitude) / 180) * (WORLD_MAP_HEIGHT - 36);
  return [x, y];
}

export function worldFeaturePath(feature: WorldMapFeature) {
  return geometryToPath(feature.geometry, projectWorldPosition);
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
