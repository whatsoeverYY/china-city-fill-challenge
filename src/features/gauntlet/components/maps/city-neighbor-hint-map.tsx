"use client";

import { useMemo } from "react";
import {
  featureLabelPosition,
  geometryToPath,
  makeProjection,
  MAP_HEIGHT,
  MAP_WIDTH,
} from "@/features/map/lib/map-geometry";
import { mapFeatureId, type MapData } from "@/features/map/model/map-data";
import { stripAdministrativeSuffix } from "@/shared/lib/place-name";

export default function CityNeighborHintMap({
  map,
  targetRegionId,
}: {
  map: MapData;
  targetRegionId: string;
}) {
  const project = useMemo(() => makeProjection(map.features), [map.features]);

  return (
    <svg
      className="block h-auto max-h-[520px] w-full overflow-visible drop-shadow-[0_15px_14px_rgba(68,55,35,0.1)]"
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      role="img"
      aria-label="标出目标行政区并显示全部行政区名称和界线的省级提示地图"
    >
      {map.features.map((feature) => {
        const regionId = mapFeatureId(feature);
        const isTarget = regionId === targetRegionId;
        return (
          <path
            key={regionId}
            d={geometryToPath(feature.geometry, project)}
            fill={isTarget ? "#d95d4f" : "#eee4cf"}
            fillRule="evenodd"
            stroke={isTarget ? "#7c2822" : "var(--green)"}
            strokeLinejoin="round"
            strokeWidth={isTarget ? 3.6 : 2}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
      {map.features.map((feature) => {
        const regionId = mapFeatureId(feature);
        const isTarget = regionId === targetRegionId;
        const [x, y] = featureLabelPosition(feature, project);
        return (
          <text
            key={`city-neighbor-label-${regionId}`}
            x={x}
            y={y}
            className="pointer-events-none font-sans font-black [paint-order:stroke]"
            fill={isTarget ? "#fff" : "#3f4d47"}
            fontSize={isTarget ? 15 : 11}
            stroke={isTarget ? "#7c2822" : "rgba(255,253,247,0.94)"}
            strokeWidth={isTarget ? 4 : 3}
            textAnchor="middle"
            dominantBaseline="central"
            aria-hidden="true"
          >
            <tspan x={x} dy={isTarget ? "-0.4em" : 0}>
              {stripAdministrativeSuffix(feature.properties.name)}
            </tspan>
            {isTarget ? (
              <tspan x={x} dy="1.35em" fontSize={9} letterSpacing="0.08em">
                目标行政区
              </tspan>
            ) : null}
          </text>
        );
      })}
    </svg>
  );
}
