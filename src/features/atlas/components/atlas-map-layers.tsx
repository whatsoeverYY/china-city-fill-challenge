import { memo } from "react";
import type { Position } from "@/features/map/model/map-data";
import { MAP_HEIGHT, MAP_WIDTH } from "@/features/map/lib/map-geometry";

export type AtlasView = {
  scale: number;
  x: number;
  y: number;
};

export type AtlasRegionDrawing = {
  key: string;
  path: string;
  fill: string;
  name: string;
  plate: string;
  labelX: number;
  labelY: number;
  longLabel: boolean;
};

export type AtlasProvinceDrawing = {
  key: string;
  path: string;
};

export type AtlasHoverLabel = {
  name: string;
  plate: string;
  left: number;
  top: number;
};

export const ATLAS_MIN_SCALE = 1;
export const ATLAS_MAX_SCALE = 8;

export const AtlasRegionShapes = memo(function AtlasRegionShapes({
  regions,
  onRegionEnter,
  onRegionLeave,
}: {
  regions: AtlasRegionDrawing[];
  onRegionEnter: (
    region: AtlasRegionDrawing,
    event: React.PointerEvent<SVGPathElement>,
  ) => void;
  onRegionLeave: () => void;
}) {
  return (
    <g className="city-atlas-region-layer">
      {regions.map((region) => (
        <path
          key={region.key}
          className="city-atlas-region"
          d={region.path}
          fill={region.fill}
          fillRule="evenodd"
          vectorEffect="non-scaling-stroke"
          data-region-name={region.name}
          onPointerEnter={(event) => onRegionEnter(region, event)}
          onPointerLeave={onRegionLeave}
        />
      ))}
    </g>
  );
});

export const AtlasProvinceOutlines = memo(function AtlasProvinceOutlines({
  provinces,
}: {
  provinces: AtlasProvinceDrawing[];
}) {
  return (
    <g className="city-atlas-province-layer">
      {provinces.map((province) => (
        <path
          key={province.key}
          className="city-atlas-province-outline"
          d={province.path}
          fill="none"
          fillRule="evenodd"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </g>
  );
});

export const AtlasLabels = memo(function AtlasLabels({
  regions,
}: {
  regions: AtlasRegionDrawing[];
}) {
  return (
    <g className="city-atlas-labels">
      {regions.map((region) => (
        <text
          key={`label-${region.key}`}
          x={region.labelX}
          y={region.labelY}
          className={region.longLabel ? "is-long" : ""}
          textAnchor="middle"
          aria-hidden="true"
        >
          <tspan x={region.labelX} dy="-0.1em">{region.name}</tspan>
          <tspan className="city-atlas-plate" x={region.labelX} dy="1.2em">
            {region.plate}
          </tspan>
        </text>
      ))}
    </g>
  );
});

export function atlasPointerPosition(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number,
): Position {
  const point = svg.createSVGPoint();
  point.x = clientX;
  point.y = clientY;
  const matrix = svg.getScreenCTM();
  if (matrix) {
    const transformed = point.matrixTransform(matrix.inverse());
    return [transformed.x, transformed.y];
  }
  const bounds = svg.getBoundingClientRect();
  return [
    ((clientX - bounds.left) / bounds.width) * MAP_WIDTH,
    ((clientY - bounds.top) / bounds.height) * MAP_HEIGHT,
  ];
}
