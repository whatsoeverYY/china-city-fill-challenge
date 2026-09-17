"use client";

import { useMemo } from "react";
import {
  geometryToPath,
  makeProjection,
  MAP_HEIGHT,
  MAP_HORIZONTAL_PADDING,
  MAP_VERTICAL_PADDING,
  MAP_WIDTH,
  visitPositions,
} from "@/features/map/lib/map-geometry";
import { fitRotatedPointsScale } from "@/features/map/lib/silhouette";
import type { MapFeature, Position } from "@/features/map/model/map-data";
import { MAP_COLORS } from "@/shared/config/map-colors";

function ProvinceShape({
  feature,
  rotation,
}: {
  feature: MapFeature;
  rotation: number;
}) {
  const project = useMemo(() => makeProjection([feature]), [feature]);
  const rotationScale = useMemo(() => {
    const projectedPositions: Position[] = [];
    visitPositions(feature.geometry.coordinates, (position) => {
      projectedPositions.push(project(position));
    });
    return fitRotatedPointsScale(
      projectedPositions,
      rotation,
      MAP_WIDTH / 2,
      MAP_HEIGHT / 2,
      MAP_WIDTH - MAP_HORIZONTAL_PADDING * 2,
      MAP_HEIGHT - MAP_VERTICAL_PADDING * 2,
    );
  }, [feature, project, rotation]);

  return (
    <svg
      className="gauntlet-silhouette h-[500px] w-[min(100%,760px)] overflow-visible max-sm:h-[300px]"
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      role="img"
      aria-label="待辨认的省级行政区轮廓"
    >
      <g
        style={{
          transform: `rotate(${rotation}deg) scale(${rotationScale})`,
          transformOrigin: "center",
        }}
      >
        <path
          className="drop-shadow-[0_15px_14px_rgba(68,55,35,0.14)]"
          d={geometryToPath(feature.geometry, project)}
          fill={MAP_COLORS.silhouetteFill}
          fillRule="evenodd"
          stroke={MAP_COLORS.provinceBoundary}
          strokeLinejoin="round"
          strokeWidth={3.5}
        />
      </g>
    </svg>
  );
}

export default function ProvinceSilhouette({
  feature,
  rotation = 0,
}: {
  feature: MapFeature;
  rotation?: number;
}) {
  return <ProvinceShape feature={feature} rotation={rotation} />;
}
