"use client";

import { useMemo } from "react";
import type { Province } from "@/domain/geography/data/provinces";
import {
  featureLabelPosition,
  geometryToPath,
  handleKeyboardActivation,
  makeProjection,
  MAP_HEIGHT,
  MAP_HORIZONTAL_PADDING,
  MAP_VERTICAL_PADDING,
  MAP_WIDTH,
  provinceForFeature,
  visitPositions,
} from "@/features/map/lib/map-geometry";
import { fitRotatedPointsScale } from "@/features/map/lib/silhouette";
import type {
  MapData,
  MapFeature,
  Position,
} from "@/features/map/model/map-data";
import { stripAdministrativeSuffix } from "@/shared/lib/place-name";

const HAINAN_PROVINCE_CODE = "460000";
const SANSHA_REGION_CODE = "460300";

export function ProvinceShape({
  feature,
  className,
  rotation = 0,
  ariaLabel,
}: {
  feature: MapFeature;
  className?: string;
  rotation?: number;
  ariaLabel?: string;
}) {
  const project = useMemo(() => makeProjection([feature]), [feature]);
  const rotationScale = useMemo(() => {
    const projectedPositions: Position[] = [];
    visitPositions(feature.geometry.coordinates, (position) => {
      projectedPositions.push(project(position));
    });
    return fitRotatedPointsScale(
      projectedPositions,
      rotation,
      MAP_WIDTH / 2,
      MAP_HEIGHT / 2,
      MAP_WIDTH - MAP_HORIZONTAL_PADDING * 2,
      MAP_HEIGHT - MAP_VERTICAL_PADDING * 2,
    );
  }, [feature, project, rotation]);

  return (
    <svg
      className={className}
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
    >
      <g
        style={{
          transform: `rotate(${rotation}deg) scale(${rotationScale})`,
          transformOrigin: "center",
        }}
      >
        <path d={geometryToPath(feature.geometry, project)} fillRule="evenodd" />
      </g>
    </svg>
  );
}

export function ProvinceSilhouette({
  feature,
  rotation = 0,
}: {
  feature: MapFeature;
  rotation?: number;
}) {
  return (
    <ProvinceShape
      feature={feature}
      className="gauntlet-silhouette"
      rotation={rotation}
      ariaLabel="待辨认的省级行政区轮廓"
    />
  );
}

export function PuzzlePiece({ feature }: { feature: MapFeature }) {
  const province = provinceForFeature(feature);
  return (
    <div
      className="province-puzzle-piece"
      draggable
      role="img"
      aria-label="可拖动的省份轮廓拼图"
      onDragStart={(event) => {
        event.dataTransfer.setData("gauntlet-province-code", province?.code ?? "");
        event.dataTransfer.effectAllowed = "move";
      }}
    >
      <span>拖动轮廓到地图，也可以直接点击目标省份</span>
      <ProvinceShape feature={feature} />
    </div>
  );
}

