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
  wrongRegion,
  provinceOutlines,
  provinceFillColors,
  onRegion,
  onHover,
  hideProvinceNames,
  showAllLabels,
  joined,
  hardMode,
  hiddenProvinceCodes,
}: {
  map: MapData;
  mode: "national" | "detail";
  completedNames: Set<string>;
  completedProvinceCodes: Set<string>;
  wrongRegion: string | null;
  provinceOutlines: MapFeature[];
  provinceFillColors: Record<string, string>;
  onRegion: (feature: MapFeature, answer?: string) => void;
  onHover: (name: string | null) => void;
  hideProvinceNames: boolean;
  showAllLabels: boolean;
  joined: boolean;
  hardMode: boolean;
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
      className="relative z-[1] block h-[min(68vw,650px)] min-h-[360px] w-[min(100%,1180px)] overflow-visible max-[620px]:h-[54vw] max-[620px]:min-h-[315px]"
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
              className="[@media(hover:none)]:[pointer-events:stroke] [@media(hover:none)]:[stroke-width:44] [@media(pointer:coarse)]:[pointer-events:stroke] [@media(pointer:coarse)]:[stroke-width:44]"
              data-region-name={feature.properties.name}
              fill="none"
              fillRule="evenodd"
              pointerEvents="none"
              stroke="rgba(0, 0, 0, 0.001)"
              strokeWidth={0}
              vectorEffect="non-scaling-stroke"
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
      <g className="[transform-origin:center]" filter="url(#map-shadow)">
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
          const fill = mode === "national"
            ? isComplete ? "#b8d5b5" : "#e9dfc9"
            : provinceFill ?? (isComplete ? "#c6dec3" : "url(#paper-dots)");
          const cursorClass = hardMode && !isComplete
            ? "cursor-crosshair"
            : mode === "detail" && isComplete
              ? "cursor-default"
              : "cursor-pointer";
          const hoverClass = mode === "national"
            ? isComplete
              ? "hover:brightness-[1.03] focus-visible:brightness-[1.03]"
              : "hover:fill-[#e5c08b] hover:brightness-[1.03] focus-visible:fill-[#e5c08b] focus-visible:brightness-[1.03]"
            : provinceFill
              ? "hover:brightness-[0.96] hover:saturate-[1.08]"
              : isComplete
                ? ""
                : "hover:fill-[#eadcb5]";
          return (
            <path
              key={`${feature.properties.name}-${String(feature.properties.adcode)}`}
              d={path}
              className={`${cursorClass} ${hoverClass} transition-[fill,filter,opacity] duration-[180ms] ${
                wrongRegion === feature.properties.name ? "animate-[wrong-region_520ms_ease]" : ""
              }`}
              data-region-name={feature.properties.name}
              fill={fill}
              fillRule="evenodd"
              role="button"
              stroke={mode === "national" ? "var(--red)" : "var(--green)"}
              strokeLinecap={mode === "national" ? "round" : undefined}
              strokeLinejoin="round"
              strokeWidth={mode === "national" ? 1.35 : 1.25}
              tabIndex={0}
              vectorEffect="non-scaling-stroke"
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
              className="pointer-events-none"
              d={geometryToPath(outline.geometry, project)}
              fill="none"
              fillRule="evenodd"
              aria-hidden="true"
              stroke="var(--red)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={joined ? 2.1 : 2.4}
              vectorEffect="non-scaling-stroke"
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
          const labelClass = mode === "national"
            ? "text-[15px] [stroke-width:4.5px] max-[620px]:text-[11px] max-[620px]:[stroke-width:3.5px]"
            : joined
              ? `${name.length > 7 ? "text-[6.5px]" : "text-[8px]"} [stroke-width:2.6px] max-[620px]:text-[10px] max-[620px]:[stroke-width:3px]`
              : `${name.length > 7 ? "text-[10px]" : "text-[13px]"} [stroke-width:4px] max-[620px]:text-[10px] max-[620px]:[stroke-width:3px]`;
          return (
            <text
              key={`label-${String(feature.properties.adcode)}-${fullName}`}
              x={x}
              y={y}
              className={`pointer-events-none font-extrabold [paint-order:stroke] [stroke-linejoin:round] ${labelClass} ${
                isHint ? "opacity-[0.78]" : ""
              }`}
              fill={mode === "national" ? "var(--red-dark)" : isHint ? "#7e5d39" : "var(--green-dark)"}
              textAnchor="middle"
              dominantBaseline="central"
              aria-hidden="true"
              stroke="rgba(248, 247, 236, 0.96)"
            >
              {name}
            </text>
          );
        })}
    </svg>
  );
}
