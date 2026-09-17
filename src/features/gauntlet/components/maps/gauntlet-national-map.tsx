"use client";

import { useMemo } from "react";
import type { Province } from "@/domain/geography/data/provinces";
import {
  featureLabelPosition,
  geometryToPath,
  handleKeyboardActivation,
  makeProjection,
  MAP_HEIGHT,
  MAP_WIDTH,
  provinceForFeature,
} from "@/features/map/lib/map-geometry";
import type { MapData } from "@/features/map/model/map-data";
import { MAP_COLORS } from "@/shared/config/map-colors";

type RegionState = {
  selected: boolean;
  correctAnswer: boolean;
  inRoute: boolean;
  current: boolean;
  origin: boolean;
};

function regionAppearance(state: RegionState) {
  if (state.correctAnswer) {
    return { fill: MAP_COLORS.correctFill, stroke: MAP_COLORS.correctStroke, strokeWidth: 3 };
  }
  if (state.current) {
    return { fill: MAP_COLORS.currentFill, stroke: MAP_COLORS.currentStroke, strokeWidth: 2.8 };
  }
  if (state.inRoute && state.origin) {
    return { fill: MAP_COLORS.routeOriginFill, stroke: MAP_COLORS.provinceBoundary, strokeWidth: 2.5 };
  }
  if (state.inRoute) {
    return { fill: MAP_COLORS.routeFill, stroke: MAP_COLORS.routeStroke, strokeWidth: 1.8 };
  }
  if (state.origin) {
    return { fill: MAP_COLORS.routeOriginFill, stroke: MAP_COLORS.provinceBoundary, strokeWidth: 2.5 };
  }
  if (state.selected) {
    return { fill: MAP_COLORS.selectedFill, stroke: MAP_COLORS.provinceBoundary, strokeWidth: 2 };
  }
  return { fill: MAP_COLORS.neutralFill, stroke: MAP_COLORS.provinceBoundary, strokeWidth: 1.25 };
}

export default function GauntletNationalMap({
  map,
  selectedCodes,
  correctCodes,
  routeCodes,
  originCode,
  showLabels,
  onProvince,
}: {
  map: MapData;
  selectedCodes: Set<string>;
  correctCodes?: Set<string>;
  routeCodes: string[];
  originCode: string | null;
  showLabels: boolean;
  onProvince: (province: Province) => void;
}) {
  const features = useMemo(
    () => map.features.filter((feature) => Boolean(provinceForFeature(feature))),
    [map.features],
  );
  const project = useMemo(() => makeProjection(features), [features]);
  const routeSet = useMemo(() => new Set(routeCodes), [routeCodes]);
  const currentCode = routeCodes.at(-1) ?? null;

  return (
    <svg
      className="block h-auto max-h-[520px] w-full overflow-visible drop-shadow-[0_15px_14px_rgba(68,55,35,0.1)]"
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      role="img"
      aria-label="闯关用中国省级行政区地图"
    >
      <g>
        {features.map((feature) => {
          const province = provinceForFeature(feature)!;
          const state = {
            selected: selectedCodes.has(province.code),
            correctAnswer: correctCodes?.has(province.code) ?? false,
            inRoute: routeSet.has(province.code),
            current: currentCode === province.code,
            origin: originCode === province.code,
          };
          const appearance = regionAppearance(state);
          const highlighted = Object.values(state).some(Boolean);
          return (
            <path
              key={province.code}
              d={geometryToPath(feature.geometry, project)}
              className={`cursor-pointer [transition:fill_130ms_ease,filter_130ms_ease] ${
                highlighted
                  ? ""
                  : "hover:fill-gold-300 hover:brightness-[0.98] focus-visible:fill-gold-300 focus-visible:brightness-[0.98]"
              } ${state.correctAnswer ? "drop-shadow-[0_0_6px_rgba(241,199,91,0.72)]" : ""}`}
              fill={appearance.fill}
              fillRule="evenodd"
              role="button"
              stroke={appearance.stroke}
              strokeLinejoin="round"
              strokeWidth={appearance.strokeWidth}
              tabIndex={0}
              aria-label={`${province.name}${state.selected ? "，已选择" : ""}${state.correctAnswer ? "，正确答案" : ""}${state.inRoute ? "，已加入路线" : ""}`}
              onClick={() => onProvince(province)}
              onKeyDown={(event) => handleKeyboardActivation(
                event,
                () => onProvince(province),
              )}
            />
          );
        })}
      </g>
      {showLabels
        ? features.map((feature) => {
            const province = provinceForFeature(feature)!;
            const [x, y] = featureLabelPosition(feature, project);
            return (
              <text
                key={`gauntlet-label-${province.code}`}
                x={x}
                y={y}
                className="pointer-events-none font-sans font-black [paint-order:stroke]"
                fill={MAP_COLORS.neutralLabel}
                fontSize={province.shortName.length > 3 ? 8 : 10}
                stroke="rgba(255, 253, 247, 0.9)"
                strokeWidth={2}
                textAnchor="middle"
                dominantBaseline="central"
                aria-hidden="true"
              >
                {province.shortName}
              </text>
            );
          })
        : null}
    </svg>
  );
}