export function GauntletDetailMap({
  map,
  onRegion,
  correctRegionName,
  selectedRegionName,
  routeRegionNames = [],
  originRegionName,
  targetRegionName,
  showLabels = false,
  readOnly = false,
}: {
  map: MapData;
  onRegion: (name: string) => void;
  correctRegionName?: string;
  selectedRegionName?: string;
  routeRegionNames?: string[];
  originRegionName?: string;
  targetRegionName?: string;
  showLabels?: boolean;
  readOnly?: boolean;
}) {
  const project = useMemo(() => makeProjection(map.features), [map.features]);
  const routeSet = new Set(routeRegionNames);
  return (
    <svg
      className="gauntlet-detail-map"
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
        const className = [
          correctRegionName === name ? "is-correct-answer" : "",
          selectedRegionName === name ? "is-wrong-selection" : "",
          routeSet.has(name) ? "is-city-route" : "",
          originRegionName === name ? "is-city-origin" : "",
          targetRegionName === name ? "is-city-target" : "",
        ].filter(Boolean).join(" ");
        return (
          <path
            key={`${feature.properties.adcode}-${name}`}
            d={geometryToPath(feature.geometry, project)}
            className={className || undefined}
            fillRule="evenodd"
            role="button"
            tabIndex={readOnly ? -1 : 0}
            aria-disabled={readOnly || undefined}
            aria-label={correctRegionName === name
              ? `${name}，正确答案`
              : selectedRegionName === name
                ? `${name}，你的选择`
                : showLabels
                  ? name
                  : "待选择行政区块"}
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
      {showLabels
        ? map.features.map((feature) => {
            const [x, y] = featureLabelPosition(feature, project);
            const name = feature.properties.name;
            const isCorrectAnswer = correctRegionName === name;
            const isWrongSelection = selectedRegionName === name;
            const className = [
              "city-route-label",
              readOnly ? "is-answer-review-label" : "",
              isCorrectAnswer ? "is-correct-answer-label" : "",
              isWrongSelection ? "is-wrong-selection-label" : "",
            ].filter(Boolean).join(" ");
            return (
              <text
                key={`city-route-label-${name}`}
                x={x}
                y={y}
                className={className}
                textAnchor="middle"
                dominantBaseline="central"
                aria-hidden="true"
              >
                <tspan x={x} dy={isCorrectAnswer || isWrongSelection ? "-0.45em" : 0}>
                  {stripAdministrativeSuffix(name)}
                </tspan>
                {isCorrectAnswer || isWrongSelection ? (
                  <tspan x={x} dy="1.35em" className="city-answer-marker">
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

export function GauntletProvinceMapWall({
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
      className={`gauntlet-province-map-wall ${panels.length === 1 ? "is-single" : ""} ${panels.length > 8 ? "is-many" : ""} ${readOnly ? "is-read-only" : ""}`}
      role="group"
      aria-label={`所选 ${panels.length} 个省份的行政区地图墙`}
    >
      {panels.map(({ province, features, project }) => (
        <section className="gauntlet-province-map-panel" key={province.code}>
          {onProvinceFocus && panels.length > 1 && !readOnly ? (
            <button
              className="gauntlet-province-focus-button"
              type="button"
              aria-label="选择此省并放大地图"
              onClick={() => onProvinceFocus(province.code)}
            >
              <span aria-hidden="true">＋</span>
              放大
            </button>
          ) : null}
          <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} role="img" aria-label="无名称省内行政区地图">
            {features.map((feature) => {
              const name = feature.properties.name;
              return (
                <path
                  key={`${province.code}-${String(feature.properties.adcode)}-${name}`}
                  d={geometryToPath(feature.geometry, project)}
                  className={correctRegionName === name ? "is-correct-answer" : undefined}
                  data-region-name={name}
                  fillRule="evenodd"
                  role="button"
                  tabIndex={readOnly ? -1 : 0}
                  aria-disabled={readOnly || undefined}
                  aria-label="待选择行政区块"
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

export function GauntletNationalMap({
  map,
  selectedCodes,
  correctCodes,
  routeCodes,
  originCode,
  showLabels,
  onProvince,
  onProvinceDrop,
}: {
  map: MapData;
  selectedCodes: Set<string>;
  correctCodes?: Set<string>;
  routeCodes: string[];
  originCode: string | null;
  showLabels: boolean;
  onProvince: (province: Province) => void;
  onProvinceDrop?: (province: Province, draggedCode: string) => void;
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
      className="gauntlet-national-map"
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      role="img"
      aria-label="闯关用中国省级行政区地图"
    >
      <g>
        {features.map((feature) => {
          const province = provinceForFeature(feature)!;
          const selected = selectedCodes.has(province.code);
          const correctAnswer = correctCodes?.has(province.code) ?? false;
          const inRoute = routeSet.has(province.code);
          const current = currentCode === province.code;
          const origin = originCode === province.code;
          return (
            <path
              key={province.code}
              d={geometryToPath(feature.geometry, project)}
              className={`gauntlet-national-region ${selected ? "is-selected" : ""} ${correctAnswer ? "is-correct-answer" : ""} ${inRoute ? "is-route" : ""} ${current ? "is-current" : ""} ${origin ? "is-origin" : ""}`}
              fillRule="evenodd"
              role="button"
              tabIndex={0}
              aria-label={`${province.name}${selected ? "，已选择" : ""}${correctAnswer ? "，正确答案" : ""}${inRoute ? "，已加入路线" : ""}`}
              onClick={() => onProvince(province)}
              onDragOver={(event) => {
                if (onProvinceDrop) event.preventDefault();
              }}
              onDrop={(event) => {
                if (!onProvinceDrop) return;
                event.preventDefault();
                onProvinceDrop(
                  province,
                  event.dataTransfer.getData("gauntlet-province-code"),
                );
              }}
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
                className={province.shortName.length > 3 ? "is-long" : ""}
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
