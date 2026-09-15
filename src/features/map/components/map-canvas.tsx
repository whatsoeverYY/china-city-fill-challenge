"use client";

import { useMemo } from "react";
import type { MapData, MapFeature } from "@/features/map/model/map-data";
import {
  featureLabelPosition,
  geometryToPath,
  handleKeyboardActivation,
  makeProjection,
  MAP_HEIGHT,
  MAP_WIDTH,
  provinceForFeature,
} from "@/features/map/lib/map-geometry";

export default function MapCanvas({
  map,
  mode,
  completedNames,
  completedProvinceCodes,
  selectedAnswer,
  wrongRegion,
  provinceOutlines,
  provinceFillColors,
  onRegion,
  onHover,
  hideProvinceNames,
  showAllLabels,
  joined,
  hiddenProvinceCodes,
}: {
  map: MapData;
  mode: "national" | "detail";
  completedNames: Set<string>;
  completedProvinceCodes: Set<string>;
  selectedAnswer: string | null;
  wrongRegion: string | null;
  provinceOutlines: MapFeature[];
  provinceFillColors: Record<string, string>;
  onRegion: (feature: MapFeature, answer?: string) => void;
  onHover: (name: string | null) => void;
  hideProvinceNames: boolean;
  showAllLabels: boolean;
  joined: boolean;
  hiddenProvinceCodes: Set<string>;
}) {
  const visibleFeatures = useMemo(
    () =>
      mode === "national"
        ? map.features
        : map.features.filter(
            (feature) =>
              !hiddenProvinceCodes.has(
                feature.properties.provinceCode ?? "",
              ),
          ),
    [hiddenProvinceCodes, map.features, mode],
  );
  const project = useMemo(
    () => makeProjection(visibleFeatures),
    [visibleFeatures],
  );

  const handleKeyDown = (
    event: React.KeyboardEvent<SVGPathElement>,
    feature: MapFeature,
  ) => {
    handleKeyboardActivation(event, () => onRegion(feature));
  };

  return (
    <svg
      className={`game-map game-map--${mode} ${joined ? "is-joined" : ""}`}
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      role="img"
      aria-label={mode === "national" ? "中国省级行政区地图" : "行政区填充地图"}
    >
      <defs>
        <filter id="map-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodOpacity="0.12" />
        </filter>
        <pattern id="paper-dots" width="13" height="13" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="0.7" fill="#967d59" opacity="0.12" />
        </pattern>
      </defs>
      {mode === "detail" ? (
        <g className="map-touch-hit-layer" aria-hidden="true">
          {visibleFeatures.map((feature) => (
            <path
              key={`hit-${feature.properties.name}-${String(feature.properties.adcode)}`}
              d={geometryToPath(feature.geometry, project)}
              className="map-region-hit"
              data-region-name={feature.properties.name}
              fill="none"
              fillRule="evenodd"
              onClick={() => onRegion(feature)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                onRegion(feature, event.dataTransfer.getData("text/plain"));
              }}
            />
          ))}
        </g>
      ) : null}
      <g className="map-shadow-layer" filter="url(#map-shadow)">
        {visibleFeatures.map((feature) => {
          const province = provinceForFeature(feature);
          const isComplete =
            mode === "national"
              ? Boolean(province && completedProvinceCodes.has(province.code))
              : completedNames.has(feature.properties.name);
          const path = geometryToPath(feature.geometry, project);
          const provinceFill =
            joined && showAllLabels
              ? provinceFillColors[feature.properties.provinceCode ?? ""]
              : undefined;
          return (
            <path
              key={`${feature.properties.name}-${String(feature.properties.adcode)}`}
              d={path}
              className={`map-region ${isComplete ? "is-complete" : ""} ${provinceFill ? "is-province-tinted" : ""} ${
                wrongRegion === feature.properties.name ? "is-wrong" : ""
              } ${selectedAnswer && mode === "detail" ? "is-targetable" : ""}`}
              data-region-name={feature.properties.name}
              fillRule="evenodd"
              role="button"
              tabIndex={0}
              style={
                provinceFill
                  ? ({ "--province-fill": provinceFill } as React.CSSProperties)
                  : undefined
              }
              aria-label={
                mode === "national"
                  ? hideProvinceNames
                    ? `省级行政区块${isComplete ? "，已完成" : "，未解锁"}`
                    : `${feature.properties.name}${isComplete ? "，已完成" : "，未完成"}`
                  : isComplete
                    ? `${feature.properties.name}，已填入`
                    : "待填充区域"
              }
              onClick={() => onRegion(feature)}
              onKeyDown={(event) => handleKeyDown(event, feature)}
              onMouseEnter={() => onHover(feature.properties.name)}
              onMouseLeave={() => onHover(null)}
              onDragOver={(event) => {
                if (mode === "detail") event.preventDefault();
              }}
              onDrop={(event) => {
                if (mode !== "detail") return;
                event.preventDefault();
                onRegion(feature, event.dataTransfer.getData("text/plain"));
              }}
            />
          );
          })}
      </g>

      {mode === "detail"
        ? provinceOutlines
            .filter(
              (outline) =>
                !hiddenProvinceCodes.has(
                  String(outline.properties.adcode ?? ""),
                ),
            )
            .map((outline) => (
            <path
              key={`outline-${String(outline.properties.adcode ?? "")}`}
              className="province-outline"
              d={geometryToPath(outline.geometry, project)}
              fill="none"
              fillRule="evenodd"
              aria-hidden="true"
            />
            ))
        : null}

      {visibleFeatures
        .filter((feature) =>
          mode === "national"
            ? showAllLabels && !hideProvinceNames
            : showAllLabels || completedNames.has(feature.properties.name),
        )
        .map((feature) => {
          const [x, y] = featureLabelPosition(feature, project);
          const fullName = feature.properties.name;
          const name = mode === "national"
            ? provinceForFeature(feature)?.shortName ?? fullName
            : fullName;
          const isHint = mode === "detail" && !completedNames.has(fullName);
          return (
            <text
              key={`label-${String(feature.properties.adcode)}-${fullName}`}
              x={x}
              y={y}
              className={`region-label ${mode === "national" ? "is-national" : ""} ${name.length > 7 ? "is-long" : ""} ${isHint ? "is-hint" : ""}`}
              textAnchor="middle"
              dominantBaseline="central"
              aria-hidden="true"
            >
              {name}
            </text>
          );
        })}
    </svg>
  );
}
