import { geometryToPath } from "../lib/map-geometry";
import { makeWorldFeatureProjection } from "../lib/world-map-geometry";
import type { WorldMapFeature } from "../model/world-map-data";
import { MAP_COLORS } from "@/shared/config/map-colors";

const WIDTH = 560;
const HEIGHT = 360;

export default function WorldCountrySilhouette({
  feature,
}: {
  feature: WorldMapFeature;
}) {
  const project = makeWorldFeatureProjection(feature, WIDTH, HEIGHT, 32);
  return (
    <svg className="block h-auto max-h-[390px] w-full" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="待辨认的国家轮廓">
      <path d={geometryToPath(feature.geometry, project)} fill={MAP_COLORS.silhouetteFill} fillRule="evenodd" stroke={MAP_COLORS.worldBoundary} strokeLinejoin="round" strokeWidth={2.2} />
    </svg>
  );
}
