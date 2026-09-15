"use client";

import { useMemo } from "react";
import type { Province } from "@/domain/geography/data/provinces";
import {
  geometryToPath,
  handleKeyboardActivation,
  makeProjection,
  MAP_HEIGHT,
  MAP_WIDTH,
} from "@/features/map/lib/map-geometry";
import type { MapData, MapFeature, Position } from "@/features/map/model/map-data";

const HAINAN_PROVINCE_CODE = "460000";
const SANSHA_REGION_CODE = "460300";

export default function GauntletProvinceMapWall({
  map,
  provinces,
  onRegion,
  onProvinceFocus,
  correctRegionName,
  readOnly = false,
}: {
  map: MapData;
  provinces: Province[];
  onRegion: (name: string) => void;
  onProvinceFocus?: (provinceCode: string) => void;
  correctRegionName?: string;
  readOnly?: boolean;
}) {
  const panels = useMemo(
    () =>
      provinces
        .map((province) => {
          const features = map.features.filter(
            (feature) => feature.properties.provinceCode === province.code,
          );
          // 三沙市的离岛跨度会把海南主岛压成小点；答题地图以主岛范围缩放。
          const projectionFeatures = province.code === HAINAN_PROVINCE_CODE
            ? features.filter(
                (feature) => String(feature.properties.adcode) !== SANSHA_REGION_CODE,
              )
            : features;
          return features.length
            ? { province, features, project: makeProjection(projectionFeatures) }
            : null;
        })
        .filter(
          (
            panel,
          ): panel is {
            province: Province;
            features: MapFeature[];
            project: (position: Position) => Position;
          } => Boolean(panel),
        ),
    [map.features, provinces],
  );

  return (
    <div
      className={`grid size-full max-h-[560px] grid-cols-3 gap-2 overflow-auto p-1 max-lg:grid-cols-2 max-sm:grid-cols-1 ${
        panels.length === 1 ? "grid-cols-1" : ""
      }`}
      role="group"
      aria-label={`所选 ${panels.length} 个省份的行政区地图墙`}
    >
      {panels.map(({ province, features, project }) => (
        <section className="relative min-h-44 overflow-hidden rounded-xl border border-black/10 bg-white/60" key={province.code}>
          {onProvinceFocus && panels.length > 1 && !readOnly ? (
            <button
              className="absolute right-2 top-2 z-[2] inline-flex cursor-pointer items-center gap-1 rounded-full border border-brand-green/25 bg-card/90 px-2.5 py-1.5 text-[9px] font-black text-brand-green-dark shadow-sm"
              type="button"
              aria-label="选择此省并放大地图"
              onClick={() => onProvinceFocus(province.code)}
            >
              <span aria-hidden="true">＋</span>
              放大
            </button>
          ) : null}
          <svg className="block size-full min-h-44" viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} role="img" aria-label="无名称省内行政区地图">
            {features.map((feature) => {
              const name = feature.properties.name;
              const isCorrectAnswer = correctRegionName === name;
              return (
                <path
                  key={`${province.code}-${String(feature.properties.adcode)}-${name}`}
                  d={geometryToPath(feature.geometry, project)}
                  className={`${readOnly ? "cursor-default" : "cursor-pointer"} [transition:fill_130ms_ease,stroke-width_130ms_ease,filter_130ms_ease] ${
                    !readOnly && !isCorrectAnswer
                      ? "hover:fill-[#b9d8c4] hover:[stroke-width:2.8px] focus-visible:fill-[#b9d8c4] focus-visible:[stroke-width:2.8px]"
                      : ""
                  } ${isCorrectAnswer ? "drop-shadow-[0_0_5px_rgba(241,199,91,0.68)]" : ""}`}
                  data-region-name={name}
                  fill={isCorrectAnswer ? "#f1c75b" : "#eee4cf"}
                  fillRule="evenodd"
                  role="button"
                  stroke={isCorrectAnswer ? "#8b4a16" : "var(--green)"}
                  strokeLinejoin="round"
                  strokeWidth={isCorrectAnswer ? 3 : 1.8}
                  tabIndex={readOnly ? -1 : 0}
                  aria-disabled={readOnly || undefined}
                  aria-label={isCorrectAnswer ? `${name}，正确答案` : "待选择行政区块"}
                  onClick={() => {
                    if (!readOnly) onRegion(name);
                  }}
                  onKeyDown={(event) => handleKeyboardActivation(
                    event,
                    () => {
                      if (!readOnly) onRegion(name);
                    },
                  )}
                />
              );
            })}
          </svg>
        </section>
      ))}
    </div>
  );
}
