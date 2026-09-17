"use client";

import { useMemo } from "react";
import {
  featureLabelPosition,
  geometryToPath,
  handleKeyboardActivation,
  makeProjection,
  MAP_HEIGHT,
  MAP_WIDTH,
} from "@/features/map/lib/map-geometry";
import { mapFeatureId, type MapData } from "@/features/map/model/map-data";
import { stripAdministrativeSuffix } from "@/shared/lib/place-name";
import { MAP_COLORS } from "@/shared/config/map-colors";

export default function GauntletDetailMap({
  map,
  onRegion,
  correctRegionId,
  selectedRegionId,
  showLabels = false,
  readOnly = false,
}: {
  map: MapData;
  onRegion: (regionId: string) => void;
  correctRegionId?: string;
  selectedRegionId?: string;
  showLabels?: boolean;
  readOnly?: boolean;
}) {
  const project = useMemo(() => makeProjection(map.features), [map.features]);

  return (
    <svg
      className="block h-auto max-h-[520px] w-full overflow-visible drop-shadow-[0_15px_14px_rgba(68,55,35,0.1)]"
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      role="img"
      aria-label={readOnly
        ? "显示区块名称和答题结果的省内行政区地图"
        : showLabels
          ? "显示区块名称的省内行政区地图"
          : "无名称省内行政区地图"}
    >
      {map.features.map((feature) => {
        const name = feature.properties.name;
        const regionId = mapFeatureId(feature);
        const isCorrectAnswer = correctRegionId === regionId;
        const isWrongSelection = selectedRegionId === regionId;
        const isHighlighted = isCorrectAnswer || isWrongSelection;
        const fill = isCorrectAnswer ? MAP_COLORS.correctFill : isWrongSelection ? MAP_COLORS.wrongFill : MAP_COLORS.neutralFill;
        const stroke = isCorrectAnswer ? MAP_COLORS.correctStroke : isWrongSelection ? MAP_COLORS.wrongStroke : MAP_COLORS.cityBoundary;
        const strokeWidth = isHighlighted ? 3 : 1.8;
        return (
          <path
            key={regionId}
            d={geometryToPath(feature.geometry, project)}
            className={`${readOnly ? "cursor-default" : "cursor-pointer"} [transition:fill_130ms_ease,stroke-width_130ms_ease,filter_130ms_ease] ${
              !readOnly && !isHighlighted
                ? "hover:fill-jade-400 hover:[stroke-width:2.8px] focus-visible:fill-jade-400 focus-visible:[stroke-width:2.8px]"
                : ""
            } ${isCorrectAnswer ? "drop-shadow-[0_0_5px_rgba(241,199,91,0.68)]" : ""}`}
            fill={fill}
            fillRule="evenodd"
            role="button"
            stroke={stroke}
            strokeLinejoin="round"
            strokeWidth={strokeWidth}
            tabIndex={readOnly ? -1 : 0}
            aria-disabled={readOnly || undefined}
            aria-label={isCorrectAnswer
              ? `${name}，正确答案`
              : isWrongSelection
                ? `${name}，你的选择`
                : showLabels
                  ? name
                  : "待选择行政区块"}
            onClick={() => {
              if (!readOnly) onRegion(regionId);
            }}
            onKeyDown={(event) => handleKeyboardActivation(
              event,
              () => {
                if (!readOnly) onRegion(regionId);
              },
            )}
          />
        );
      })}
      {showLabels
        ? map.features.map((feature) => {
            const [x, y] = featureLabelPosition(feature, project);
            const name = feature.properties.name;
            const regionId = mapFeatureId(feature);
            const isCorrectAnswer = correctRegionId === regionId;
            const isWrongSelection = selectedRegionId === regionId;
            const fill = isCorrectAnswer ? MAP_COLORS.correctLabel : isWrongSelection ? MAP_COLORS.wrongStroke : MAP_COLORS.label;
            const stroke = isCorrectAnswer ? MAP_COLORS.correctLabelOutline : isWrongSelection ? MAP_COLORS.wrongLabelOutline : "rgba(255, 253, 247, 0.92)";
            const fontSize = isCorrectAnswer || isWrongSelection ? 15 : readOnly ? 12 : 10;
            const strokeWidth = isCorrectAnswer || isWrongSelection ? 4 : readOnly ? 3 : 2.6;
            return (
              <text
                key={`detail-map-label-${regionId}`}
                x={x}
                y={y}
                className="pointer-events-none font-sans font-black [paint-order:stroke]"
                fill={fill}
                fontSize={fontSize}
                stroke={stroke}
                strokeWidth={strokeWidth}
                textAnchor="middle"
                dominantBaseline="central"
                aria-hidden="true"
              >
                <tspan x={x} dy={isCorrectAnswer || isWrongSelection ? "-0.45em" : 0}>
                  {stripAdministrativeSuffix(name)}
                </tspan>
                {isCorrectAnswer || isWrongSelection ? (
                  <tspan x={x} dy="1.35em" fontSize={10} letterSpacing="0.04em">
                    {isCorrectAnswer ? "✓ 正确答案" : "× 你的选择"}
                  </tspan>
                ) : null}
              </text>
            );
          })
        : null}
    </svg>
  );
}
