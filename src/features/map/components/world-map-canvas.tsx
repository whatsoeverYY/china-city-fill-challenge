"use client";

import { useMemo } from "react";
import { useSvgMapViewport } from "../hooks/use-svg-map-viewport";
import {
  projectWorldPosition,
  WORLD_MAP_HEIGHT,
  WORLD_MAP_WIDTH,
  worldFeaturePath,
} from "../lib/world-map-geometry";
import type { WorldMapData, WorldMapFeature } from "../model/world-map-data";
import { MAP_COLORS } from "@/shared/config/map-colors";

export default function WorldMapCanvas({
  map,
  completedCountryIds,
  selectedCountryId,
  wrongCountryId,
  showCompletedLabels = true,
  onCountry,
}: {
  map: WorldMapData;
  completedCountryIds: Set<string>;
  selectedCountryId: string | null;
  wrongCountryId: string | null;
  showCompletedLabels?: boolean;
  onCountry: (feature: WorldMapFeature) => void;
}) {
  const viewport = useSvgMapViewport(WORLD_MAP_WIDTH, WORLD_MAP_HEIGHT);
  const renderedFeatures = useMemo(
    () => map.features.map((feature) => ({
      feature,
      path: worldFeaturePath(feature),
    })),
    [map.features],
  );
  const background = renderedFeatures.filter(
    ({ feature }) => !feature.properties.playable,
  );
  const playable = renderedFeatures.filter(
    ({ feature }) => feature.properties.playable,
  );

  const activate = (
    event: React.KeyboardEvent<SVGPathElement>,
    feature: WorldMapFeature,
  ) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onCountry(feature);
  };

  return (
    <div className="relative overflow-hidden rounded-[22px_22px_22px_7px] border border-atlas-500/20 bg-atlas-100/45">
      <div className="absolute right-3 top-3 z-10 flex gap-1 rounded-full border border-black/10 bg-card/90 p-1 shadow-md">
        <button className="grid size-10 cursor-pointer place-items-center rounded-full border-0 bg-atlas-100 text-lg font-black text-atlas-800 max-sm:size-11" type="button" onClick={viewport.zoomOut} aria-label="缩小世界地图">−</button>
        <button className="grid size-10 cursor-pointer place-items-center rounded-full border-0 bg-atlas-700 text-lg font-black text-white max-sm:size-11" type="button" onClick={viewport.zoomIn} aria-label="放大世界地图">＋</button>
        <button className="min-h-10 cursor-pointer rounded-full border-0 bg-paper-200 px-3 text-meta font-black text-ink max-sm:min-h-11" type="button" onClick={viewport.reset}>复位</button>
      </div>
      <svg
        className={`block h-auto min-h-[330px] w-full touch-none ${viewport.viewport.scale > 1 ? "cursor-grab active:cursor-grabbing" : ""}`}
        viewBox={`0 0 ${WORLD_MAP_WIDTH} ${WORLD_MAP_HEIGHT}`}
        role="img"
        aria-label="可缩放的世界国家地图"
        {...viewport.svgProps}
      >
        <g transform={viewport.transform}>
          {background.map(({ feature, path }) => (
            <path key={feature.properties.id} d={path} fill={MAP_COLORS.worldBackgroundFill} fillRule="evenodd" stroke={MAP_COLORS.worldBackgroundStroke} strokeWidth={0.55} vectorEffect="non-scaling-stroke" aria-hidden="true" />
          ))}
          {playable.map(({ feature, path }) => {
            const countryId = feature.properties.id;
            const completed = completedCountryIds.has(countryId);
            const selected = selectedCountryId === countryId;
            const wrong = wrongCountryId === countryId;
            return (
              <path
                key={countryId}
                d={path}
                className="cursor-pointer transition-[fill,filter] duration-150 hover:brightness-95 focus-visible:brightness-90"
                fill={wrong ? MAP_COLORS.wrongFill : selected ? MAP_COLORS.selectedFill : completed ? MAP_COLORS.worldCompleteFill : MAP_COLORS.worldEmptyFill}
                fillRule="evenodd"
                stroke={wrong ? MAP_COLORS.wrongStroke : selected ? MAP_COLORS.currentStroke : MAP_COLORS.worldBoundary}
                strokeWidth={selected ? 1.4 : 0.65}
                vectorEffect="non-scaling-stroke"
                role="button"
                tabIndex={0}
                aria-label={`${feature.properties.name}${completed ? "，已答对" : ""}`}
                onClick={() => onCountry(feature)}
                onKeyDown={(event) => activate(event, feature)}
              />
            );
          })}
          {showCompletedLabels ? playable.filter(({ feature }) =>
            completedCountryIds.has(feature.properties.id) && feature.properties.label
          ).map(({ feature }) => {
            const [x, y] = projectWorldPosition(feature.properties.label!);
            return (
              <text key={`label-${feature.properties.id}`} x={x} y={y} className="pointer-events-none text-[8px] font-black [paint-order:stroke] [stroke-width:2.5px]" fill={MAP_COLORS.worldLabel} stroke={MAP_COLORS.worldLabelOutline} textAnchor="middle" dominantBaseline="central" aria-hidden="true">{feature.properties.name}</text>
            );
          }) : null}
        </g>
      </svg>
    </div>
  );
}
