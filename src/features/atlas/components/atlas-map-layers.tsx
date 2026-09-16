import { memo } from "react";
import type { Position } from "@/features/map/model/map-data";
import { MAP_HEIGHT, MAP_WIDTH } from "@/features/map/lib/map-geometry";
import type { AtlasProvinceDrawing, AtlasRegionDrawing } from "@/features/atlas/model/atlas-types";

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
    <g>
      {regions.map((region) => (
        <path
          key={region.key}
          className="hover:brightness-[0.96] hover:saturate-[1.08]"
          d={region.path}
          fill={region.fill}
          fillRule="evenodd"
          stroke="var(--green)"
          strokeLinejoin="round"
          strokeWidth={0.72}
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
    <g>
      {provinces.map((province) => (
        <path
          key={province.key}
          className="pointer-events-none"
          d={province.path}
          fill="none"
          fillRule="evenodd"
          stroke="var(--red)"
          strokeLinejoin="round"
          strokeWidth={2.1}
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
    <g className="pointer-events-none">
      {regions.map((region) => (
        <text
          key={`label-${region.key}`}
          x={region.labelX}
          y={region.labelY}
          className="font-sans font-black [paint-order:stroke]"
          fill="#27362f"
          fontSize={region.longLabel ? 2.95 : 3.7}
          stroke="rgba(255, 253, 247, 0.95)"
          strokeLinejoin="round"
          strokeWidth={0.86}
          textAnchor="middle"
          aria-hidden="true"
        >
          <tspan x={region.labelX} dy="-0.1em">{region.name}</tspan>
          <tspan fill="#9c2f28" fontSize="0.9em" strokeWidth={0.78} x={region.labelX} dy="1.2em">
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
