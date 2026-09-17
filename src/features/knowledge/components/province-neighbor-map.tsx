"use client";

import { useMemo } from "react";
import { NATIONAL_MAP_CODE } from "@/domain/geography/data/provinces";
import type { KnowledgeProvince } from "@/features/knowledge/model/knowledge-types";
import LoadingMap from "@/features/map/components/loading-map";
import {
  featureLabelPosition,
  geometryToPath,
  handleKeyboardActivation,
  makeProjection,
  MAP_HEIGHT,
  MAP_WIDTH,
  provinceForFeature,
} from "@/features/map/lib/map-geometry";
import { type MapFeature, useMapData } from "@/features/map/model/map-data";
import { MAP_COLORS } from "@/shared/config/map-colors";

function coordinateCount(value: unknown): number {
  if (!Array.isArray(value)) return 0;
  if (value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number") {
    return 1;
  }
  return value.reduce<number>((total, part) => total + coordinateCount(part), 0);
}

function focusProvinceFeature(feature: MapFeature) {
  if (feature.geometry.type !== "MultiPolygon") return feature;
  const polygons = feature.geometry.coordinates as unknown[];
  const mainPolygon = polygons.reduce<unknown | null>((largest, polygon) => (
    !largest || coordinateCount(polygon) > coordinateCount(largest) ? polygon : largest
  ), null);
  if (!mainPolygon) return feature;
  return {
    ...feature,
    geometry: { type: "Polygon" as const, coordinates: mainPolygon },
  };
}

export default function ProvinceNeighborMap({
  centerProvince,
  neighborCodes,
  onSelectProvince,
}: {
  centerProvince: KnowledgeProvince;
  neighborCodes: string[];
  onSelectProvince: (provinceCode: string) => void;
}) {
  const { data: nationalMap, error } = useMapData(NATIONAL_MAP_CODE);
  const visibleCodes = useMemo(
    () => new Set([centerProvince.code, ...neighborCodes]),
    [centerProvince.code, neighborCodes],
  );
  const features = useMemo(
    () => nationalMap?.features
      .filter((feature) => {
        const province = provinceForFeature(feature);
        return province ? visibleCodes.has(province.code) : false;
      })
      .map((feature) => neighborCodes.length === 0 ? focusProvinceFeature(feature) : feature)
      .sort((left, right) => {
        const leftIsCenter = provinceForFeature(left)?.code === centerProvince.code;
        const rightIsCenter = provinceForFeature(right)?.code === centerProvince.code;
        return Number(leftIsCenter) - Number(rightIsCenter);
      }) ?? [],
    [centerProvince.code, nationalMap?.features, neighborCodes.length, visibleCodes],
  );
  const project = useMemo(
    () => features.length > 0 ? makeProjection(features) : null,
    [features],
  );

  return (
    <div className="knowledge-neighbor-map grid w-full max-w-[780px] gap-3.5">
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-meta font-bold text-ink-600" aria-hidden="true">
        <span className="inline-flex items-center gap-2">
          <i className="size-3 rounded-[3px] border border-jade-800 bg-jade-500" />
          中心省份
        </span>
        <span className="inline-flex items-center gap-2">
          <i className="size-3 rounded-[3px] border border-moss-500 bg-jade-200" />
          陆地邻省
        </span>
      </div>
      <div className="relative grid min-h-[390px] place-items-center overflow-hidden rounded-[18px] border border-jade-500/20 bg-paper-100/65 px-4 py-3 shadow-[inset_0_0_40px_rgba(45,125,95,.06)] max-sm:min-h-[300px] max-sm:px-2">
        {error ? (
          <div className="grid place-items-center gap-2 p-8 text-center" role="alert">
            <strong className="text-card-title">地图没有成功展开</strong>
            <p className="m-0 text-compact text-ink-soft">请刷新页面后重试。</p>
          </div>
        ) : project ? (
          <svg
            className="block h-auto max-h-[450px] w-full overflow-visible drop-shadow-[0_12px_12px_rgba(33,77,58,0.12)]"
            viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
            role="group"
            aria-label={`${centerProvince.name}及其${neighborCodes.length}个陆地邻省的局部地图`}
          >
            {features.map((feature) => {
              const province = provinceForFeature(feature);
              if (!province) return null;
              const isCenter = province.code === centerProvince.code;
              return (
                <path
                  key={province.code}
                  d={geometryToPath(feature.geometry, project)}
                  className="cursor-pointer transition-[fill,filter] duration-150 hover:brightness-[0.96] focus-visible:brightness-[0.92]"
                  fill={isCenter ? MAP_COLORS.neighborCenterFill : MAP_COLORS.neighborFill}
                  fillRule="evenodd"
                  role="button"
                  stroke={isCenter ? MAP_COLORS.neighborCenterStroke : MAP_COLORS.neighborStroke}
                  strokeLinejoin="round"
                  strokeWidth={isCenter ? 3.4 : 2.2}
                  tabIndex={0}
                  vectorEffect="non-scaling-stroke"
                  aria-current={isCenter ? "true" : undefined}
                  aria-label={`${province.name}${isCenter ? "，当前中心省份" : "，陆地邻省，点击设为中心省份"}`}
                  onClick={() => onSelectProvince(province.code)}
                  onKeyDown={(event) => handleKeyboardActivation(
                    event,
                    () => onSelectProvince(province.code),
                  )}
                />
              );
            })}
            {features.map((feature) => {
              const province = provinceForFeature(feature);
              if (!province) return null;
              const isCenter = province.code === centerProvince.code;
              const [x, y] = featureLabelPosition(feature, project);
              const labelSizeClass = province.shortName.length > 3
                ? "text-[22px] sm:text-[12px]"
                : isCenter
                  ? "text-[34px] sm:text-[18px]"
                  : "text-[28px] sm:text-[15px]";
              return (
                <text
                  key={`neighbor-label-${province.code}`}
                  x={x}
                  y={y}
                  className={`pointer-events-none font-sans font-black [paint-order:stroke] [stroke-linejoin:round] ${labelSizeClass}`}
                  fill={isCenter ? MAP_COLORS.neighborCenterLabel : MAP_COLORS.neighborLabel}
                  stroke={isCenter ? MAP_COLORS.neighborCenterStroke : MAP_COLORS.neighborLabelOutline}
                  strokeWidth={isCenter ? 4 : 3.5}
                  textAnchor="middle"
                  dominantBaseline="central"
                  aria-hidden="true"
                >
                  {province.shortName}
                </text>
              );
            })}
          </svg>
        ) : (
          <LoadingMap />
        )}
      </div>
      <p className="m-0 text-center text-meta text-ink-soft">
        {neighborCodes.length > 0
          ? "点击任一邻省，可将它切换为新的中心省份"
          : "该省暂无陆地邻省，地图仅显示中心省份"}
      </p>
    </div>
  );
}
