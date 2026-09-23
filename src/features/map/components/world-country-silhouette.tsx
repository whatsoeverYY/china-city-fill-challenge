import { useMemo } from "react";
import { geometryToPath } from "../lib/map-geometry";
import { makeWorldFeatureProjection } from "../lib/world-map-geometry";
import type { WorldMapFeature } from "../model/world-map-data";
import { MAP_COLORS } from "@/shared/config/map-colors";

const WIDTH = 560;
const HEIGHT = 360;

export default function WorldCountrySilhouette({
  feature,
  ariaLabel = "待辨认的国家轮廓",
}: {
  feature: WorldMapFeature;
  ariaLabel?: string;
}) {
  const path = useMemo(() => {
    const project = makeWorldFeatureProjection(feature, WIDTH, HEIGHT, 32);
    return geometryToPath(feature.geometry, project);
  }, [feature]);

  return (
    <svg className="block h-auto max-h-[390px] w-full" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={ariaLabel}>
      <path d={path} fill={MAP_COLORS.silhouetteFill} fillRule="evenodd" stroke={MAP_COLORS.worldBoundary} strokeLinejoin="round" strokeWidth={2.2} />
    </svg>
  );
}
