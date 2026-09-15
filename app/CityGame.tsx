"use client";

import {
  lazy,
  memo,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CITY_PLATE_PREFIX_COUNT,
  CITY_QUIZ_DATA,
  PLATE_QUIZ_DATA,
  plateAnswerMatches,
  plateCollectionsOverlap,
  provinceCityAnswerMatches,
  uniqueReversePlateItems,
  type CityQuizItem,
} from "./gauntlet-data";
import {
  MAP_REGION_QUIZ_DATA,
  type MapRegionQuizItem,
} from "./map-region-quiz-data";
import {
  CITY_MAP_RECENT_QUESTION_LIMIT,
  cityQuizKey,
  createCityMapQuestionQueue,
  type NamedRegionQuizItem,
} from "./city-map-question-queue";
import {
  UNIVERSITY_QUIZ_DATA,
  type UniversityQuizItem,
} from "./university-data";
import {
  CONFUSABLE_CITY_PAIRS,
  type ConfusableCityPair,
} from "./confusable-city-data";
import {
  PROVINCE_CITY_COUNT_DATA,
  type ProvinceCityCountItem,
} from "./province-city-count-data";
import { RIVER_KNOWLEDGE } from "./knowledge-data";
import {
  normalizeMistakeList,
  type MistakeQuestion,
  type MistakeSeed,
  upsertMistake,
} from "./mistake-data";
import {
  useMapCollection,
  useMapData,
  type Geometry,
  type MapData,
  type MapFeature,
  type Position,
} from "./map-data";
import { fitRotatedPointsScale } from "./silhouette-utils";
import {
  GAUNTLET_LEVEL_BY_ID,
  GAUNTLET_LEVEL_COUNT,
  GAUNTLET_LEVEL_ID,
  GAUNTLET_LEVELS,
  gauntletLevelNumber,
  isStoredGauntletLevelId,
  type GauntletLevelId,
} from "./gauntlet-levels";
import {
  ALL_PROVINCE_CODES,
  PROVINCE_BY_CODE,
  PROVINCE_BY_NAME,
  PROVINCE_BY_SHORT_NAME,
  PROVINCE_CAPITALS,
  PROVINCE_NEIGHBORS,
  PROVINCE_PLATE_PREFIXES,
  PROVINCES,
  type Province,
} from "./province-data";
import { usePlayerData } from "./PlayerDataProvider";
import {
  GAUNTLET_PLATE_CITY_MAP_HISTORY_KEY,
  GAUNTLET_REGION_MAP_HISTORY_KEY,
  GAUNTLET_MISTAKES_KEY,
  GAUNTLET_PROVINCE_SCOPE_KEY,
  GAUNTLET_PROGRESS_KEY,
  HARD_MODE_KEY,
  NEIGHBOR_MODE_KEY,
  NEIGHBOR_PROGRESS_KEY,
  STORAGE_KEY,
  type ProgressStorage,
} from "./progress-storage";

const KnowledgeBase = lazy(() => import("./KnowledgeBase"));
const LEVEL = GAUNTLET_LEVEL_ID;

const MAP_WIDTH = 920;
const MAP_HEIGHT = 600;
const MAP_HORIZONTAL_PADDING = 46;
const MAP_VERTICAL_PADDING = 36;
const PROVINCE_FILL_COLORS = [
  "#f0beb8",
  "#f3c99b",
  "#eee093",
  "#b8d9f0",
  "#bfc8ec",
  "#d2bdeb",
  "#edbdd8",
  "#d9c1a8",
  "#c2d0da",
];

function compactName(value: string) {
  return value.trim().replace(/\s+/g, "").replace(/臺/g, "台");
}

const CITY_PLATE_BY_NAME = new Map(
  PLATE_QUIZ_DATA.map((item) => [compactName(item.city), item.plate]),
);

function stripAdministrativeSuffix(value: string) {
  return value.replace(
    /(特别行政区|维吾尔自治区|壮族自治区|回族自治区|自治区|自治州|地区|新区|林区|盟|省|市|区|县)$/,
    "",
  );
}

function answerMatches(answer: string, targets: string[]) {
  const candidate = compactName(answer);
  if (!candidate) return false;
  return targets.some((target) => {
    const normalizedTarget = compactName(target);
    return (
      candidate === normalizedTarget ||
      candidate === stripAdministrativeSuffix(normalizedTarget)
    );
  });
}

function nationalChallengeMessage(hardMode: boolean, neighborMode: boolean) {
  if (hardMode) return "难度提升：点击省级行政区并输入名称解锁";
  if (neighborMode) return "邻省连城：选择一个省份，联动它的所有接壤省份";
  return "请选择一个省级行政区开始挑战";
}

function visitPositions(value: unknown, callback: (position: Position) => void) {
  if (!Array.isArray(value)) return;
  if (
    value.length >= 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number"
  ) {
    callback(value as Position);
    return;
  }
  value.forEach((part) => visitPositions(part, callback));
}

function makeProjection(features: MapFeature[]) {
  let minLongitude = Infinity;
  let maxLongitude = -Infinity;
  let minLatitude = Infinity;
  let maxLatitude = -Infinity;

  features.forEach((feature) => {
    visitPositions(feature.geometry.coordinates, ([longitude, latitude]) => {
      minLongitude = Math.min(minLongitude, longitude);
      maxLongitude = Math.max(maxLongitude, longitude);
      minLatitude = Math.min(minLatitude, latitude);
      maxLatitude = Math.max(maxLatitude, latitude);
    });
  });

  const longitudeSpan = Math.max(maxLongitude - minLongitude, 0.01);
  const latitudeSpan = Math.max(maxLatitude - minLatitude, 0.01);
  const scale = Math.min(
    (MAP_WIDTH - MAP_HORIZONTAL_PADDING * 2) / longitudeSpan,
    (MAP_HEIGHT - MAP_VERTICAL_PADDING * 2) / latitudeSpan,
  );
  const renderedWidth = longitudeSpan * scale;
  const renderedHeight = latitudeSpan * scale;
  const offsetX = (MAP_WIDTH - renderedWidth) / 2;
  const offsetY = (MAP_HEIGHT - renderedHeight) / 2;

  return ([longitude, latitude]: Position): Position => [
    offsetX + (longitude - minLongitude) * scale,
    offsetY + (maxLatitude - latitude) * scale,
  ];
}

function ringToPath(ring: unknown, project: (position: Position) => Position) {
  if (!Array.isArray(ring)) return "";
  return ring
    .map((position, index) => {
      const [x, y] = project(position as Position);
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ") + " Z";
}

function geometryToPath(
  geometry: Geometry,
  project: (position: Position) => Position,
) {
  const coordinates = geometry.coordinates as unknown[];
  if (geometry.type === "Polygon") {
    return coordinates.map((ring) => ringToPath(ring, project)).join(" ");
  }
  return coordinates
    .flatMap((polygon) =>
      (polygon as unknown[]).map((ring) => ringToPath(ring, project)),
    )
    .join(" ");
}

function featureLabelPosition(
  feature: MapFeature,
  project: (position: Position) => Position,
) {
  const preferred = feature.properties.center ?? feature.properties.centroid;
  if (preferred) return project(preferred);

  let minLongitude = Infinity;
  let maxLongitude = -Infinity;
  let minLatitude = Infinity;
  let maxLatitude = -Infinity;
  visitPositions(feature.geometry.coordinates, ([longitude, latitude]) => {
    minLongitude = Math.min(minLongitude, longitude);
    maxLongitude = Math.max(maxLongitude, longitude);
    minLatitude = Math.min(minLatitude, latitude);
    maxLatitude = Math.max(maxLatitude, latitude);
  });
  return project([
    (minLongitude + maxLongitude) / 2,
    (minLatitude + maxLatitude) / 2,
  ]);
}

function provinceForFeature(feature: MapFeature) {
  const code = String(feature.properties.adcode ?? "");
  return (
    PROVINCE_BY_CODE.get(code) ??
    PROVINCE_BY_NAME.get(feature.properties.name)
  );
}

function handleKeyboardActivation(
  event: React.KeyboardEvent<SVGPathElement>,
  action: () => void,
) {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  action();
}

function shuffleWithRandom<T>(values: T[], nextRandom: () => number) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(nextRandom() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}

function deterministicShuffle(values: string[], seed: string) {
  let state = Number(seed) || 1;
  return shuffleWithRandom(values, () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  });
}

function randomShuffle<T>(values: T[]) {
  return shuffleWithRandom(values, Math.random);
}

function setsEqual<T>(left: Set<T>, right: Set<T>) {
  return left.size === right.size && Array.from(left).every((item) => right.has(item));
}

function findShortestPath(
  start: string,
  end: string,
  adjacency: Record<string, string[]>,
) {
  const queue: string[][] = [[start]];
  const visited = new Set([start]);
  for (let queueIndex = 0; queueIndex < queue.length; queueIndex += 1) {
    const path = queue[queueIndex];
    const current = path[path.length - 1];
    if (current === end) return path;
    for (const neighbor of adjacency[current] ?? []) {
      if (visited.has(neighbor)) continue;
      visited.add(neighbor);
      queue.push([...path, neighbor]);
    }
  }
  return [];
}

function MapCanvas({
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

function LoadingMap() {
  return (
    <div className="map-loading" role="status">
      <span className="loading-compass" aria-hidden="true" />
      <p>正在展开地图…</p>
    </div>
  );
}

type AtlasView = {
  scale: number;
  x: number;
  y: number;
};

type AtlasRegionDrawing = {
  key: string;
  path: string;
  fill: string;
  name: string;
  plate: string;
  labelX: number;
  labelY: number;
  longLabel: boolean;
};

type AtlasProvinceDrawing = {
  key: string;
  path: string;
};

type AtlasHoverLabel = {
  name: string;
  plate: string;
  left: number;
  top: number;
};

const ATLAS_MIN_SCALE = 1;
const ATLAS_MAX_SCALE = 8;

const AtlasRegionShapes = memo(function AtlasRegionShapes({
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

const AtlasProvinceOutlines = memo(function AtlasProvinceOutlines({
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

const AtlasLabels = memo(function AtlasLabels({
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

function atlasPointerPosition(
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

function NationalCityAtlas({
  map,
  nationalMap,
  error,
  onExit,
}: {
  map: MapData | null;
  nationalMap: MapData | null;
  error: boolean;
  onExit: () => void;
}) {
  const [view, setView] = useState<AtlasView>({ scale: 1, x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [labelsVisible, setLabelsVisible] = useState(true);
  const [hoverLabel, setHoverLabel] = useState<AtlasHoverLabel | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    viewX: number;
    viewY: number;
  } | null>(null);
  const activePointersRef = useRef(
    new Map<number, { clientX: number; clientY: number }>(),
  );
  const pinchRef = useRef<{
    distance: number;
    midpoint: Position;
  } | null>(null);
  const project = useMemo(
    () => (map?.features.length ? makeProjection(map.features) : null),
    [map],
  );
  const provinceFillColors = useMemo(
    () =>
      Object.fromEntries(
        PROVINCES.map((province, index) => [
          province.code,
          PROVINCE_FILL_COLORS[index % PROVINCE_FILL_COLORS.length],
        ]),
      ),
    [],
  );
  const atlasRegions = useMemo<AtlasRegionDrawing[]>(() => {
    if (!map || !project) return [];
    return map.features.map((feature) => {
      const provinceCode = feature.properties.provinceCode ?? "";
      const name = feature.properties.name;
      const [labelX, labelY] = featureLabelPosition(feature, project);
      return {
        key: `${provinceCode}-${String(feature.properties.adcode)}`,
        path: geometryToPath(feature.geometry, project),
        fill: provinceFillColors[provinceCode] ?? "#ece4d4",
        name,
        plate:
          CITY_PLATE_BY_NAME.get(compactName(name)) ??
          PROVINCE_PLATE_PREFIXES[provinceCode] ??
          "—",
        labelX,
        labelY,
        longLabel: name.length > 6,
      };
    });
  }, [map, project, provinceFillColors]);
  const atlasProvinces = useMemo<AtlasProvinceDrawing[]>(() => {
    if (!nationalMap || !project) return [];
    return nationalMap.features.map((feature) => ({
      key: String(feature.properties.adcode),
      path: geometryToPath(feature.geometry, project),
    }));
  }, [nationalMap, project]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const zoomBy = useCallback(
    (factor: number, anchorX = MAP_WIDTH / 2, anchorY = MAP_HEIGHT / 2) => {
      setView((current) => {
        const scale = Math.min(
          ATLAS_MAX_SCALE,
          Math.max(ATLAS_MIN_SCALE, current.scale * factor),
        );
        if (scale === current.scale) return current;
        const mapX = (anchorX - current.x) / current.scale;
        const mapY = (anchorY - current.y) / current.scale;
        return {
          scale,
          x: anchorX - mapX * scale,
          y: anchorY - mapY * scale,
        };
      });
    },
    [],
  );

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const [anchorX, anchorY] = atlasPointerPosition(
        svg,
        event.clientX,
        event.clientY,
      );
      const deltaPixels = event.deltaY * (
        event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? svg.clientHeight : 1
      );
      const limitedDelta = Math.max(-120, Math.min(120, deltaPixels));
      zoomBy(Math.exp(-limitedDelta * 0.002), anchorX, anchorY);
    };
    svg.addEventListener("wheel", handleWheel, { passive: false });
    return () => svg.removeEventListener("wheel", handleWheel);
  }, [atlasRegions.length, zoomBy]);

  const resetView = useCallback(() => {
    setView({ scale: 1, x: 0, y: 0 });
  }, []);

  const handlePointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    setHoverLabel(null);
    activePointersRef.current.set(event.pointerId, {
      clientX: event.clientX,
      clientY: event.clientY,
    });
    event.currentTarget.setPointerCapture(event.pointerId);

    if (activePointersRef.current.size >= 2) {
      const [first, second] = Array.from(activePointersRef.current.values());
      const midpointClientX = (first.clientX + second.clientX) / 2;
      const midpointClientY = (first.clientY + second.clientY) / 2;
      pinchRef.current = {
        distance: Math.hypot(
          second.clientX - first.clientX,
          second.clientY - first.clientY,
        ),
        midpoint: atlasPointerPosition(
          event.currentTarget,
          midpointClientX,
          midpointClientY,
        ),
      };
      dragRef.current = null;
      setDragging(true);
      return;
    }

    const [viewX, viewY] = atlasPointerPosition(
      event.currentTarget,
      event.clientX,
      event.clientY,
    );
    dragRef.current = {
      pointerId: event.pointerId,
      viewX,
      viewY,
    };
    setDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!activePointersRef.current.has(event.pointerId)) return;
    activePointersRef.current.set(event.pointerId, {
      clientX: event.clientX,
      clientY: event.clientY,
    });

    if (activePointersRef.current.size >= 2) {
      const [first, second] = Array.from(activePointersRef.current.values());
      const nextDistance = Math.hypot(
        second.clientX - first.clientX,
        second.clientY - first.clientY,
      );
      const nextMidpoint = atlasPointerPosition(
        event.currentTarget,
        (first.clientX + second.clientX) / 2,
        (first.clientY + second.clientY) / 2,
      );
      const previousPinch = pinchRef.current;
      if (previousPinch && previousPinch.distance > 0 && nextDistance > 0) {
        setView((current) => {
          const scale = Math.min(
            ATLAS_MAX_SCALE,
            Math.max(
              ATLAS_MIN_SCALE,
              current.scale * (nextDistance / previousPinch.distance),
            ),
          );
          const mapX = (previousPinch.midpoint[0] - current.x) / current.scale;
          const mapY = (previousPinch.midpoint[1] - current.y) / current.scale;
          return {
            scale,
            x: nextMidpoint[0] - mapX * scale,
            y: nextMidpoint[1] - mapY * scale,
          };
        });
      }
      pinchRef.current = { distance: nextDistance, midpoint: nextMidpoint };
      return;
    }

    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const [viewX, viewY] = atlasPointerPosition(
      event.currentTarget,
      event.clientX,
      event.clientY,
    );
    const deltaX = viewX - drag.viewX;
    const deltaY = viewY - drag.viewY;
    dragRef.current = {
      ...drag,
      viewX,
      viewY,
    };
    setView((current) => ({
      ...current,
      x: current.x + deltaX,
      y: current.y + deltaY,
    }));
  };

  const endPointerDrag = (event: React.PointerEvent<SVGSVGElement>) => {
    activePointersRef.current.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    pinchRef.current = null;

    const remainingPointer = activePointersRef.current.entries().next().value as
      | [number, { clientX: number; clientY: number }]
      | undefined;
    if (remainingPointer) {
      const [pointerId, pointer] = remainingPointer;
      const [viewX, viewY] = atlasPointerPosition(
        event.currentTarget,
        pointer.clientX,
        pointer.clientY,
      );
      dragRef.current = { pointerId, viewX, viewY };
      setDragging(true);
      return;
    }

    dragRef.current = null;
    setDragging(false);
  };

  const handleRegionEnter = useCallback((
    region: AtlasRegionDrawing,
    event: React.PointerEvent<SVGPathElement>,
  ) => {
    if (labelsVisible || activePointersRef.current.size > 0) return;
    const bounds = svgRef.current?.getBoundingClientRect();
    if (!bounds) return;
    setHoverLabel({
      name: region.name,
      plate: region.plate,
      left: Math.max(8, Math.min(bounds.width - 170, event.clientX - bounds.left + 14)),
      top: Math.max(8, Math.min(bounds.height - 70, event.clientY - bounds.top + 14)),
    });
  }, [labelsVisible]);

  const handleRegionLeave = useCallback(() => {
    setHoverLabel(null);
  }, []);

  const toggleLabels = () => {
    setLabelsVisible((current) => !current);
    setHoverLabel(null);
  };

  return (
    <main className="city-atlas-shell">
      <header className="city-atlas-header">
        <div className="city-atlas-title">
          <span aria-hidden="true">图</span>
          <div>
            <p>可缩放全国城市参考地图</p>
            <h1>全国车牌图鉴</h1>
          </div>
        </div>
        <div className="city-atlas-summary" aria-label="图鉴数据范围">
          <span><strong>34</strong> 省级行政区</span>
          <span><strong>{map?.features.length ?? "…"}</strong> 市级 / 区县区块</span>
          <span><strong>{CITY_PLATE_PREFIX_COUNT}</strong> 个区域车牌前缀</span>
        </div>
        <button className="city-atlas-exit" type="button" onClick={onExit}>
          <span aria-hidden="true">←</span> 返回挑战首页
        </button>
      </header>

      <section className="city-atlas-workspace">
        <div className="city-atlas-help">
          <p><span className="legend-line legend-line--red" />红色省界</p>
          <p><span className="legend-line legend-line--green" />绿色市界 / 区县界</p>
          <p>滚轮或双指缩放 · 按住拖动</p>
          <button
            className={`city-atlas-label-toggle ${labelsVisible ? "is-active" : ""}`}
            type="button"
            aria-label={labelsVisible ? "隐藏全部文字" : "显示全部文字"}
            aria-pressed={labelsVisible}
            onClick={toggleLabels}
          >
            <span aria-hidden="true">文</span>
            {labelsVisible ? "隐藏文字" : "显示文字"}
          </button>
          <small>车牌题库已收录的城市、自治州、地区和盟显示完整前缀；其余区县显示省级车牌简称。</small>
        </div>

        <div className="city-atlas-canvas">
          {error ? (
            <div className="map-error city-atlas-error" role="alert">
              全国市级地图加载失败，请刷新页面后重试。
            </div>
          ) : !map || !nationalMap || !project ? (
            <LoadingMap />
          ) : (
            <svg
              ref={svgRef}
              className={`city-atlas-map ${dragging ? "is-dragging" : ""}`}
              viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
              role="img"
              aria-label="标注城市名称与车牌前缀的中国地图"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={endPointerDrag}
              onPointerCancel={endPointerDrag}
            >
              <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
                <AtlasRegionShapes
                  regions={atlasRegions}
                  onRegionEnter={handleRegionEnter}
                  onRegionLeave={handleRegionLeave}
                />
                <AtlasProvinceOutlines provinces={atlasProvinces} />
                {labelsVisible ? <AtlasLabels regions={atlasRegions} /> : null}
              </g>
            </svg>
          )}

          {!labelsVisible && hoverLabel ? (
            <div
              className="city-atlas-hover-label"
              style={{ left: hoverLabel.left, top: hoverLabel.top }}
              role="status"
            >
              <strong>{hoverLabel.name}</strong>
              <span>{hoverLabel.plate}</span>
            </div>
          ) : null}

          <div className="city-atlas-toolbar" aria-label="地图缩放工具栏">
            <button
              type="button"
              aria-label="放大地图"
              disabled={view.scale >= ATLAS_MAX_SCALE}
              onClick={() => zoomBy(1.35)}
            >
              <span aria-hidden="true">＋</span> 放大
            </button>
            <output aria-label="当前缩放比例">{Math.round(view.scale * 100)}%</output>
            <button
              type="button"
              aria-label="缩小地图"
              disabled={view.scale <= ATLAS_MIN_SCALE}
              onClick={() => zoomBy(1 / 1.35)}
            >
              <span aria-hidden="true">−</span> 缩小
            </button>
            <button type="button" onClick={resetView}>
              <span aria-hidden="true">⌂</span> 复位
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

type GauntletLevel = GauntletLevelId;

const MAP_REQUIRED_LEVELS = new Set<GauntletLevel>([
  GAUNTLET_LEVEL_ID.PROVINCE_SHAPE,
  GAUNTLET_LEVEL_ID.CITY_MAP,
  GAUNTLET_LEVEL_ID.NEIGHBOR_CHAIN,
  GAUNTLET_LEVEL_ID.PROVINCE_PUZZLE,
  GAUNTLET_LEVEL_ID.REGION_MAP,
  GAUNTLET_LEVEL_ID.TERRITORY_GROUPS,
  GAUNTLET_LEVEL_ID.PROVINCE_SHORTEST_ROUTE,
  GAUNTLET_LEVEL_ID.ROTATED_SHAPE,
  GAUNTLET_LEVEL_ID.PLATE_CITY_MAP,
  GAUNTLET_LEVEL_ID.FINAL_BOSS,
]);

const FIXED_SCOPE_LEVELS = new Set<GauntletLevel>([
  GAUNTLET_LEVEL_ID.NEIGHBOR_CHAIN,
  GAUNTLET_LEVEL_ID.TERRITORY_GROUPS,
  GAUNTLET_LEVEL_ID.PROVINCE_SHORTEST_ROUTE,
  GAUNTLET_LEVEL_ID.CONFUSABLE_CITIES,
  GAUNTLET_LEVEL_ID.MISTAKE_REVENGE,
  GAUNTLET_LEVEL_ID.FINAL_BOSS,
]);

const PLATE_QUESTION_LEVELS = new Set<GauntletLevel>([
  GAUNTLET_LEVEL_ID.PLATE_PLACE,
  GAUNTLET_LEVEL_ID.PLATE_COMPLETION,
  GAUNTLET_LEVEL_ID.TRUTH_FLASH,
  GAUNTLET_LEVEL_ID.PLATE_FAULT,
  GAUNTLET_LEVEL_ID.PLATE_CITY_MAP,
]);

const STREAK_NOTE_LEVELS = new Set<GauntletLevel>([
  GAUNTLET_LEVEL_ID.CITY_PROVINCE,
  GAUNTLET_LEVEL_ID.PLATE_PLACE,
  GAUNTLET_LEVEL_ID.PROVINCE_NEIGHBORS,
  GAUNTLET_LEVEL_ID.PLATE_COMPLETION,
  GAUNTLET_LEVEL_ID.CITY_MAP,
  GAUNTLET_LEVEL_ID.TRUTH_FLASH,
  GAUNTLET_LEVEL_ID.CITY_UNDERCOVER,
  GAUNTLET_LEVEL_ID.REGION_MAP,
  GAUNTLET_LEVEL_ID.TERRITORY_GROUPS,
  GAUNTLET_LEVEL_ID.GEOGRAPHY_ELIMINATION,
  GAUNTLET_LEVEL_ID.ROTATED_SHAPE,
  GAUNTLET_LEVEL_ID.PLATE_FAULT,
  GAUNTLET_LEVEL_ID.UNIVERSITY_CITY,
  GAUNTLET_LEVEL_ID.CONFUSABLE_CITIES,
  GAUNTLET_LEVEL_ID.CITY_SHORTEST_ROUTE,
  GAUNTLET_LEVEL_ID.PROVINCE_CITY_COUNT,
  GAUNTLET_LEVEL_ID.PLATE_CITY_MAP,
  GAUNTLET_LEVEL_ID.MISTAKE_REVENGE,
  GAUNTLET_LEVEL_ID.FINAL_BOSS,
]);

const GAUNTLET_OPENING_FEEDBACK = Object.fromEntries(
  GAUNTLET_LEVELS.map((level) => [level.id, level.openingFeedback]),
) as Record<GauntletLevel, string>;

const GAUNTLET_ROUND_HEADINGS = Object.fromEntries(
  GAUNTLET_LEVELS.map((level) => [level.id, level.roundHeading]),
) as Record<GauntletLevel, string>;

const GAUNTLET_TIME_LIMIT = 90;

type ProvinceGroupQuestion = {
  title: string;
  description: string;
  codes: string[];
};

const PROVINCE_GROUP_QUESTIONS: ProvinceGroupQuestion[] = [
  {
    title: "沿海省级行政区",
    description: "选择所有拥有海岸线的省级行政区",
    codes: [
      "120000", "130000", "210000", "310000", "320000", "330000",
      "350000", "370000", "440000", "450000", "460000", "710000",
      "810000", "820000",
    ],
  },
  {
    title: "陆地边境省级行政区",
    description: "选择所有与其他国家存在陆地边界的省级行政区",
    codes: [
      "150000", "210000", "220000", "230000", "450000", "530000",
      "540000", "620000", "650000",
    ],
  },
  {
    title: "长江干流流经省级行政区",
    description: "选择长江干流流经或作为省界经过的省级行政区",
    codes:
      RIVER_KNOWLEDGE.find((river) => river.id === "yangtze")?.provinceCodes ?? [],
  },
];

type UndercoverQuestion = {
  province: string;
  options: CityQuizItem[];
  answerCity: string;
  explanation: string;
};

type DualIntruderQuestion = {
  prompt: string;
  instruction: string;
  options: string[];
  answer: string;
  explanation: string;
};

type PlateFaultQuestion = {
  options: Array<{ id: string; label: string }>;
  answer: string;
  explanation: string;
};

type RouteChallenge = {
  startCode: string;
  endCode: string;
  shortestPath: string[];
};

type ConfusableCityQuestion = {
  id: string;
  pair: [string, string];
  prompt: string;
  instruction: string;
  options: string[];
  answer: string;
  explanation: string;
};

type CityAdjacencyMap = Record<string, string[]>;

type CityRouteChallenge = {
  provinceCode: string;
  startName: string;
  endName: string;
  shortestPath: string[];
};

type BossSkill = "城市归属" | "车牌识别" | "行政中心" | "真假判断" | "地图落点" | "轮廓辨认";

type BossQuestion = {
  skill: BossSkill;
} & (
  | {
      kind: "text";
      badge: string;
      prompt: string;
      value: string;
      targets: string[];
      explanation: string;
      matchAllTargets?: boolean;
    }
  | {
      kind: "truth";
      badge: string;
      prompt: string;
      value: string;
      isTrue: boolean;
      explanation: string;
    }
  | {
      kind: "map";
      badge: string;
      prompt: string;
      value: string;
      provinceCode: string;
      explanation: string;
    }
  | {
      kind: "shape";
      badge: string;
      prompt: string;
      provinceCode: string;
      targets: string[];
      explanation: string;
    }
);

type BossSkillStat = {
  correct: number;
  total: number;
};

type AnswerReview = {
  correct: boolean;
  correctAnswer: string;
  explanation: string;
  level: GauntletLevel;
  nextAction: "next" | "finish" | "lose";
  highlightProvinceCodes?: string[];
  highlightRegionName?: string;
  selectedRegionName?: string;
  checkpoint?: string;
};

const BOSS_SKILLS: BossSkill[] = [
  "城市归属", "车牌识别", "行政中心", "真假判断", "地图落点", "轮廓辨认",
];

function createEmptyBossStats(): Record<BossSkill, BossSkillStat> {
  return Object.fromEntries(
    BOSS_SKILLS.map((skill) => [skill, { correct: 0, total: 0 }]),
  ) as Record<BossSkill, BossSkillStat>;
}

const ALL_GAUNTLET_PROVINCE_NAMES = Array.from(
  new Set(CITY_QUIZ_DATA.map((item) => item.provinceShort)),
);

const ALL_GAUNTLET_SHAPE_PROVINCE_CODES = PROVINCES.map((item) => item.code);

const ALL_CITY_ROUTE_PROVINCE_CODES = PROVINCES.filter(
  (item) =>
    !["110000", "120000", "310000", "500000", "710000", "810000", "820000"]
      .includes(item.code),
).map((item) => item.code);

function parseGauntletProvinceScope(raw: string | null) {
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        const validCodes = parsed.filter(
          (item): item is string =>
            typeof item === "string" && ALL_PROVINCE_CODES.includes(item),
        );
        if (validCodes.length > 0) return new Set(validCodes);
      }
    } catch {
      // Invalid or outdated preferences safely fall back to the full country.
    }
  }
  return new Set(ALL_GAUNTLET_SHAPE_PROVINCE_CODES);
}

function readRecentQuestionHistory(storage: ProgressStorage, storageKey: string) {
  try {
    const saved = JSON.parse(storage.getItem(storageKey) ?? "[]") as unknown[];
    return saved
      .filter((item): item is string => typeof item === "string")
      .slice(-CITY_MAP_RECENT_QUESTION_LIMIT);
  } catch {
    return [];
  }
}

function writeRecentQuestionHistory(
  storage: ProgressStorage,
  storageKey: string,
  history: string[],
) {
  try {
    storage.setItem(storageKey, JSON.stringify(history));
  } catch {
    // 浏览器禁用本地存储时，当前页面内的去重队列仍然有效。
  }
}

function createConfusableCityQuestions() {
  return randomShuffle(
    CONFUSABLE_CITY_PAIRS.flatMap(
      (pair: ConfusableCityPair, pairIndex): ConfusableCityQuestion[] => [
        {
          id: `${pairIndex}-left-city`,
          pair: [pair.left.city, pair.right.city],
          prompt: pair.left.province,
          instruction: "这对易混城市中，哪座属于这个省份？",
          options: randomShuffle([pair.left.city, pair.right.city]),
          answer: pair.left.city,
          explanation: pair.memoryTip,
        },
        {
          id: `${pairIndex}-right-city`,
          pair: [pair.left.city, pair.right.city],
          prompt: pair.right.province,
          instruction: "这对易混城市中，哪座属于这个省份？",
          options: randomShuffle([pair.left.city, pair.right.city]),
          answer: pair.right.city,
          explanation: pair.memoryTip,
        },
        {
          id: `${pairIndex}-left-province`,
          pair: [pair.left.city, pair.right.city],
          prompt: pair.left.city,
          instruction: "这座城市属于哪个省级行政区？",
          options: randomShuffle([pair.left.provinceShort, pair.right.provinceShort]),
          answer: pair.left.provinceShort,
          explanation: pair.memoryTip,
        },
        {
          id: `${pairIndex}-right-province`,
          pair: [pair.left.city, pair.right.city],
          prompt: pair.right.city,
          instruction: "这座城市属于哪个省级行政区？",
          options: randomShuffle([pair.left.provinceShort, pair.right.provinceShort]),
          answer: pair.right.provinceShort,
          explanation: pair.memoryTip,
        },
      ],
    ),
  );
}

function buildCityAdjacencyMap(map: MapData): CityAdjacencyMap {
  const pointSets = map.features.map((feature) => {
    const points = new Set<string>();
    visitPositions(feature.geometry.coordinates, ([longitude, latitude]) => {
      points.add(`${longitude.toFixed(5)},${latitude.toFixed(5)}`);
    });
    return { name: feature.properties.name, points };
  });
  const adjacency = Object.fromEntries(
    pointSets.map(({ name }) => [name, [] as string[]]),
  ) as CityAdjacencyMap;
  for (let leftIndex = 0; leftIndex < pointSets.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < pointSets.length; rightIndex += 1) {
      const left = pointSets[leftIndex];
      const right = pointSets[rightIndex];
      const smaller = left.points.size <= right.points.size ? left : right;
      const larger = smaller === left ? right : left;
      let sharedPoints = 0;
      for (const point of smaller.points) {
        if (!larger.points.has(point)) continue;
        sharedPoints += 1;
        if (sharedPoints >= 3) break;
      }
      if (sharedPoints < 3) continue;
      adjacency[left.name].push(right.name);
      adjacency[right.name].push(left.name);
    }
  }
  return adjacency;
}

function createCityRouteChallenge(
  provinceCode: string,
  map: MapData,
  adjacency: CityAdjacencyMap,
  round: number,
): CityRouteChallenge | null {
  const sourceNames = map.features
    .map((feature) => feature.properties.name)
    .filter((name) => (adjacency[name]?.length ?? 0) > 0);
  const offset = sourceNames.length ? round % sourceNames.length : 0;
  const names = [
    ...sourceNames.slice(offset),
    ...sourceNames.slice(0, offset),
  ];
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const [startName, endName] = randomShuffle(names).slice(0, 2);
    if (!startName || !endName) continue;
    const shortestPath = findShortestPath(startName, endName, adjacency);
    if (shortestPath.length >= 3 && shortestPath.length <= 7) {
      return { provinceCode, startName, endName, shortestPath };
    }
  }
  for (const startName of names) {
    for (const endName of names) {
      const shortestPath = findShortestPath(startName, endName, adjacency);
      if (shortestPath.length >= 2) {
        return { provinceCode, startName, endName, shortestPath };
      }
    }
  }
  return null;
}

function normalizePlate(value: string) {
  return compactName(value).replace(/[·.-]/g, "").toUpperCase();
}

function cityGroups(pool: CityQuizItem[]) {
  return Array.from(
    pool.reduce((groups, item) => {
      const current = groups.get(item.provinceShort) ?? [];
      current.push(item);
      groups.set(item.provinceShort, current);
      return groups;
    }, new Map<string, CityQuizItem[]>()).entries(),
  );
}

function cityGroupsWithMinimum(pool: CityQuizItem[], minimum: number) {
  const selectedGroups = cityGroups(pool).filter(
    ([, items]) => items.length >= minimum,
  );
  return selectedGroups.length
    ? selectedGroups
    : cityGroups(CITY_QUIZ_DATA).filter(([, items]) => items.length >= minimum);
}

function createUndercoverQuestions(pool: CityQuizItem[]) {
  const groups = cityGroupsWithMinimum(pool, 3);
  return Array.from({ length: 80 }, (_, index): UndercoverQuestion => {
    const [province, items] = groups[index % groups.length];
    const homeCities = randomShuffle(items).slice(0, 3);
    const outsider = randomShuffle(CITY_QUIZ_DATA).find(
      (item) => item.provinceShort !== province,
    )!;
    return {
      province,
      options: randomShuffle([...homeCities, outsider]),
      answerCity: outsider.city,
      explanation: `${outsider.city}属于${outsider.province}，其余城市属于${homeCities[0].province}`,
    };
  });
}

function createDualIntruderQuestions(pool: CityQuizItem[]) {
  const groups = cityGroupsWithMinimum(pool, 3);
  const questions: DualIntruderQuestion[] = [];
  for (let index = 0; index < 80; index += 1) {
    const [province, items] = groups[index % groups.length];
    const provinceInfo = PROVINCE_BY_SHORT_NAME.get(province);
    if (index % 4 === 0) {
      const homeCities = randomShuffle(items).slice(0, 3);
      const outsider = randomShuffle(CITY_QUIZ_DATA).find(
        (item) => item.provinceShort !== province,
      )!;
      questions.push({
        prompt: province,
        instruction: "找出不属于这个省份的城市",
        options: randomShuffle([...homeCities.map((item) => item.city), outsider.city]),
        answer: outsider.city,
        explanation: `${outsider.city}属于${outsider.province}`,
      });
    } else if (index % 4 === 1) {
      const city = randomShuffle(items)[0];
      const otherProvinces = randomShuffle(
        ALL_GAUNTLET_PROVINCE_NAMES.filter((item) => item !== city.provinceShort),
      ).slice(0, 3);
      questions.push({
        prompt: city.city,
        instruction: "找出它真正所属的省份",
        options: randomShuffle([city.provinceShort, ...otherProvinces]),
        answer: city.provinceShort,
        explanation: `${city.city}属于${city.province}`,
      });
    } else if (index % 4 === 2 && provinceInfo) {
      const capital = PROVINCE_CAPITALS[provinceInfo.code];
      const otherCapitals = randomShuffle(
        PROVINCES.filter((item) => item.code !== provinceInfo.code),
      ).slice(0, 3).map((item) => PROVINCE_CAPITALS[item.code]);
      questions.push({
        prompt: provinceInfo.name,
        instruction: "找出它正确的行政中心",
        options: randomShuffle([capital, ...otherCapitals]),
        answer: capital,
        explanation: `${provinceInfo.name}的行政中心是${capital}`,
      });
    } else {
      const pairProvinces = provinceInfo
        ? [
            provinceInfo,
            ...randomShuffle(
              PROVINCES.filter((item) => item.code !== provinceInfo.code),
            ).slice(0, 3),
          ]
        : randomShuffle(PROVINCES).slice(0, 4);
      const wrongIndex = index % pairProvinces.length;
      const wrongCapital = PROVINCE_CAPITALS[
        PROVINCES.find(
          (item) =>
            item.code !== pairProvinces[wrongIndex].code &&
            !pairProvinces.some(
              (pairProvince) =>
                PROVINCE_CAPITALS[pairProvince.code] === PROVINCE_CAPITALS[item.code],
            ),
        )?.code ?? "110000"
      ];
      const options = pairProvinces.map((item, optionIndex) =>
        `${item.shortName} · ${optionIndex === wrongIndex ? wrongCapital : PROVINCE_CAPITALS[item.code]}`,
      );
      questions.push({
        prompt: "省级行政区 · 行政中心",
        instruction: "找出对应错误的一组",
        options: randomShuffle(options),
        answer: options[wrongIndex],
        explanation: `${pairProvinces[wrongIndex].name}的行政中心是${PROVINCE_CAPITALS[pairProvinces[wrongIndex].code]}`,
      });
    }
  }
  return questions;
}

function createPlateFaultQuestions(pool: CityQuizItem[]) {
  const source = pool.length >= 4 ? pool : PLATE_QUIZ_DATA;
  return Array.from({ length: 80 }, (_, index): PlateFaultQuestion => {
    const items = randomShuffle(source).slice(0, 4);
    const wrongIndex = index % items.length;
    const wrongPlate = randomShuffle(PLATE_QUIZ_DATA).find(
      (item) => !plateCollectionsOverlap(item.plates, items[wrongIndex].plates),
    )!.plate;
    const options = items.map((item, optionIndex) => ({
      id: `${index}-${optionIndex}`,
      label: `${item.city} · ${optionIndex === wrongIndex ? wrongPlate : item.plate}`,
    }));
    return {
      options: randomShuffle(options),
      answer: `${index}-${wrongIndex}`,
      explanation: `${items[wrongIndex].city}正确的车牌前缀是 ${items[wrongIndex].plate}`,
    };
  });
}

function createRouteChallenge(): RouteChallenge {
  const connected = PROVINCES.filter(
    (item) => (PROVINCE_NEIGHBORS[item.code]?.length ?? 0) > 0,
  );
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const [start, end] = randomShuffle(connected).slice(0, 2);
    const shortestPath = findShortestPath(start.code, end.code, PROVINCE_NEIGHBORS);
    if (shortestPath.length >= 3 && shortestPath.length <= 7) {
      return { startCode: start.code, endCode: end.code, shortestPath };
    }
  }
  return {
    startCode: "110000",
    endCode: "310000",
    shortestPath: findShortestPath("110000", "310000", PROVINCE_NEIGHBORS),
  };
}

function createBossQuestions() {
  const cities = randomShuffle(CITY_QUIZ_DATA).slice(0, 30);
  const provinces = randomShuffle(PROVINCES);
  const questions = Array.from({ length: 30 }, (_, index): BossQuestion => {
    const city = cities[index];
    const province = provinces[index % provinces.length];
    const provinceCode = PROVINCE_BY_SHORT_NAME.get(city.provinceShort)?.code
      ?? "110000";
    if (index % 6 === 0) {
      return {
        skill: "城市归属",
        kind: "text",
        badge: "城",
        prompt: "写出这座城市所属的省份",
        value: city.city,
        targets: [city.province, city.provinceShort],
        explanation: `${city.city}属于${city.province}`,
      };
    }
    if (index % 6 === 1) {
      return {
        skill: "车牌识别",
        kind: "text",
        badge: "牌",
        prompt: "写出这座城市的车牌前缀",
        value: city.city,
        targets: city.plates,
        explanation: `${city.city}的车牌前缀是 ${city.plate}`,
        matchAllTargets: true,
      };
    }
    if (index % 6 === 2) {
      return {
        skill: "行政中心",
        kind: "text",
        badge: "都",
        prompt: "写出这个行政中心对应的省级行政区",
        value: PROVINCE_CAPITALS[province.code],
        targets: [province.name, province.shortName],
        explanation: `${PROVINCE_CAPITALS[province.code]}对应${province.name}`,
      };
    }
    if (index % 6 === 3) {
      const isTrue = index % 4 === 3;
      const alternative = randomShuffle(CITY_QUIZ_DATA).find(
        (item) => item.provinceShort !== city.provinceShort,
      )!;
      return {
        skill: "真假判断",
        kind: "truth",
        badge: "判",
        prompt: "判断城市与省份的对应关系",
        value: `${city.city}属于${isTrue ? city.province : alternative.province}`,
        isTrue,
        explanation: `${city.city}属于${city.province}`,
      };
    }
    if (index % 6 === 4) {
      return {
        skill: "地图落点",
        kind: "map",
        badge: "点",
        prompt: "在地图上点击这座城市所属的省份",
        value: city.city,
        provinceCode,
        explanation: `${city.city}属于${city.province}`,
      };
    }
    return {
      skill: "轮廓辨认",
      kind: "shape",
      badge: "形",
      prompt: "写出这个旋转轮廓的省份名称",
      provinceCode: province.code,
      targets: [province.name, province.shortName],
      explanation: `这个轮廓是${province.name}`,
    };
  });
  return randomShuffle(questions);
}

function ProvinceShape({
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
        <path
          d={geometryToPath(feature.geometry, project)}
          fillRule="evenodd"
        />
      </g>
    </svg>
  );
}

function ProvinceSilhouette({
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

function PuzzlePiece({ feature }: { feature: MapFeature }) {
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

function GauntletDetailMap({
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

function GauntletProvinceMapWall({
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
          const projectionFeatures = province.code === "460000"
            ? features.filter((feature) => feature.properties.name !== "三沙市")
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
          <svg
            viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
            role="img"
            aria-label="无名称省内行政区地图"
          >
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

type TruthQuestion = {
  statement: string;
  isTrue: boolean;
  explanation: string;
};

function createTruthQuestions(pool: CityQuizItem[]) {
  if (!pool.length) return [];
  const fallbackPool = PLATE_QUIZ_DATA;
  return Array.from({ length: Math.max(80, pool.length) }, (_, index) => {
    const item = pool[index % pool.length];
    const provinceQuestion = index % 2 === 0;
    const isTrue = index % 3 !== 1;
    if (provinceQuestion) {
      const alternative = randomShuffle(fallbackPool).find(
        (candidate) => candidate.provinceShort !== item.provinceShort,
      );
      const shownProvince = isTrue
        ? item.province
        : alternative?.province ?? "北京市";
      return {
        statement: `${item.city}属于${shownProvince}`,
        isTrue,
        explanation: `${item.city}属于${item.province}`,
      };
    }

    const alternative = randomShuffle(fallbackPool).find(
      (candidate) => !plateCollectionsOverlap(candidate.plates, item.plates),
    );
    const shownPlate = isTrue ? item.plate : alternative?.plate ?? "京A";
    return {
      statement: `${item.city}的车牌前缀是 ${shownPlate}`,
      isTrue,
      explanation: `${item.city}的车牌前缀是 ${item.plate}`,
    };
  });
}

function AnswerReviewPanel({
  review,
  onContinue,
}: {
  review: AnswerReview;
  onContinue: () => void;
}) {
  return (
    <div
      className={`answer-review ${review.correct ? "is-correct" : "is-wrong"}`}
      role="status"
      aria-live="polite"
    >
      <span className="answer-review-state">
        {review.correct ? "✓ 回答正确" : "！需要复习"}
      </span>
      <p>正确答案</p>
      <strong>{review.correctAnswer}</strong>
      <div className="answer-explanation">
        <small>知识解释</small>
        <p>{review.explanation}</p>
      </div>
      {review.checkpoint ? (
        <p className="boss-checkpoint">{review.checkpoint}</p>
      ) : null}
      <button type="button" onClick={onContinue}>
        {review.nextAction === "finish"
          ? "查看通关结果"
          : review.nextAction === "lose"
            ? "查看本轮结果"
            : "继续下一题"}
      </button>
    </div>
  );
}

function BossSkillSummary({
  stats,
}: {
  stats: Record<BossSkill, BossSkillStat>;
}) {
  return (
    <div className="boss-skill-summary" aria-label="终极混战能力统计">
      {BOSS_SKILLS.map((skill) => {
        const stat = stats[skill];
        const accuracy = stat.total
          ? Math.round((stat.correct / stat.total) * 100)
          : 0;
        return (
          <div key={skill}>
            <span>{skill}</span>
            <strong>{accuracy}%</strong>
            <small>{stat.correct} / {stat.total}</small>
          </div>
        );
      })}
    </div>
  );
}

function GauntletNationalMap({
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

function GauntletGame({
  nationalMap,
  nationalError,
  onExit,
}: {
  nationalMap: MapData | null;
  nationalError: boolean;
  onExit: () => void;
}) {
  const { identity, progressStorage } = usePlayerData();
  const [level, setLevel] = useState<GauntletLevel | null>(null);
  const [passedLevel, setPassedLevel] = useState<GauntletLevel | null>(null);
  const [completedLevels, setCompletedLevels] = useState<Set<string>>(
    new Set(),
  );
  const [provinceOrder, setProvinceOrder] = useState<MapFeature[]>([]);
  const [provinceChallengeOrder, setProvinceChallengeOrder] = useState<Province[]>([]);
  const [cityOrder, setCityOrder] = useState<CityQuizItem[]>([]);
  const [mapRegionOrder, setMapRegionOrder] = useState<MapRegionQuizItem[]>([]);
  const [universityOrder, setUniversityOrder] = useState<UniversityQuizItem[]>([]);
  const [mistakes, setMistakes] = useState<MistakeQuestion[]>([]);
  const [mistakeOrder, setMistakeOrder] = useState<MistakeQuestion[]>([]);
  const [mistakeSessionTotal, setMistakeSessionTotal] = useState(0);
  const [confusableOrder, setConfusableOrder] = useState<ConfusableCityQuestion[]>([]);
  const [cityRouteProvinceOrder, setCityRouteProvinceOrder] = useState<string[]>([]);
  const [provinceCityCountOrder, setProvinceCityCountOrder] = useState<ProvinceCityCountItem[]>([]);
  const [cityRouteAttempt, setCityRouteAttempt] = useState<{
    key: string;
    names: string[];
  } | null>(null);
  const [truthOrder, setTruthOrder] = useState<TruthQuestion[]>([]);
  const [undercoverOrder, setUndercoverOrder] = useState<UndercoverQuestion[]>([]);
  const [dualIntruderOrder, setDualIntruderOrder] = useState<DualIntruderQuestion[]>([]);
  const [plateFaultOrder, setPlateFaultOrder] = useState<PlateFaultQuestion[]>([]);
  const [groupOrder, setGroupOrder] = useState<ProvinceGroupQuestion[]>([]);
  const [routeChallenge, setRouteChallenge] = useState<RouteChallenge | null>(null);
  const [bossOrder, setBossOrder] = useState<BossQuestion[]>([]);
  const [bossLives, setBossLives] = useState(3);
  const [bossStats, setBossStats] = useState<Record<BossSkill, BossSkillStat>>(
    createEmptyBossStats,
  );
  const [answerReview, setAnswerReview] = useState<AnswerReview | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [provinceAnswer, setProvinceAnswer] = useState("");
  const [plateAnswer, setPlateAnswer] = useState("");
  const [mapSelections, setMapSelections] = useState<Set<string>>(new Set());
  const [plateCityMapFocusedProvinceCode, setPlateCityMapFocusedProvinceCode] = useState<
    string | null
  >(null);
  const [routeCodes, setRouteCodes] = useState<string[]>([]);
  const [timeLimit, setTimeLimit] = useState<0 | 60 | 90>(0);
  const [timeLeft, setTimeLeft] = useState(GAUNTLET_TIME_LIMIT);
  const [feedback, setFeedback] = useState("准备好后提交答案");
  const [feedbackType, setFeedbackType] = useState<"idle" | "right" | "wrong">(
    "idle",
  );
  const [selectedShapeProvinceCodes, setSelectedShapeProvinceCodes] = useState<
    Set<string>
  >(() => new Set(ALL_GAUNTLET_SHAPE_PROVINCE_CODES));
  const [draftShapeProvinceCodes, setDraftShapeProvinceCodes] = useState<
    Set<string>
  >(() => new Set(ALL_GAUNTLET_SHAPE_PROVINCE_CODES));
  const [provinceScopeReady, setProvinceScopeReady] = useState(false);
  const [provinceScopeMessage, setProvinceScopeMessage] = useState("");
  const [provincePickerOpen, setProvincePickerOpen] = useState(false);
  const provinceInputRef = useRef<HTMLInputElement>(null);
  const regionMapHistoryRef = useRef<string[]>([]);
  const plateCityMapHistoryRef = useRef<string[]>([]);
  const timedMode = timeLimit > 0;
  const selectedProvinceShortNames = useMemo(
    () => new Set(
      PROVINCES.filter((item) => selectedShapeProvinceCodes.has(item.code))
        .map((item) => item.shortName),
    ),
    [selectedShapeProvinceCodes],
  );
  const selectedQuizProvinces = useMemo(
    () => new Set(
      ALL_GAUNTLET_PROVINCE_NAMES.filter((name) =>
        selectedProvinceShortNames.has(name),
      ),
    ),
    [selectedProvinceShortNames],
  );
  const selectedUniversityProvinces = useMemo(
    () => new Set(
      UNIVERSITY_QUIZ_DATA
        .filter((item) => selectedProvinceShortNames.has(item.provinceShort))
        .map((item) => item.provinceShort),
    ),
    [selectedProvinceShortNames],
  );
  const selectedCityRouteProvinceCodes = useMemo(
    () => new Set(
      ALL_CITY_ROUTE_PROVINCE_CODES.filter((code) =>
        selectedShapeProvinceCodes.has(code),
      ),
    ),
    [selectedShapeProvinceCodes],
  );
  const provincePickerOptions = useMemo(
    () => PROVINCES.map((item) => ({
      key: item.code,
      shortName: item.shortName,
      kind: item.kind,
      cityCount: CITY_QUIZ_DATA.filter(
        (city) => city.provinceShort === item.shortName,
      ).length,
      plateCount: PLATE_QUIZ_DATA.filter(
        (region) => region.provinceShort === item.shortName,
      ).length,
      mapRegionCount: MAP_REGION_QUIZ_DATA.filter(
        (region) => region.provinceCode === item.code,
      ).length,
    })),
    [],
  );
  const selectedProvinceNames = useMemo(
    () => PROVINCES.filter((item) => selectedShapeProvinceCodes.has(item.code))
      .map((item) => item.shortName),
    [selectedShapeProvinceCodes],
  );
  const provinceScopeSummary = selectedShapeProvinceCodes.size === PROVINCES.length
    ? "全国 34 个省级行政区"
    : selectedProvinceNames.length <= 6
      ? selectedProvinceNames.join("、")
      : `${selectedProvinceNames.slice(0, 5).join("、")}等 ${selectedProvinceNames.length} 个`;

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const saved = JSON.parse(
          progressStorage.getItem(GAUNTLET_PROGRESS_KEY) ?? "[]",
        ) as unknown;
        const completedLevelIds = Array.isArray(saved)
          ? Array.from(new Set(saved.filter(isStoredGauntletLevelId)))
          : [];
        setCompletedLevels(new Set(completedLevelIds));
        if (JSON.stringify(saved) !== JSON.stringify(completedLevelIds)) {
          progressStorage.setItem(
            GAUNTLET_PROGRESS_KEY,
            JSON.stringify(completedLevelIds),
          );
        }
      } catch {
        setCompletedLevels(new Set());
      }
      try {
        const savedMistakes = JSON.parse(
          progressStorage.getItem(GAUNTLET_MISTAKES_KEY) ?? "[]",
        ) as unknown[];
        setMistakes(normalizeMistakeList(savedMistakes));
      } catch {
        setMistakes([]);
      }
      const savedProvinceScope = parseGauntletProvinceScope(
        progressStorage.getItem(GAUNTLET_PROVINCE_SCOPE_KEY),
      );
      setSelectedShapeProvinceCodes(savedProvinceScope);
      setDraftShapeProvinceCodes(new Set(savedProvinceScope));
      setProvinceScopeReady(true);
      regionMapHistoryRef.current = readRecentQuestionHistory(
        progressStorage,
        GAUNTLET_REGION_MAP_HISTORY_KEY,
      );
      plateCityMapHistoryRef.current = readRecentQuestionHistory(
        progressStorage,
        GAUNTLET_PLATE_CITY_MAP_HISTORY_KEY,
      );
    });

    return () => {
      cancelled = true;
    };
  }, [progressStorage]);

  useEffect(() => {
    if (
      !timedMode ||
      !level ||
      passedLevel ||
      timeLeft === 0 ||
      provincePickerOpen ||
      answerReview
    ) {
      return;
    }
    const timer = window.setInterval(() => {
      setTimeLeft((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [answerReview, level, passedLevel, provincePickerOpen, timeLeft, timedMode]);

  const currentProvinceFeature = provinceOrder.length
    ? provinceOrder[
        level === LEVEL.ROTATED_SHAPE
          ? questionIndex % provinceOrder.length
          : questionIndex
      ] ?? null
    : null;
  const currentProvince = currentProvinceFeature
    ? provinceForFeature(currentProvinceFeature)
    : null;
  const currentCity = cityOrder.length
    ? cityOrder[questionIndex % cityOrder.length]
    : null;
  const currentMapRegion = mapRegionOrder.length
    ? mapRegionOrder[questionIndex] ?? null
    : null;
  const cityPoolSize = useMemo(
    () => new Set(cityOrder.map(cityQuizKey)).size,
    [cityOrder],
  );
  const mapRegionPoolSize = useMemo(
    () => new Set(mapRegionOrder.map(cityQuizKey)).size,
    [mapRegionOrder],
  );
  const currentUniversity = universityOrder.length
    ? universityOrder[questionIndex % universityOrder.length]
    : null;
  const currentMistake = mistakeOrder[0] ?? null;
  const currentConfusableQuestion = confusableOrder.length
    ? confusableOrder[questionIndex % confusableOrder.length]
    : null;
  const currentCityRouteProvinceCode = cityRouteProvinceOrder.length
    ? cityRouteProvinceOrder[questionIndex % cityRouteProvinceOrder.length]
    : null;
  const currentProvinceCityCount = provinceCityCountOrder.length
    ? provinceCityCountOrder[questionIndex % provinceCityCountOrder.length]
    : null;
  const currentChallengeProvince = provinceChallengeOrder.length
    ? provinceChallengeOrder[questionIndex % provinceChallengeOrder.length]
    : null;
  const currentTruthQuestion = truthOrder.length
    ? truthOrder[questionIndex % truthOrder.length]
    : null;
  const currentUndercoverQuestion = undercoverOrder.length
    ? undercoverOrder[questionIndex % undercoverOrder.length]
    : null;
  const currentDualIntruderQuestion = dualIntruderOrder.length
    ? dualIntruderOrder[questionIndex % dualIntruderOrder.length]
    : null;
  const currentPlateFaultQuestion = plateFaultOrder.length
    ? plateFaultOrder[questionIndex % plateFaultOrder.length]
    : null;
  const currentGroupQuestion = groupOrder.length
    ? groupOrder[questionIndex % groupOrder.length]
    : null;
  const currentBossQuestion = bossOrder[questionIndex] ?? null;
  const currentPuzzleFeature = provinceOrder.find((feature) => {
    const item = provinceForFeature(feature);
    return Boolean(item && !mapSelections.has(item.code));
  }) ?? null;
  const bossShapeFeature =
    currentBossQuestion?.kind === "shape" && nationalMap
      ? nationalMap.features.find(
          (feature) => provinceForFeature(feature)?.code === currentBossQuestion.provinceCode,
        ) ?? null
      : null;
  const selectedCityMapProvinces = useMemo(
    () =>
      PROVINCES.filter((province) =>
        selectedQuizProvinces.has(province.shortName),
      ),
    [selectedQuizProvinces],
  );
  const plateCityMapFocusedProvince = plateCityMapFocusedProvinceCode
    ? selectedCityMapProvinces.find(
        (province) => province.code === plateCityMapFocusedProvinceCode,
      ) ?? null
    : null;
  const detailProvinceCode =
    level === LEVEL.REGION_MAP && currentMapRegion
      ? currentMapRegion.provinceCode
      : level === LEVEL.CITY_SHORTEST_ROUTE
        ? currentCityRouteProvinceCode
      : null;
  const detailProvinceCodes = level === LEVEL.PLATE_CITY_MAP
    ? selectedCityMapProvinces.map((province) => province.code)
    : detailProvinceCode
      ? [detailProvinceCode]
      : [];
  const { data: gauntletDetailMap, error: gauntletDetailError } = useMapCollection(
    detailProvinceCodes,
  );
  const detailProvinceCodeSet = new Set(detailProvinceCodes);
  const gauntletDetailReady = Boolean(
    detailProvinceCodes.length &&
    gauntletDetailMap?.features.length &&
    gauntletDetailMap.features.every(
      (feature) => detailProvinceCodeSet.has(feature.properties.provinceCode ?? ""),
    ) &&
    detailProvinceCodes.every((code) =>
      gauntletDetailMap?.features.some(
        (feature) => feature.properties.provinceCode === code,
      ),
    ),
  );
  const cityAdjacency = useMemo(
    () => level === LEVEL.CITY_SHORTEST_ROUTE && gauntletDetailMap && gauntletDetailReady
      ? buildCityAdjacencyMap(gauntletDetailMap)
      : {},
    [gauntletDetailMap, gauntletDetailReady, level],
  );
  const cityRouteChallenge = useMemo(
    () =>
      level === LEVEL.CITY_SHORTEST_ROUTE &&
      currentCityRouteProvinceCode &&
      gauntletDetailMap &&
      gauntletDetailReady
        ? createCityRouteChallenge(
            currentCityRouteProvinceCode,
            gauntletDetailMap,
            cityAdjacency,
            questionIndex,
          )
        : null,
    [
      cityAdjacency,
      currentCityRouteProvinceCode,
      gauntletDetailMap,
      gauntletDetailReady,
      level,
      questionIndex,
    ],
  );
  const cityRouteKey = cityRouteChallenge
    ? `${questionIndex}-${cityRouteChallenge.provinceCode}-${cityRouteChallenge.startName}-${cityRouteChallenge.endName}`
    : "";
  const cityRouteNames = cityRouteChallenge
    ? cityRouteAttempt?.key === cityRouteKey
      ? cityRouteAttempt.names
      : [cityRouteChallenge.startName]
    : [];
  const setCityRouteNames = (names: string[]) => {
    setCityRouteAttempt(cityRouteChallenge ? { key: cityRouteKey, names } : null);
  };
  const selectedQuizItems = useMemo(
    () => CITY_QUIZ_DATA.filter((item) =>
      selectedProvinceShortNames.has(item.provinceShort),
    ),
    [selectedProvinceShortNames],
  );
  const selectedPlateQuizItems = useMemo(
    () => PLATE_QUIZ_DATA.filter((item) =>
      selectedProvinceShortNames.has(item.provinceShort),
    ),
    [selectedProvinceShortNames],
  );
  const selectedMapRegionItems = useMemo(
    () => MAP_REGION_QUIZ_DATA.filter((item) =>
      selectedShapeProvinceCodes.has(item.provinceCode),
    ),
    [selectedShapeProvinceCodes],
  );
  const selectedPlateCityMapItems = useMemo(
    () => selectedPlateQuizItems.filter((item) => item.mapRegion),
    [selectedPlateQuizItems],
  );
  const selectedUniversityItems = useMemo(
    () => UNIVERSITY_QUIZ_DATA.filter((item) =>
      selectedProvinceShortNames.has(item.provinceShort),
    ),
    [selectedProvinceShortNames],
  );
  const regionMapTarget = Math.min(30, selectedMapRegionItems.length);
  const target = level === LEVEL.PROVINCE_SHAPE || level === LEVEL.PROVINCE_PUZZLE
    ? provinceOrder.length
    : level === LEVEL.MISTAKE_REVENGE
      ? mistakeSessionTotal
    : level === LEVEL.REGION_MAP
      ? regionMapTarget
    : level === LEVEL.CITY_PROVINCE || level === LEVEL.CITY_MAP || level === LEVEL.TRUTH_FLASH || level === LEVEL.PLATE_CITY_MAP
      ? 30
      : level === LEVEL.TERRITORY_GROUPS
        ? PROVINCE_GROUP_QUESTIONS.length
        : level === LEVEL.GEOGRAPHY_ELIMINATION
          ? 16
          : level === LEVEL.PROVINCE_NEIGHBORS || level === LEVEL.NEIGHBOR_CHAIN || level === LEVEL.PROVINCE_SHORTEST_ROUTE || level === LEVEL.CITY_SHORTEST_ROUTE
        ? 10
        : level === LEVEL.FINAL_BOSS
          ? 30
        : 20;
  const progress = level === LEVEL.PROVINCE_SHAPE
    ? questionIndex
    : level === LEVEL.PROVINCE_PUZZLE
      ? mapSelections.size
    : level === LEVEL.NEIGHBOR_CHAIN
      ? routeCodes.length
      : level === LEVEL.MISTAKE_REVENGE
        ? Math.max(0, mistakeSessionTotal - mistakeOrder.length)
      : level === LEVEL.FINAL_BOSS
        ? questionIndex + (answerReview ? 1 : 0)
      : streak;
  const provinceScopeIssue = (challengeLevel: GauntletLevel) => {
    if (!provinceScopeReady) return "正在读取已保存的省份范围";
    if (FIXED_SCOPE_LEVELS.has(challengeLevel)) return null;
    if (selectedShapeProvinceCodes.size === 0) return "请先选择至少一个省份";
    if (
      challengeLevel === LEVEL.PROVINCE_NEIGHBORS &&
      !Array.from(selectedShapeProvinceCodes).some(
        (code) => (PROVINCE_NEIGHBORS[code]?.length ?? 0) > 0,
      )
    ) {
      return "当前范围没有可用于陆地邻省题的省份";
    }
    if (challengeLevel === LEVEL.UNIVERSITY_CITY && selectedUniversityItems.length === 0) {
      return "当前范围没有 985、211 大学题目";
    }
    if (challengeLevel === LEVEL.CITY_SHORTEST_ROUTE && selectedCityRouteProvinceCodes.size === 0) {
      return "省内穿越暂不支持当前范围";
    }
    if (
      (challengeLevel === LEVEL.CITY_UNDERCOVER || challengeLevel === LEVEL.GEOGRAPHY_ELIMINATION) &&
      !cityGroups(selectedQuizItems).some(([, items]) => items.length >= 3)
    ) {
      return "当前范围缺少至少 3 座城市的省份";
    }
    if (challengeLevel === LEVEL.PLATE_FAULT && selectedPlateQuizItems.length < 4) {
      return "车牌找茬至少需要 4 个候选城市或地区";
    }
    if (
      (challengeLevel === LEVEL.PLATE_PLACE || challengeLevel === LEVEL.PLATE_CITY_MAP) &&
      uniqueReversePlateItems(
        challengeLevel === LEVEL.PLATE_CITY_MAP ? selectedPlateCityMapItems : selectedPlateQuizItems,
      ).length === 0
    ) {
      return "当前范围没有可唯一定位城市或地区的车牌题目";
    }
    if (
      ([LEVEL.CITY_PROVINCE, LEVEL.CITY_MAP] as GauntletLevel[]).includes(challengeLevel) &&
      selectedQuizItems.length === 0
    ) {
      return "当前范围没有可用的城市题目";
    }
    if (
      PLATE_QUESTION_LEVELS.has(challengeLevel) &&
      selectedPlateQuizItems.length === 0
    ) {
      return "当前范围没有可用的车牌题目";
    }
    if (challengeLevel === LEVEL.REGION_MAP && selectedMapRegionItems.length === 0) {
      return "当前范围没有可用的地图区块题目";
    }
    if (challengeLevel === LEVEL.PLATE_CITY_MAP && selectedPlateCityMapItems.length === 0) {
      return "当前范围没有可用于地图定位的车牌题目";
    }
    return null;
  };
  const draftSelectionValid = draftShapeProvinceCodes.size > 0;
  const hasTimedOut = timedMode && Boolean(level) && !passedLevel && timeLeft === 0;
  const hasLostBoss = level === LEVEL.FINAL_BOSS && bossLives === 0 && !passedLevel;
  const reviewProvinceCodes = new Set(answerReview?.highlightProvinceCodes ?? []);

  const usesCompactViewport = () =>
    window.matchMedia("(max-width: 760px), (pointer: coarse)").matches;

  const focusProvinceInput = () => {
    window.requestAnimationFrame(() => {
      if (usesCompactViewport()) return;
      provinceInputRef.current?.focus({ preventScroll: true });
    });
  };

  const showRoundFromTop = () => {
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) activeElement.blur();

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      if (!usesCompactViewport()) {
        provinceInputRef.current?.focus({ preventScroll: true });
      }
    });
  };

  const resetRoundProgress = (message: string) => {
    setAnswerReview(null);
    setTimeLeft(timeLimit || GAUNTLET_TIME_LIMIT);
    setQuestionIndex(0);
    setStreak(0);
    setProvinceAnswer("");
    setPlateAnswer("");
    setMapSelections(new Set());
    setPlateCityMapFocusedProvinceCode(null);
    setRouteCodes([]);
    setCityRouteAttempt(null);
    setFeedbackType("idle");
    setFeedback(message);
  };

  const setCityChallengeQuestions = (
    challengeLevel: GauntletLevel,
    questions: CityQuizItem[],
  ) => {
    const eligibleQuestions = challengeLevel === LEVEL.PLATE_PLACE || challengeLevel === LEVEL.PLATE_CITY_MAP
      ? uniqueReversePlateItems(questions)
      : questions;
    const shuffledQuestions = challengeLevel === LEVEL.PLATE_CITY_MAP
      ? createCityMapQuestionQueue(
          eligibleQuestions,
          plateCityMapHistoryRef.current,
          randomShuffle,
        )
      : randomShuffle(eligibleQuestions);
    setCityOrder(shuffledQuestions);
    setTruthOrder(
      challengeLevel === LEVEL.TRUTH_FLASH ? createTruthQuestions(shuffledQuestions) : [],
    );
    setUndercoverOrder(
      challengeLevel === LEVEL.CITY_UNDERCOVER ? createUndercoverQuestions(shuffledQuestions) : [],
    );
    setDualIntruderOrder(
      challengeLevel === LEVEL.GEOGRAPHY_ELIMINATION ? createDualIntruderQuestions(shuffledQuestions) : [],
    );
    setPlateFaultOrder(
      challengeLevel === LEVEL.PLATE_FAULT ? createPlateFaultQuestions(shuffledQuestions) : [],
    );
  };

  const startLevel = (nextLevel: GauntletLevel) => {
    const scopeIssue = provinceScopeIssue(nextLevel);
    if (scopeIssue) {
      setLevel(null);
      setPassedLevel(null);
      setProvinceScopeMessage(scopeIssue);
      return;
    }
    if (
      MAP_REQUIRED_LEVELS.has(nextLevel) &&
      (!nationalMap || nationalError)
    ) {
      return;
    }
    setProvinceScopeMessage("");
    setLevel(nextLevel);
    setPassedLevel(null);
    resetRoundProgress(GAUNTLET_OPENING_FEEDBACK[nextLevel]);
    setMapRegionOrder([]);
    setUndercoverOrder([]);
    setDualIntruderOrder([]);
    setPlateFaultOrder([]);
    setGroupOrder([]);
    setRouteChallenge(null);
    setBossOrder([]);
    setUniversityOrder([]);
    setMistakeOrder([]);
    setMistakeSessionTotal(0);
    setConfusableOrder([]);
    setCityRouteProvinceOrder([]);
    setCityRouteAttempt(null);
    setProvinceCityCountOrder([]);
    setBossLives(3);
    setBossStats(createEmptyBossStats());

    if (
      (
        nextLevel === LEVEL.PROVINCE_SHAPE ||
        nextLevel === LEVEL.PROVINCE_PUZZLE ||
        nextLevel === LEVEL.ROTATED_SHAPE
      ) &&
      nationalMap
    ) {
      setProvinceOrder(
        randomShuffle(
          nationalMap.features.filter((feature) => {
            const featureProvince = provinceForFeature(feature);
            return Boolean(
              featureProvince && selectedShapeProvinceCodes.has(featureProvince.code),
            );
          }),
        ),
      );
      setCityOrder([]);
      setProvinceChallengeOrder([]);
      setTruthOrder([]);
    } else if (nextLevel === LEVEL.PROVINCE_NEIGHBORS) {
      const nextOrigins = PROVINCES.filter(
        (item) =>
          selectedShapeProvinceCodes.has(item.code) &&
          (PROVINCE_NEIGHBORS[item.code]?.length ?? 0) > 0,
      );
      setProvinceChallengeOrder(
        randomShuffle(nextOrigins),
      );
      setProvinceOrder([]);
      setCityOrder([]);
      setTruthOrder([]);
    } else if (nextLevel === LEVEL.NEIGHBOR_CHAIN) {
      const possibleStarts = PROVINCES.filter(
        (item) => (PROVINCE_NEIGHBORS[item.code]?.length ?? 0) > 0,
      );
      const start = randomShuffle(possibleStarts)[0];
      setRouteCodes(start ? [start.code] : []);
      setProvinceOrder([]);
      setProvinceChallengeOrder([]);
      setCityOrder([]);
      setTruthOrder([]);
    } else if (nextLevel === LEVEL.REGION_MAP) {
      setMapRegionOrder(
        createCityMapQuestionQueue(
          selectedMapRegionItems,
          regionMapHistoryRef.current,
          randomShuffle,
        ),
      );
      setProvinceOrder([]);
      setProvinceChallengeOrder([]);
      setCityOrder([]);
      setTruthOrder([]);
    } else if (nextLevel === LEVEL.TERRITORY_GROUPS) {
      setGroupOrder(randomShuffle(PROVINCE_GROUP_QUESTIONS));
      setProvinceOrder([]);
      setProvinceChallengeOrder([]);
      setCityOrder([]);
      setTruthOrder([]);
    } else if (nextLevel === LEVEL.PROVINCE_SHORTEST_ROUTE) {
      const challenge = createRouteChallenge();
      setRouteChallenge(challenge);
      setRouteCodes([challenge.startCode]);
      setProvinceOrder([]);
      setProvinceChallengeOrder([]);
      setCityOrder([]);
      setTruthOrder([]);
    } else if (nextLevel === LEVEL.UNIVERSITY_CITY) {
      setUniversityOrder(
        randomShuffle(selectedUniversityItems),
      );
      setProvinceOrder([]);
      setProvinceChallengeOrder([]);
      setCityOrder([]);
      setTruthOrder([]);
    } else if (nextLevel === LEVEL.MISTAKE_REVENGE) {
      const nextMistakes = randomShuffle(mistakes);
      setMistakeOrder(nextMistakes);
      setMistakeSessionTotal(nextMistakes.length);
      setProvinceOrder([]);
      setProvinceChallengeOrder([]);
      setCityOrder([]);
      setTruthOrder([]);
    } else if (nextLevel === LEVEL.CONFUSABLE_CITIES) {
      setConfusableOrder(createConfusableCityQuestions());
      setProvinceOrder([]);
      setProvinceChallengeOrder([]);
      setCityOrder([]);
      setTruthOrder([]);
    } else if (nextLevel === LEVEL.CITY_SHORTEST_ROUTE) {
      setCityRouteProvinceOrder(
        randomShuffle(Array.from(selectedCityRouteProvinceCodes)),
      );
      setProvinceOrder([]);
      setProvinceChallengeOrder([]);
      setCityOrder([]);
      setTruthOrder([]);
    } else if (nextLevel === LEVEL.PROVINCE_CITY_COUNT) {
      setProvinceCityCountOrder(randomShuffle(
        PROVINCE_CITY_COUNT_DATA.filter((item) =>
          selectedShapeProvinceCodes.has(item.code),
        ),
      ));
      setProvinceOrder([]);
      setProvinceChallengeOrder([]);
      setCityOrder([]);
      setTruthOrder([]);
    } else if (nextLevel === LEVEL.FINAL_BOSS) {
      setBossOrder(createBossQuestions());
      setProvinceOrder([]);
      setProvinceChallengeOrder([]);
      setCityOrder([]);
      setTruthOrder([]);
    } else {
      const usesPlateQuestions = PLATE_QUESTION_LEVELS.has(nextLevel);
      setCityChallengeQuestions(
        nextLevel,
        nextLevel === LEVEL.PLATE_CITY_MAP
          ? selectedPlateCityMapItems
          : usesPlateQuestions
            ? selectedPlateQuizItems
            : selectedQuizItems,
      );
      setProvinceOrder([]);
      setProvinceChallengeOrder([]);
    }
    setProvincePickerOpen(false);
    showRoundFromTop();
  };

  const openProvincePicker = () => {
    setDraftShapeProvinceCodes(new Set(selectedShapeProvinceCodes));
    setProvincePickerOpen(true);
  };

  const toggleDraftProvince = (key: string) => {
    const next = new Set(draftShapeProvinceCodes);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setDraftShapeProvinceCodes(next);
  };

  const applyProvinceSelection = () => {
    if (!draftSelectionValid) return;
    const orderedCodes = PROVINCES
      .filter((item) => draftShapeProvinceCodes.has(item.code))
      .map((item) => item.code);
    const nextSelection = new Set(orderedCodes);
    setSelectedShapeProvinceCodes(nextSelection);
    setDraftShapeProvinceCodes(new Set(nextSelection));
    progressStorage.setItem(
      GAUNTLET_PROVINCE_SCOPE_KEY,
      JSON.stringify(orderedCodes),
    );
    setProvinceScopeMessage(
      identity
        ? `已保存 ${orderedCodes.length} 个省级行政区，后续关卡将自动沿用并同步云存档`
        : `本次试玩已选择 ${orderedCodes.length} 个省级行政区；登录后可长期保存`,
    );
    setProvincePickerOpen(false);
  };

  const selectAllPickerProvinces = () => {
    setDraftShapeProvinceCodes(
      new Set(provincePickerOptions.map((item) => item.key)),
    );
  };

  const clearPickerProvinces = () => {
    setDraftShapeProvinceCodes(new Set());
  };

  const finishLevel = (finishedLevel: GauntletLevel) => {
    const nextCompleted = new Set(completedLevels);
    nextCompleted.add(finishedLevel);
    setCompletedLevels(nextCompleted);
    progressStorage.setItem(
      GAUNTLET_PROGRESS_KEY,
      JSON.stringify(Array.from(nextCompleted)),
    );
    setPassedLevel(finishedLevel);
    setFeedbackType("right");
  };

  const recordMistake = (seed: MistakeSeed) => {
    setMistakes((current) => {
      const next = upsertMistake(current, seed);
      progressStorage.setItem(GAUNTLET_MISTAKES_KEY, JSON.stringify(next));
      return next;
    });
  };

  const masterMistake = (id: string) => {
    setMistakes((current) => {
      const next = current.filter((item) => item.id !== id);
      progressStorage.setItem(GAUNTLET_MISTAKES_KEY, JSON.stringify(next));
      return next;
    });
  };

  const rememberCityMapQuestion = (
    challengeLevel: GauntletLevel,
    item: NamedRegionQuizItem,
  ) => {
    const key = cityQuizKey(item);
    const historyRef = challengeLevel === LEVEL.REGION_MAP
      ? regionMapHistoryRef
      : plateCityMapHistoryRef;
    const nextHistory = [
      ...historyRef.current.filter((savedKey) => savedKey !== key),
      key,
    ].slice(-CITY_MAP_RECENT_QUESTION_LIMIT);
    historyRef.current = nextHistory;
    writeRecentQuestionHistory(
      progressStorage,
      challengeLevel === LEVEL.REGION_MAP
        ? GAUNTLET_REGION_MAP_HISTORY_KEY
        : GAUNTLET_PLATE_CITY_MAP_HISTORY_KEY,
      nextHistory,
    );
  };

  const advanceStreakChallenge = (
    challengeLevel: GauntletLevel,
    correct: boolean,
    winTarget: number,
    correctAnswer: string,
    explanation: string,
    highlight?: Pick<
      AnswerReview,
      "highlightProvinceCodes" | "highlightRegionName" | "selectedRegionName"
    >,
    mistake?: MistakeSeed,
  ) => {
    if (!correct && mistake) recordMistake(mistake);
    const nextStreak = correct ? streak + 1 : 0;
    setStreak(nextStreak);
    if (correct) {
      setFeedbackType("right");
      if (nextStreak === winTarget) {
        finishLevel(challengeLevel);
        return;
      }
      setAnswerReview(null);
      setProvinceAnswer("");
      setPlateAnswer("");
      setMapSelections(new Set());
      setQuestionIndex((value) => value + 1);
      setFeedback(GAUNTLET_OPENING_FEEDBACK[challengeLevel]);
      focusProvinceInput();
      return;
    }
    setFeedbackType("wrong");
    setFeedback("回答错误，请查看正确答案");
    setAnswerReview({
      correct: false,
      correctAnswer,
      explanation,
      level: challengeLevel,
      nextAction: "next",
      ...highlight,
    });
  };

  const advanceBossQuestion = (
    correct: boolean,
    correctAnswer: string,
    explanation: string,
  ) => {
    if (!currentBossQuestion) return;
    if (!correct && currentBossQuestion.kind !== "shape") {
      const correctProvince = currentBossQuestion.kind === "map"
        ? PROVINCE_BY_CODE.get(currentBossQuestion.provinceCode)
        : null;
      const targets = currentBossQuestion.kind === "text"
        ? currentBossQuestion.targets
        : currentBossQuestion.kind === "truth"
          ? currentBossQuestion.isTrue
            ? ["正确", "对"]
            : ["错误", "错", "不正确"]
          : correctProvince
            ? [correctProvince.name, correctProvince.shortName]
            : [correctAnswer];
      recordMistake({
        id: `boss-${currentBossQuestion.kind}-${currentBossQuestion.prompt}-${currentBossQuestion.value}`,
        category:
          currentBossQuestion.skill === "车牌识别"
            ? "车牌"
            : currentBossQuestion.skill === "行政中心"
              ? "省会"
              : currentBossQuestion.skill === "真假判断"
                ? "判断"
                : "城市",
        prompt: `${currentBossQuestion.prompt}${"value" in currentBossQuestion ? `：${currentBossQuestion.value}` : ""}`,
        answers: targets,
        correctAnswer,
        explanation,
        answerMode:
          currentBossQuestion.kind === "text" &&
          currentBossQuestion.matchAllTargets
            ? "all-plates"
            : undefined,
      });
    }
    const nextLives = correct ? bossLives : bossLives - 1;
    if (nextLives > 0) setBossLives(nextLives);
    setBossStats((current) => ({
      ...current,
      [currentBossQuestion.skill]: {
        correct: current[currentBossQuestion.skill].correct + (correct ? 1 : 0),
        total: current[currentBossQuestion.skill].total + 1,
      },
    }));
    const nextIndex = questionIndex + 1;
    if (correct) {
      setFeedbackType("right");
      if (nextIndex === 30) {
        finishLevel(LEVEL.FINAL_BOSS);
        return;
      }
      setAnswerReview(null);
      setProvinceAnswer("");
      setPlateAnswer("");
      setMapSelections(new Set());
      setQuestionIndex(nextIndex);
      setFeedback(
        nextIndex % 10 === 0
          ? `已通过第 ${nextIndex / 10} 个检查点 · ${nextIndex} / 30`
          : GAUNTLET_OPENING_FEEDBACK[LEVEL.FINAL_BOSS],
      );
      focusProvinceInput();
      return;
    }
    setFeedbackType("wrong");
    setFeedback("回答错误，请查看正确答案");
    setAnswerReview({
      correct: false,
      correctAnswer,
      explanation,
      level: LEVEL.FINAL_BOSS,
      nextAction:
        nextLives <= 0 ? "lose" : nextIndex === 30 ? "finish" : "next",
      checkpoint: nextLives <= 0
        ? "本题答错，最后一条生命耗尽"
        : `本题答错，失去一条生命 · 剩余 ${nextLives} 条`,
      highlightProvinceCodes:
        currentBossQuestion.kind === "map"
          ? [currentBossQuestion.provinceCode]
          : undefined,
    });
  };

  const continueAfterReview = () => {
    if (!answerReview) return;
    const { level: reviewedLevel, nextAction } = answerReview;
    setAnswerReview(null);
    setProvinceAnswer("");
    setPlateAnswer("");
    setMapSelections(new Set());
    if (nextAction === "finish") {
      finishLevel(reviewedLevel);
      return;
    }
    if (nextAction === "lose") {
      setBossLives(0);
      return;
    }
    if (reviewedLevel === LEVEL.MISTAKE_REVENGE) {
      setFeedbackType("idle");
      setFeedback(GAUNTLET_OPENING_FEEDBACK[reviewedLevel]);
      focusProvinceInput();
      return;
    }
    if (reviewedLevel === LEVEL.CITY_SHORTEST_ROUTE) setCityRouteAttempt(null);
    if (reviewedLevel === LEVEL.REGION_MAP) {
      setMapRegionOrder(
        createCityMapQuestionQueue(
          selectedMapRegionItems,
          regionMapHistoryRef.current,
          randomShuffle,
        ),
      );
      setQuestionIndex(0);
    } else {
      setQuestionIndex((value) => value + 1);
    }
    setFeedbackType("idle");
    setFeedback(GAUNTLET_OPENING_FEEDBACK[reviewedLevel]);
    focusProvinceInput();
  };

  const submitAnswer = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!level || answerReview) return;

    if (
      level === LEVEL.FINAL_BOSS &&
      currentBossQuestion &&
      (currentBossQuestion.kind === "text" || currentBossQuestion.kind === "shape")
    ) {
      const correct =
        currentBossQuestion.kind === "text" &&
        currentBossQuestion.matchAllTargets
          ? plateAnswerMatches(provinceAnswer, currentBossQuestion.targets)
          : currentBossQuestion.targets.some(
              (targetAnswer) =>
                answerMatches(provinceAnswer, [targetAnswer]) ||
                normalizePlate(provinceAnswer) === normalizePlate(targetAnswer),
            );
      advanceBossQuestion(
        correct,
        currentBossQuestion.targets.join(" / "),
        currentBossQuestion.explanation,
      );
      return;
    }

    if (level === LEVEL.PROVINCE_CITY_COUNT) {
      if (!currentProvinceCityCount) return;
      const normalizedAnswer = compactName(provinceAnswer).replace(/[个座市]$/u, "");
      const correct = /^\d+$/.test(normalizedAnswer) &&
        Number(normalizedAnswer) === currentProvinceCityCount.cityCount;
      const countAnswer = `${currentProvinceCityCount.cityCount} 座`;
      advanceStreakChallenge(
        LEVEL.PROVINCE_CITY_COUNT,
        correct,
        20,
        countAnswer,
        currentProvinceCityCount.explanation,
        undefined,
        {
          id: `province-city-count-${currentProvinceCityCount.code}`,
          category: "城市数量",
          prompt: `${currentProvinceCityCount.name}有多少座地级及以上城市？`,
          answers: [
            String(currentProvinceCityCount.cityCount),
            `${currentProvinceCityCount.cityCount}个`,
            `${currentProvinceCityCount.cityCount}座`,
          ],
          correctAnswer: countAnswer,
          explanation: currentProvinceCityCount.explanation,
        },
      );
      return;
    }

    if (level === LEVEL.MISTAKE_REVENGE) {
      if (!currentMistake) return;
      const correct = currentMistake.answerMode
        ? plateAnswerMatches(
            provinceAnswer,
            currentMistake.answers,
            currentMistake.answerMode === "all-plate-letters",
          )
        : currentMistake.answers.some(
            (answer) =>
              answerMatches(provinceAnswer, [answer]) ||
              normalizePlate(provinceAnswer) === normalizePlate(answer),
          );
      if (correct) {
        masterMistake(currentMistake.id);
        setMistakeOrder((current) => current.slice(1));
        setFeedbackType("right");
        if (mistakeOrder.length === 1) {
          finishLevel(LEVEL.MISTAKE_REVENGE);
          return;
        }
        setProvinceAnswer("");
        setFeedback("复仇成功，已自动进入下一道错题");
        focusProvinceInput();
        return;
      }
      recordMistake({
        id: currentMistake.id,
        category: currentMistake.category,
        prompt: currentMistake.prompt,
        answers: currentMistake.answers,
        correctAnswer: currentMistake.correctAnswer,
        explanation: currentMistake.explanation,
        answerMode: currentMistake.answerMode,
      });
      setMistakeOrder((current) => [...current.slice(1), current[0]]);
      setFeedbackType("wrong");
      setFeedback("还没攻克，这道题稍后会再次出现");
      setAnswerReview({
        correct: false,
        correctAnswer: currentMistake.correctAnswer,
        explanation: currentMistake.explanation,
        level: LEVEL.MISTAKE_REVENGE,
        nextAction: "next",
        checkpoint: `本题将回到队尾，本轮仍有 ${mistakeOrder.length} 题待攻克`,
      });
      return;
    }

    if (level === LEVEL.UNIVERSITY_CITY) {
      if (!currentUniversity) return;
      const correct = answerMatches(provinceAnswer, currentUniversity.answers);
      const locations = currentUniversity.answers.join(" / ");
      const primaryLocation = currentUniversity.province === currentUniversity.city
        ? currentUniversity.city
        : `${currentUniversity.province}${currentUniversity.city}`;
      advanceStreakChallenge(
        LEVEL.UNIVERSITY_CITY,
        correct,
        20,
        locations,
        currentUniversity.note
          ? `${currentUniversity.name}是原“${currentUniversity.tier}工程”高校。${currentUniversity.note}`
          : `${currentUniversity.name}是原“${currentUniversity.tier}工程”高校，主要办学地在${primaryLocation}`,
        undefined,
        {
          id: `university-city-${currentUniversity.name}`,
          category: "高校",
          prompt: `${currentUniversity.name}主要位于哪座城市？`,
          answers: currentUniversity.answers,
          correctAnswer: locations,
          explanation: currentUniversity.note
            ? `${currentUniversity.name}是原“${currentUniversity.tier}工程”高校。${currentUniversity.note}`
            : `${currentUniversity.name}是原“${currentUniversity.tier}工程”高校，主要办学地在${primaryLocation}`,
        },
      );
      return;
    }

    if (level === LEVEL.PROVINCE_SHAPE) {
      if (!currentProvince) return;
      const correct = answerMatches(provinceAnswer, [
        currentProvince.name,
        currentProvince.shortName,
      ]);
      if (!correct) {
        setFeedbackType("wrong");
        setFeedback("名称不对，再观察一下轮廓");
        focusProvinceInput();
        return;
      }

      const nextIndex = questionIndex + 1;
      if (nextIndex === provinceOrder.length) {
        finishLevel(LEVEL.PROVINCE_SHAPE);
        return;
      }
      setQuestionIndex(nextIndex);
      setProvinceAnswer("");
      setFeedbackType("right");
      setFeedback(`回答正确：${currentProvince.name}。继续下一题`);
      focusProvinceInput();
      return;
    }

    if (level === LEVEL.ROTATED_SHAPE) {
      if (!currentProvince) return;
      const correct = answerMatches(provinceAnswer, [
        currentProvince.name,
        currentProvince.shortName,
      ]);
      advanceStreakChallenge(
        LEVEL.ROTATED_SHAPE,
        correct,
        20,
        currentProvince.name,
        `这个轮廓是${currentProvince.name}`,
      );
      return;
    }

    if (level === LEVEL.PLATE_COMPLETION) {
      if (!currentCity) return;
      const correct = plateAnswerMatches(
        plateAnswer,
        currentCity.plates,
        true,
      );
      advanceStreakChallenge(
        LEVEL.PLATE_COMPLETION,
        correct,
        20,
        currentCity.plate,
        `${currentCity.city}的车牌前缀是 ${currentCity.plate}`,
        undefined,
        {
          id: `plate-${currentCity.city}`,
          category: "车牌",
          prompt: `${currentCity.city}的车牌前缀是什么？`,
          answers: currentCity.plates,
          correctAnswer: currentCity.plate,
          explanation: `${currentCity.city}的车牌前缀是 ${currentCity.plate}`,
          answerMode: "all-plate-letters",
        },
      );
      return;
    }

    if (level !== LEVEL.CITY_PROVINCE && level !== LEVEL.PLATE_PLACE) return;

    if (!currentCity) return;
    const correct = level === LEVEL.CITY_PROVINCE
      ? answerMatches(provinceAnswer, [
          currentCity.province,
          currentCity.provinceShort,
        ])
      : provinceCityAnswerMatches(provinceAnswer, currentCity);
    const winTarget = level === LEVEL.CITY_PROVINCE ? 30 : 20;
    const correctAnswer = level === LEVEL.CITY_PROVINCE
      ? currentCity.province
      : `${currentCity.provinceShort}${stripAdministrativeSuffix(currentCity.city)}`;
    const explanation = level === LEVEL.CITY_PROVINCE
      ? `${currentCity.city}属于${currentCity.province}`
      : `${currentCity.plate}对应${currentCity.province}的${currentCity.city}`;
    if (level === LEVEL.PLATE_PLACE && !correct) {
      const cityShort = stripAdministrativeSuffix(currentCity.city);
      recordMistake({
        id: `plate-place-${currentCity.plate}`,
        category: "车牌",
        prompt: `${currentCity.plate}对应哪个省份和城市或地区？`,
        answers: [
          `${currentCity.provinceShort}${cityShort}`,
          `${currentCity.provinceShort}${currentCity.city}`,
          `${currentCity.province}${cityShort}`,
          `${currentCity.province}${currentCity.city}`,
        ],
        correctAnswer,
        explanation,
      });
    }
    advanceStreakChallenge(
      level,
      correct,
      winTarget,
      correctAnswer,
      explanation,
      undefined,
      level === LEVEL.CITY_PROVINCE
        ? {
            id: `city-province-${currentCity.city}`,
            category: "城市",
            prompt: `${currentCity.city}属于哪个省级行政区？`,
            answers: [currentCity.province, currentCity.provinceShort],
            correctAnswer: currentCity.province,
            explanation,
          }
        : undefined,
    );
  };

  const gradeProvinceSelection = (
    challengeLevel: GauntletLevel,
    expectedCodes: string[],
    winTarget: number,
    correctAnswer: string,
    explanation: string,
  ) => {
    const expected = new Set(expectedCodes);
    advanceStreakChallenge(
      challengeLevel,
      setsEqual(expected, mapSelections),
      winTarget,
      correctAnswer,
      explanation,
      { highlightProvinceCodes: expectedCodes },
    );
  };

  const submitNeighborSelection = () => {
    if (level !== LEVEL.PROVINCE_NEIGHBORS || !currentChallengeProvince || answerReview) return;
    const expectedCodes = PROVINCE_NEIGHBORS[currentChallengeProvince.code] ?? [];
    const expected = new Set(expectedCodes);
    const neighborNames = Array.from(expected)
      .map((code) => PROVINCE_BY_CODE.get(code)?.shortName)
      .filter(Boolean)
      .join("、");
    gradeProvinceSelection(
      LEVEL.PROVINCE_NEIGHBORS,
      expectedCodes,
      10,
      neighborNames || "无陆地邻省",
      `${currentChallengeProvince.shortName}的陆地邻省：${neighborNames}`,
    );
  };

  const answerTruthQuestion = (answer: boolean) => {
    if (level !== LEVEL.TRUTH_FLASH || !currentTruthQuestion || answerReview) return;
    const correct = answer === currentTruthQuestion.isTrue;
    advanceStreakChallenge(
      LEVEL.TRUTH_FLASH,
      correct,
      30,
      currentTruthQuestion.isTrue ? "正确" : "错误",
      currentTruthQuestion.explanation,
      undefined,
      {
        id: `truth-${currentTruthQuestion.statement}`,
        category: "判断",
        prompt: `判断正误：${currentTruthQuestion.statement}`,
        answers: currentTruthQuestion.isTrue
          ? ["正确", "对"]
          : ["错误", "错", "不正确"],
        correctAnswer: currentTruthQuestion.isTrue ? "正确" : "错误",
        explanation: currentTruthQuestion.explanation,
      },
    );
  };

  const answerOptionQuestion = (answer: string) => {
    if (answerReview) return;
    if (level === LEVEL.CITY_UNDERCOVER && currentUndercoverQuestion) {
      advanceStreakChallenge(
        LEVEL.CITY_UNDERCOVER,
        answer === currentUndercoverQuestion.answerCity,
        20,
        currentUndercoverQuestion.answerCity,
        currentUndercoverQuestion.explanation,
        undefined,
        {
          id: `undercover-${currentUndercoverQuestion.options.map((item) => item.city).sort().join("-")}`,
          category: "城市",
          prompt: `找出不属于同一省份的城市：${currentUndercoverQuestion.options.map((item) => item.city).join("、")}`,
          answers: [currentUndercoverQuestion.answerCity],
          correctAnswer: currentUndercoverQuestion.answerCity,
          explanation: currentUndercoverQuestion.explanation,
        },
      );
      return;
    }
    if (level === LEVEL.GEOGRAPHY_ELIMINATION && currentDualIntruderQuestion) {
      advanceStreakChallenge(
        LEVEL.GEOGRAPHY_ELIMINATION,
        answer === currentDualIntruderQuestion.answer,
        16,
        currentDualIntruderQuestion.answer,
        currentDualIntruderQuestion.explanation,
        undefined,
        {
          id: `exclude-${currentDualIntruderQuestion.instruction}-${currentDualIntruderQuestion.prompt}-${currentDualIntruderQuestion.answer}`,
          category: "城市",
          prompt: `${currentDualIntruderQuestion.instruction}：${currentDualIntruderQuestion.prompt}；选项：${currentDualIntruderQuestion.options.join("、")}`,
          answers: [currentDualIntruderQuestion.answer],
          correctAnswer: currentDualIntruderQuestion.answer,
          explanation: currentDualIntruderQuestion.explanation,
        },
      );
      return;
    }
    if (level === LEVEL.PLATE_FAULT && currentPlateFaultQuestion) {
      const correctOption = currentPlateFaultQuestion.options.find(
        (item) => item.id === currentPlateFaultQuestion.answer,
      );
      advanceStreakChallenge(
        LEVEL.PLATE_FAULT,
        answer === currentPlateFaultQuestion.answer,
        20,
        correctOption?.label ?? currentPlateFaultQuestion.answer,
        currentPlateFaultQuestion.explanation,
        undefined,
        correctOption
          ? {
              id: `plate-fault-${correctOption.label}`,
              category: "车牌",
              prompt: `找出车牌对应错误的一组：${currentPlateFaultQuestion.options.map((item) => item.label).join("、")}`,
              answers: [correctOption.label],
              correctAnswer: correctOption.label,
              explanation: currentPlateFaultQuestion.explanation,
            }
          : undefined,
      );
      return;
    }
    if (level === LEVEL.CONFUSABLE_CITIES && currentConfusableQuestion) {
      advanceStreakChallenge(
        LEVEL.CONFUSABLE_CITIES,
        answer === currentConfusableQuestion.answer,
        20,
        currentConfusableQuestion.answer,
        currentConfusableQuestion.explanation,
        undefined,
        {
          id: `confusable-${currentConfusableQuestion.id}`,
          category: "城市",
          prompt: `${currentConfusableQuestion.instruction} ${currentConfusableQuestion.prompt}；候选：${currentConfusableQuestion.options.join(" / ")}`,
          answers: [currentConfusableQuestion.answer],
          correctAnswer: currentConfusableQuestion.answer,
          explanation: currentConfusableQuestion.explanation,
        },
      );
    }
  };

  const handleDetailRegion = (regionName: string) => {
    if (level === LEVEL.CITY_SHORTEST_ROUTE) {
      if (!cityRouteChallenge || cityRouteNames.length === 0 || answerReview) return;
      const currentRegion = cityRouteNames[cityRouteNames.length - 1];
      if (cityRouteNames.includes(regionName)) {
        setFeedbackType("wrong");
        setFeedback("路线不能重复经过同一个市级区块");
        return;
      }
      if (!(cityAdjacency[currentRegion] ?? []).includes(regionName)) {
        setCityRouteNames([cityRouteChallenge.startName]);
        setFeedbackType("wrong");
        setFeedback("两个区块不接壤，路线已回到起点");
        return;
      }
      const nextRoute = [...cityRouteNames, regionName];
      if (regionName !== cityRouteChallenge.endName) {
        const canContinue = (cityAdjacency[regionName] ?? []).some(
          (neighbor) => !nextRoute.includes(neighbor),
        );
        if (!canContinue) {
          setCityRouteNames([cityRouteChallenge.startName]);
          setFeedbackType("wrong");
          setFeedback("这里已经无路可走，路线已回到起点");
          return;
        }
        setCityRouteNames(nextRoute);
        setFeedbackType("right");
        setFeedback(`路线有效，当前已走 ${nextRoute.length - 1} 步`);
        return;
      }
      const correct = nextRoute.length === cityRouteChallenge.shortestPath.length;
      const nextCompleted = correct ? streak + 1 : streak;
      setCityRouteNames(nextRoute);
      setStreak(nextCompleted);
      if (correct) {
        setFeedbackType("right");
        if (nextCompleted === 10) {
          finishLevel(LEVEL.CITY_SHORTEST_ROUTE);
          return;
        }
        setCityRouteAttempt(null);
        setQuestionIndex((value) => value + 1);
        setFeedback("省内最短路线正确，已自动生成下一条路线");
        return;
      }
      setFeedbackType("wrong");
      setFeedback("已经抵达终点，但还不是最短路线");
      setAnswerReview({
        correct: false,
        correctAnswer: cityRouteChallenge.shortestPath.join(" → "),
        explanation: `${PROVINCE_BY_CODE.get(cityRouteChallenge.provinceCode)?.name ?? "本省"}内，从${cityRouteChallenge.startName}到${cityRouteChallenge.endName}最少需要 ${cityRouteChallenge.shortestPath.length - 1} 步。`,
        level: LEVEL.CITY_SHORTEST_ROUTE,
        nextAction: "next",
      });
      return;
    }
    if (level === LEVEL.REGION_MAP) {
      if (!currentMapRegion || answerReview) return;
      const correct = answerMatches(regionName, [currentMapRegion.city]);
      rememberCityMapQuestion(LEVEL.REGION_MAP, currentMapRegion);
      advanceStreakChallenge(
        LEVEL.REGION_MAP,
        correct,
        target,
        currentMapRegion.city,
        `${currentMapRegion.city}位于${currentMapRegion.province}，对应省内地图上的“${currentMapRegion.city}”区块`,
        {
          highlightRegionName: currentMapRegion.city,
          selectedRegionName: !correct ? regionName : undefined,
        },
      );
      return;
    }
    if (level !== LEVEL.PLATE_CITY_MAP || !currentCity || answerReview) return;
    setPlateCityMapFocusedProvinceCode(null);
    const correct = answerMatches(regionName, [currentCity.city]);
    rememberCityMapQuestion(LEVEL.PLATE_CITY_MAP, currentCity);
    advanceStreakChallenge(
      LEVEL.PLATE_CITY_MAP,
      correct,
      30,
      `${currentCity.plate} · ${currentCity.city}`,
      `${currentCity.plate}对应${currentCity.province}的${currentCity.city}`,
      {
        highlightRegionName: currentCity.city,
      },
      {
        id: `plate-city-map-${currentCity.plate}`,
        category: "车牌",
        prompt: `${currentCity.plate}对应哪个城市或地区？`,
        answers: [currentCity.city],
        correctAnswer: `${currentCity.plate} · ${currentCity.city}`,
        explanation: `${currentCity.plate}对应${currentCity.province}的${currentCity.city}`,
      },
    );
  };

  const submitProvinceGroup = () => {
    if (level !== LEVEL.TERRITORY_GROUPS || !currentGroupQuestion || answerReview) return;
    const names = currentGroupQuestion.codes
      .map((code) => PROVINCE_BY_CODE.get(code)?.shortName)
      .filter(Boolean)
      .join("、");
    gradeProvinceSelection(
      LEVEL.TERRITORY_GROUPS,
      currentGroupQuestion.codes,
      PROVINCE_GROUP_QUESTIONS.length,
      names,
      `${currentGroupQuestion.description}。完整范围包括：${names}`,
    );
  };

  const placePuzzleProvince = (
    selectedProvince: Province,
    draggedCode?: string,
  ) => {
    if (level !== LEVEL.PROVINCE_PUZZLE || !currentPuzzleFeature) return;
    const puzzleProvince = provinceForFeature(currentPuzzleFeature);
    if (!puzzleProvince) return;
    const correct =
      selectedProvince.code === puzzleProvince.code &&
      (!draggedCode || draggedCode === puzzleProvince.code);
    if (!correct) {
      setFeedbackType("wrong");
      setFeedback("位置不对，再观察轮廓与全国地图中的相对位置");
      return;
    }
    const next = new Set(mapSelections).add(puzzleProvince.code);
    if (next.size === provinceOrder.length) {
      setMapSelections(next);
      finishLevel(LEVEL.PROVINCE_PUZZLE);
      return;
    }
    setMapSelections(next);
    setFeedbackType("right");
    setFeedback(`放置正确：${puzzleProvince.name}。继续下一块拼图`);
  };

  const answerBossTruth = (answer: boolean) => {
    if (level !== LEVEL.FINAL_BOSS || currentBossQuestion?.kind !== "truth" || answerReview) return;
    advanceBossQuestion(
      answer === currentBossQuestion.isTrue,
      currentBossQuestion.isTrue ? "正确" : "错误",
      currentBossQuestion.explanation,
    );
  };

  const restartProvinceRoute = (message: string) => {
    const possibleStarts = PROVINCES.filter(
      (item) => (PROVINCE_NEIGHBORS[item.code]?.length ?? 0) > 0,
    );
    const start = randomShuffle(possibleStarts)[0];
    setRouteCodes(start ? [start.code] : []);
    setFeedbackType("wrong");
    setFeedback(message);
  };

  const handleGauntletProvince = (selectedProvince: Province) => {
    if (answerReview) return;
    if (level === LEVEL.PROVINCE_PUZZLE) {
      placePuzzleProvince(selectedProvince);
      return;
    }

    if (level === LEVEL.TERRITORY_GROUPS) {
      setMapSelections((current) => {
        const next = new Set(current);
        if (next.has(selectedProvince.code)) next.delete(selectedProvince.code);
        else next.add(selectedProvince.code);
        return next;
      });
      setFeedbackType("idle");
      setFeedback("选择完成后，点击右侧确认答案");
      return;
    }

    if (level === LEVEL.FINAL_BOSS && currentBossQuestion?.kind === "map") {
      const correctProvince = PROVINCE_BY_CODE.get(
        currentBossQuestion.provinceCode,
      );
      advanceBossQuestion(
        selectedProvince.code === currentBossQuestion.provinceCode,
        correctProvince?.name ?? currentBossQuestion.provinceCode,
        currentBossQuestion.explanation,
      );
      return;
    }

    if (level === LEVEL.PROVINCE_NEIGHBORS) {
      if (selectedProvince.code === currentChallengeProvince?.code) {
        setFeedbackType("wrong");
        setFeedback("中心省份不用选择，请只圈出它的陆地邻省");
        return;
      }
      setMapSelections((current) => {
        const next = new Set(current);
        if (next.has(selectedProvince.code)) next.delete(selectedProvince.code);
        else next.add(selectedProvince.code);
        return next;
      });
      setFeedbackType("idle");
      setFeedback("选择完成后，点击右侧确认答案");
      return;
    }

    if (level === LEVEL.PROVINCE_SHORTEST_ROUTE) {
      if (!routeChallenge || routeCodes.length === 0) return;
      const currentCode = routeCodes[routeCodes.length - 1];
      if (routeCodes.includes(selectedProvince.code)) {
        setFeedbackType("wrong");
        setFeedback("这条路线不能重复经过同一省份");
        return;
      }
      if (!(PROVINCE_NEIGHBORS[currentCode] ?? []).includes(selectedProvince.code)) {
        setRouteCodes([routeChallenge.startCode]);
        setFeedbackType("wrong");
        setFeedback("两地不接壤，路线已回到起点");
        return;
      }
      const nextRoute = [...routeCodes, selectedProvince.code];
      if (selectedProvince.code !== routeChallenge.endCode) {
        const nextOptions = (PROVINCE_NEIGHBORS[selectedProvince.code] ?? [])
          .filter((code) => !nextRoute.includes(code));
        if (nextOptions.length === 0) {
          setRouteCodes([routeChallenge.startCode]);
          setFeedbackType("wrong");
          setFeedback("这里已经无路可走，路线已回到起点");
          return;
        }
        setRouteCodes(nextRoute);
        setFeedbackType("right");
        setFeedback(`路线有效，当前已走 ${nextRoute.length - 1} 步`);
        return;
      }
      if (nextRoute.length !== routeChallenge.shortestPath.length) {
        setRouteCodes([routeChallenge.startCode]);
        setFeedbackType("wrong");
        setFeedback(`已经抵达终点，但不是最短路线；最少需要 ${routeChallenge.shortestPath.length - 1} 步`);
        return;
      }
      const nextCompleted = streak + 1;
      if (nextCompleted === 10) {
        setRouteCodes(nextRoute);
        finishLevel(LEVEL.PROVINCE_SHORTEST_ROUTE);
        return;
      }
      const nextChallenge = createRouteChallenge();
      setStreak(nextCompleted);
      setRouteChallenge(nextChallenge);
      setRouteCodes([nextChallenge.startCode]);
      setFeedbackType("right");
      setFeedback(`最短路线正确，已完成 ${nextCompleted} / 10 条`);
      return;
    }

    if (level === LEVEL.CITY_MAP) {
      if (!currentCity) return;
      const correct = answerMatches(selectedProvince.shortName, [
        currentCity.province,
        currentCity.provinceShort,
      ]);
      advanceStreakChallenge(
        LEVEL.CITY_MAP,
        correct,
        30,
        currentCity.province,
        `${currentCity.city}属于${currentCity.province}`,
        {
          highlightProvinceCodes: [
            PROVINCE_BY_SHORT_NAME.get(currentCity.provinceShort)?.code ?? "",
          ].filter(Boolean),
        },
        {
          id: `city-province-${currentCity.city}`,
          category: "城市",
          prompt: `${currentCity.city}属于哪个省级行政区？`,
          answers: [currentCity.province, currentCity.provinceShort],
          correctAnswer: currentCity.province,
          explanation: `${currentCity.city}属于${currentCity.province}`,
        },
      );
      return;
    }

    if (level !== LEVEL.NEIGHBOR_CHAIN || routeCodes.length === 0) return;
    const currentCode = routeCodes[routeCodes.length - 1];
    if (routeCodes.includes(selectedProvince.code)) {
      setFeedbackType("wrong");
      setFeedback("这个省份已经走过，请选择尚未经过的陆地邻省");
      return;
    }
    if (!(PROVINCE_NEIGHBORS[currentCode] ?? []).includes(selectedProvince.code)) {
      restartProvinceRoute("路线中断：两地不接壤，已随机生成新的起点");
      return;
    }

    const nextRoute = [...routeCodes, selectedProvince.code];
    if (nextRoute.length === 10) {
      setRouteCodes(nextRoute);
      finishLevel(LEVEL.NEIGHBOR_CHAIN);
      return;
    }
    const unvisitedNeighbors = (PROVINCE_NEIGHBORS[selectedProvince.code] ?? [])
      .filter((code) => !nextRoute.includes(code));
    if (unvisitedNeighbors.length === 0) {
      restartProvinceRoute("这里已经无路可走，已随机生成新的起点");
      return;
    }
    setRouteCodes(nextRoute);
    setFeedbackType("right");
    setFeedback(`路线有效：已连续走过 ${nextRoute.length} 个省级行政区`);
  };

  const returnToLevels = () => {
    setLevel(null);
    setPassedLevel(null);
    setAnswerReview(null);
    setProvincePickerOpen(false);
    setFeedbackType("idle");
  };

  const roundHeading = level ? GAUNTLET_ROUND_HEADINGS[level] : "";

  const activeConfig = level ? GAUNTLET_LEVEL_BY_ID.get(level) ?? null : null;
  const activeLevelIndex = level
    ? GAUNTLET_LEVELS.findIndex((item) => item.id === level)
    : -1;
  const nextLevelConfig = activeLevelIndex >= 0
    ? GAUNTLET_LEVELS[activeLevelIndex + 1] ?? null
    : null;
  const activeDisplayNumber = level ? gauntletLevelNumber(level) : null;
  const completedTarget = passedLevel === LEVEL.PROVINCE_SHAPE
    ? `已辨认本轮所选的 ${target} 个省级行政区`
    : passedLevel === LEVEL.PROVINCE_PUZZLE
      ? `已完成本轮所选的 ${target} 块省份拼图`
    : passedLevel === LEVEL.REGION_MAP && target < 30
      ? `已连续答对当前范围完整一轮（${target} 题）`
      : activeConfig
        ? `已完成目标：${activeConfig.target}`
        : "已完成本关目标";

  return (
    <main className={`game-shell gauntlet-shell ${level ? "is-round-active" : ""}`}>
      <header className="site-header gauntlet-header">
        <button className="brand" type="button" onClick={onExit}>
          <span className="brand-seal gauntlet-brand-seal" aria-hidden="true">关</span>
          <span>
            <strong>中国城市填充挑战</strong>
            <small>GAUNTLET MODE</small>
          </span>
        </button>
        <button className="gauntlet-exit" type="button" onClick={onExit}>
          返回地图玩法
        </button>
      </header>

      {level ? (
        <nav className="gauntlet-mobile-nav" aria-label="关卡导航">
          <button type="button" onClick={returnToLevels}>← 选关</button>
          <strong>
            第 {activeDisplayNumber} 关
            <small> · {target === 0 ? "暂无题目" : `${progress}/${target}`}</small>
          </strong>
          <button type="button" onClick={onExit}>地图首页</button>
        </nav>
      ) : null}

      {!level ? (
        <>
          <section className="gauntlet-intro">
            <p className="eyebrow">过关斩将 · 全关卡试炼</p>
            <h1>从轮廓到终极混战，<span>把中国地理练成直觉</span></h1>
            <p className="lede">共 {GAUNTLET_LEVEL_COUNT} 个关卡，均可直接选择。错题复仇会读取本机历史错题，其余连续答题关卡答错后连胜归零。</p>
            <div className="gauntlet-lobby-settings" aria-label="挑战设置">
              <button
                className={`timed-mode-toggle ${timedMode ? "is-active" : ""}`}
                type="button"
                role="switch"
                aria-checked={timedMode}
                onClick={() =>
                  setTimeLimit((value) => value === 0 ? 90 : value === 90 ? 60 : 0)
                }
              >
                <span aria-hidden="true">{timeLimit === 0 ? "∞" : timeLimit === 90 ? "计" : "速"}</span>
                <b>{timeLimit === 0 ? "不限时模式" : timeLimit === 90 ? "限时模式 · 90 秒" : "极速模式 · 60 秒"}</b>
                <small>{timeLimit === 0 ? "点击切换到 90 秒限时" : timeLimit === 90 ? "点击切换到 60 秒极速" : "点击切回不限时模式"}</small>
              </button>
              <button
                className="province-picker-button gauntlet-scope-button"
                type="button"
                onClick={openProvincePicker}
                disabled={!provinceScopeReady}
              >
                <span aria-hidden="true">域</span>
                <b>统一省份范围 · {selectedShapeProvinceCodes.size} / {PROVINCES.length}</b>
                <i>{provinceScopeReady ? provinceScopeSummary : "正在读取已保存范围…"}</i>
                <em>修改</em>
              </button>
            </div>
            <p className={`gauntlet-scope-message ${provinceScopeMessage ? "is-visible" : ""}`} role="status">
              {provinceScopeMessage || "选择一次后，支持自选范围的关卡会自动沿用；全国固定关卡不受影响。"}
            </p>
          </section>
          <section className="gauntlet-level-grid" aria-label="选择关卡">
            {GAUNTLET_LEVELS.map((item, index) => {
              const completed = completedLevels.has(item.id);
              const scopeIssue = provinceScopeIssue(item.id);
              const levelTarget = item.id === LEVEL.REGION_MAP && selectedMapRegionItems.length < 30
                  ? `连续答对 ${selectedMapRegionItems.length} 题（完整一轮）`
                  : item.target;
              const mapUnavailable = MAP_REQUIRED_LEVELS.has(item.id) &&
                (!nationalMap || nationalError);
              return (
                <button
                  key={item.id}
                  className="gauntlet-level-card"
                  type="button"
                  onClick={() => startLevel(item.id)}
                  disabled={mapUnavailable || Boolean(scopeIssue)}
                  title={scopeIssue ?? undefined}
                >
                  <span className="level-number">第 {index + 1} 关</span>
                  <i>{item.badge}</i>
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                  <b>
                    {item.id === LEVEL.MISTAKE_REVENGE
                      ? mistakes.length
                        ? `当前 ${mistakes.length} 道历史错题`
                        : "暂无历史错题"
                      : levelTarget}
                  </b>
                  <span className={`level-state ${completed ? "is-complete" : ""}`}>
                    {mapUnavailable
                        ? "地图载入中…"
                      : scopeIssue
                        ? scopeIssue
                        : completed
                          ? "✓ 已过关"
                          : "开始挑战 →"}
                  </span>
                </button>
              );
            })}
          </section>
        </>
      ) : hasTimedOut || hasLostBoss ? (
        <section className="gauntlet-passed gauntlet-timeout" aria-live="polite">
          <span className="gauntlet-pass-seal" aria-hidden="true">{hasLostBoss ? "败" : "时"}</span>
          <p className="eyebrow">第 {activeDisplayNumber} 关 · {hasLostBoss ? "生命耗尽" : "时间耗尽"}</p>
          <h1>还差一点，再冲一次</h1>
          <p>
            {hasLostBoss
              ? "三条生命已经用完，本轮成绩不会计入通关记录。"
              : `${timeLimit} 秒倒计时已结束，本轮成绩不会计入通关记录。`}
          </p>
          {hasLostBoss ? <BossSkillSummary stats={bossStats} /> : null}
          <div>
            <button type="button" onClick={() => startLevel(level)}>
              重新挑战
            </button>
            <button type="button" className="is-text" onClick={returnToLevels}>
              返回选关
            </button>
          </div>
        </section>
      ) : passedLevel ? (
        <section className="gauntlet-passed" aria-live="polite">
          <span className="gauntlet-pass-seal" aria-hidden="true">胜</span>
          <p className="eyebrow">第 {activeDisplayNumber} 关 · 挑战达成</p>
          <h1>{activeConfig?.title}，过关！</h1>
          <p>{completedTarget}，这一关已留下通关印记。</p>
          {passedLevel === LEVEL.FINAL_BOSS ? <BossSkillSummary stats={bossStats} /> : null}
          <div>
            {nextLevelConfig ? (
              <button type="button" onClick={() => startLevel(nextLevelConfig.id)}>
                挑战下一关
              </button>
            ) : null}
            <button type="button" className="is-secondary" onClick={() => startLevel(passedLevel)}>
              再来一次
            </button>
            <button type="button" className="is-text" onClick={returnToLevels}>
              返回选关
            </button>
          </div>
        </section>
      ) : (
        <>
          <section className="gauntlet-round-heading">
            <div>
              <button type="button" onClick={returnToLevels}>← 返回选关</button>
              <p className="eyebrow">第 {activeDisplayNumber} 关 · {activeConfig?.title}</p>
              <h1>{roundHeading}</h1>
            </div>
            <div className={`gauntlet-round-actions ${!timedMode && level !== LEVEL.FINAL_BOSS ? "is-progress-only" : ""}`}>
              {level === LEVEL.FINAL_BOSS ? (
                <div className="boss-lives" aria-label={`剩余 ${bossLives} 条生命`}>
                  <span>生命</span>
                  <strong>{Array.from({ length: 3 }, (_, index) => (
                    <i key={index} className={index < bossLives ? "is-alive" : ""}>♥</i>
                  ))}</strong>
                </div>
              ) : null}
              {timedMode ? (
                <div className={`gauntlet-timer ${timeLeft <= 15 ? "is-urgent" : ""}`}>
                  <span>剩余时间</span>
                  <strong>{timeLeft}<i> 秒</i></strong>
                </div>
              ) : null}
              <div className="gauntlet-progress-card">
                <span>
                  {level === LEVEL.PROVINCE_SHAPE
                    ? "答题进度"
                    : level === LEVEL.NEIGHBOR_CHAIN
                      ? "路线长度"
                      : level === LEVEL.PROVINCE_PUZZLE
                        ? "拼图进度"
                        : level === LEVEL.PROVINCE_SHORTEST_ROUTE
                          ? "完成路线"
                          : level === LEVEL.MISTAKE_REVENGE
                            ? "错题进度"
                          : level === LEVEL.CITY_SHORTEST_ROUTE
                            ? "完成路线"
                          : level === LEVEL.FINAL_BOSS
                            ? "题目进度"
                            : "当前连胜"}
                </span>
                <strong>
                  {level === LEVEL.MISTAKE_REVENGE && target === 0
                    ? "暂无"
                    : <>{progress}<i> / {target}</i></>}
                </strong>
                <div><span style={{ width: `${target ? (progress / target) * 100 : 0}%` }} /></div>
              </div>
            </div>
          </section>

          <section className={`gauntlet-play-card ${feedbackType === "wrong" ? "has-error" : ""} ${answerReview ? "is-reviewing" : ""}`}>
            <div className="gauntlet-question-stage">
              <span className="question-count">
                {level === LEVEL.PROVINCE_SHAPE
                  ? `${selectedShapeProvinceCodes.size} 省 · 第 ${questionIndex + 1} / ${target} 题`
                  : level === LEVEL.ROTATED_SHAPE
                    ? `${selectedShapeProvinceCodes.size} 省 · 第 ${questionIndex + 1} 题`
                  : level === LEVEL.PROVINCE_PUZZLE
                    ? `${selectedShapeProvinceCodes.size} 省 · 已放置 ${mapSelections.size} / ${target}`
                  : level === LEVEL.PROVINCE_NEIGHBORS
                    ? `${selectedShapeProvinceCodes.size} 省 · 第 ${questionIndex + 1} 题`
                    : level === LEVEL.NEIGHBOR_CHAIN
                      ? `全国路线 · 已走 ${routeCodes.length} / 10`
                      : level === LEVEL.TERRITORY_GROUPS
                        ? `疆域集合 · 第 ${(questionIndex % PROVINCE_GROUP_QUESTIONS.length) + 1} / ${PROVINCE_GROUP_QUESTIONS.length} 组`
                        : level === LEVEL.PROVINCE_SHORTEST_ROUTE
                          ? `最短路线 · 已完成 ${streak} / 10`
                          : level === LEVEL.MISTAKE_REVENGE
                            ? `历史错题 · 剩余 ${mistakeOrder.length} 题`
                          : level === LEVEL.CONFUSABLE_CITIES
                            ? `易混城市 · 第 ${questionIndex + 1} 题`
                          : level === LEVEL.CITY_SHORTEST_ROUTE
                            ? `省内路线 · 已完成 ${streak} / 10 条`
                          : level === LEVEL.PROVINCE_CITY_COUNT
                            ? `${selectedShapeProvinceCodes.size} 省 · 第 ${questionIndex + 1} 题`
                          : level === LEVEL.FINAL_BOSS
                            ? `终极混战 · 第 ${questionIndex + 1} / 30 题`
                          : level === LEVEL.UNIVERSITY_CITY
                            ? `${selectedUniversityProvinces.size} 省 · ${universityOrder.length} 校 · 第 ${questionIndex + 1} 题`
                          : level === LEVEL.REGION_MAP
                            ? `${selectedShapeProvinceCodes.size} 省 · ${mapRegionPoolSize} 区块 · 第 ${streak + 1} / ${target} 题`
                          : level === LEVEL.PLATE_CITY_MAP
                            ? `${selectedQuizProvinces.size} 省 · ${cityPoolSize} 城市/地区 · 第 ${questionIndex + 1} 题`
                            : `${selectedQuizProvinces.size} 省 · ${cityOrder.length} ${PLATE_QUESTION_LEVELS.has(level) ? "城市/地区" : "城"} · 第 ${questionIndex + 1} 题`}
              </span>
              {level === LEVEL.PROVINCE_SHAPE ? (
                currentProvinceFeature ? (
                  <ProvinceSilhouette feature={currentProvinceFeature} />
                ) : <LoadingMap />
              ) : level === LEVEL.ROTATED_SHAPE ? (
                currentProvinceFeature ? (
                  <ProvinceSilhouette
                    feature={currentProvinceFeature}
                    rotation={(questionIndex * 137 + 47) % 360}
                  />
                ) : <LoadingMap />
              ) : level === LEVEL.PROVINCE_PUZZLE ? (
                nationalMap && currentPuzzleFeature ? (
                  <div className="gauntlet-map-question puzzle-question-stage">
                    <PuzzlePiece feature={currentPuzzleFeature} />
                    <GauntletNationalMap
                      map={nationalMap}
                      selectedCodes={mapSelections}
                      routeCodes={[]}
                      originCode={null}
                      showLabels={false}
                      onProvince={handleGauntletProvince}
                      onProvinceDrop={placePuzzleProvince}
                    />
                  </div>
                ) : <LoadingMap />
              ) : level === LEVEL.CITY_UNDERCOVER ? (
                <div className="choice-question">
                  <span aria-hidden="true">卧</span>
                  <p>其中三座城市属于同一个省份</p>
                  <strong>找出唯一的城市卧底</strong>
                  <small>需要自己判断另外三座城市的共同归属</small>
                </div>
              ) : level === LEVEL.REGION_MAP ? (
                gauntletDetailMap && gauntletDetailReady && currentMapRegion ? (
                  <div className="gauntlet-map-question">
                    <div className="map-question-banner">
                      <small>在{currentMapRegion.provinceShort}地图上找到</small>
                      <strong>{currentMapRegion.city}</strong>
                    </div>
                    <GauntletDetailMap
                      map={gauntletDetailMap}
                      onRegion={handleDetailRegion}
                      correctRegionName={answerReview?.highlightRegionName}
                      selectedRegionName={answerReview?.selectedRegionName}
                      showLabels={Boolean(answerReview)}
                      readOnly={Boolean(answerReview)}
                    />
                  </div>
                ) : gauntletDetailError ? (
                  <p className="map-error">省内地图载入失败，请重试本关</p>
                ) : <LoadingMap />
              ) : level === LEVEL.TERRITORY_GROUPS ? (
                nationalMap && currentGroupQuestion ? (
                  <div className="gauntlet-map-question">
                    <div className="map-question-banner">
                      <small>{currentGroupQuestion.description}</small>
                      <strong>{currentGroupQuestion.title}</strong>
                    </div>
                    <GauntletNationalMap
                      map={nationalMap}
                      selectedCodes={mapSelections}
                      correctCodes={reviewProvinceCodes}
                      routeCodes={[]}
                      originCode={null}
                      showLabels
                      onProvince={handleGauntletProvince}
                    />
                  </div>
                ) : <LoadingMap />
              ) : level === LEVEL.PROVINCE_SHORTEST_ROUTE ? (
                nationalMap && routeChallenge ? (
                  <div className="gauntlet-map-question">
                    <div className="map-question-banner route-target-banner">
                      <small>用最少步数连接</small>
                      <strong>
                        {PROVINCE_BY_CODE.get(routeChallenge.startCode)?.shortName}
                        <i>→</i>
                        {PROVINCE_BY_CODE.get(routeChallenge.endCode)?.shortName}
                      </strong>
                    </div>
                    <GauntletNationalMap
                      map={nationalMap}
                      selectedCodes={new Set([routeChallenge.endCode])}
                      routeCodes={routeCodes}
                      originCode={routeChallenge.startCode}
                      showLabels
                      onProvince={handleGauntletProvince}
                    />
                  </div>
                ) : <LoadingMap />
              ) : level === LEVEL.GEOGRAPHY_ELIMINATION ? (
                <div className="choice-question is-dual">
                  <span aria-hidden="true">双</span>
                  <p>{currentDualIntruderQuestion?.instruction}</p>
                  <strong>{currentDualIntruderQuestion?.prompt ?? "载入中…"}</strong>
                  <small>城市、省份与行政中心会交替出题</small>
                </div>
              ) : level === LEVEL.PLATE_FAULT ? (
                <div className="choice-question plate-fault-heading">
                  <span aria-hidden="true">查</span>
                  <p>四组对应关系中有且仅有一组错误</p>
                  <strong>找出车牌错误项</strong>
                  <small>城市名称与车牌前缀必须同时匹配</small>
                </div>
              ) : level === LEVEL.UNIVERSITY_CITY ? (
                currentUniversity ? (
                  <div className="choice-question university-question">
                    <span aria-hidden="true">校</span>
                    <p>原“{currentUniversity.tier}工程”高校</p>
                    <strong>{currentUniversity.name}</strong>
                    <small>写出学校主要办学地所在城市</small>
                  </div>
                ) : <LoadingMap />
              ) : level === LEVEL.MISTAKE_REVENGE ? (
                currentMistake ? (
                  <div className="choice-question mistake-question">
                    <span aria-hidden="true">错</span>
                    <p>{currentMistake.category}错题 · 曾答错 {currentMistake.wrongCount} 次</p>
                    <strong>{currentMistake.prompt}</strong>
                    <small>答对后，这道题会从本机错题库移除</small>
                  </div>
                ) : (
                  <div className="mistake-empty-state">
                    <span aria-hidden="true">✓</span>
                    <strong>暂无历史错题</strong>
                    <p>先去挑战其他关卡；答错的城市、省份、车牌、省会和高校题会自动收录到这里。</p>
                  </div>
                )
              ) : level === LEVEL.CONFUSABLE_CITIES ? (
                currentConfusableQuestion ? (
                  <div className="choice-question confusable-question">
                    <span aria-hidden="true">辨</span>
                    <p>{currentConfusableQuestion.instruction}</p>
                    <strong>{currentConfusableQuestion.prompt}</strong>
                    <small>{currentConfusableQuestion.pair.join(" · ")}</small>
                  </div>
                ) : <LoadingMap />
              ) : level === LEVEL.CITY_SHORTEST_ROUTE ? (
                gauntletDetailMap && gauntletDetailReady && cityRouteChallenge ? (
                  <div className="gauntlet-map-question city-route-question">
                    <div className="map-question-banner route-target-banner">
                      <small>
                        {PROVINCE_BY_CODE.get(cityRouteChallenge.provinceCode)?.name}
                        · 用最少步数连接
                      </small>
                      <strong>
                        {stripAdministrativeSuffix(cityRouteChallenge.startName)}
                        <i>→</i>
                        {stripAdministrativeSuffix(cityRouteChallenge.endName)}
                      </strong>
                    </div>
                    <GauntletDetailMap
                      map={gauntletDetailMap}
                      onRegion={handleDetailRegion}
                      routeRegionNames={cityRouteNames}
                      originRegionName={cityRouteChallenge.startName}
                      targetRegionName={cityRouteChallenge.endName}
                      showLabels
                    />
                  </div>
                ) : gauntletDetailError ? (
                  <p className="map-error">省内地图载入失败，请重试本关</p>
                ) : <LoadingMap />
              ) : level === LEVEL.PROVINCE_CITY_COUNT ? (
                currentProvinceCityCount ? (
                  <div className="choice-question city-count-question">
                    <span aria-hidden="true">数</span>
                    <p>地级及以上城市数量</p>
                    <strong>{currentProvinceCityCount.name}</strong>
                    <small>内地按2024年《中国统计年鉴》口径；港澳台按当地现行行政层级说明</small>
                  </div>
                ) : <LoadingMap />
              ) : level === LEVEL.PLATE_CITY_MAP ? (
                gauntletDetailMap && gauntletDetailReady && currentCity ? (
                  <div className="gauntlet-map-question plate-city-map-question">
                    <div className="map-question-banner plate-city-map-banner">
                      <small>
                        {plateCityMapFocusedProvince
                          ? "已放大一张省级地图，点击城市区块后才会判题"
                          : "可以直接点击城市，也可以先选择一张省级地图放大"}
                      </small>
                      <strong>{currentCity.plate}</strong>
                    </div>
                    {plateCityMapFocusedProvince ? (
                      <div className="gauntlet-focused-province-map">
                        <div className="gauntlet-focused-province-toolbar">
                          <span>省份选择不会判错，城市落点后才计算答案</span>
                          <button
                            type="button"
                            onClick={() => setPlateCityMapFocusedProvinceCode(null)}
                          >
                            ← 返回重新选省
                          </button>
                        </div>
                        <GauntletProvinceMapWall
                          map={gauntletDetailMap}
                          provinces={[plateCityMapFocusedProvince]}
                          onRegion={handleDetailRegion}
                          correctRegionName={answerReview?.highlightRegionName}
                          readOnly={Boolean(answerReview)}
                        />
                      </div>
                    ) : (
                      <GauntletProvinceMapWall
                        map={gauntletDetailMap}
                        provinces={selectedCityMapProvinces}
                        onRegion={handleDetailRegion}
                        onProvinceFocus={setPlateCityMapFocusedProvinceCode}
                        correctRegionName={answerReview?.highlightRegionName}
                        readOnly={Boolean(answerReview)}
                      />
                    )}
                  </div>
                ) : gauntletDetailError ? (
                  <p className="map-error">所选省份地图载入失败，请重试本关</p>
                ) : <LoadingMap />
              ) : level === LEVEL.FINAL_BOSS ? (
                currentBossQuestion?.kind === "map" && nationalMap ? (
                  <div className="gauntlet-map-question boss-question-stage">
                    <div className="map-question-banner">
                      <small>{currentBossQuestion.prompt}</small>
                      <strong>{currentBossQuestion.value}</strong>
                    </div>
                    <GauntletNationalMap
                      map={nationalMap}
                      selectedCodes={new Set<string>()}
                      correctCodes={reviewProvinceCodes}
                      routeCodes={[]}
                      originCode={null}
                      showLabels={false}
                      onProvince={handleGauntletProvince}
                    />
                  </div>
                ) : currentBossQuestion?.kind === "shape" && bossShapeFeature ? (
                  <div className="boss-shape-question">
                    <p>{currentBossQuestion.prompt}</p>
                    <ProvinceSilhouette
                      feature={bossShapeFeature}
                      rotation={(questionIndex * 149 + 31) % 360}
                    />
                  </div>
                ) : currentBossQuestion && currentBossQuestion.kind !== "shape" ? (
                  <div className="choice-question boss-text-question">
                    <span aria-hidden="true">{currentBossQuestion.badge}</span>
                    <p>{currentBossQuestion.prompt}</p>
                    <strong>{currentBossQuestion.value}</strong>
                    <small>
                      {currentBossQuestion.kind === "text" &&
                      currentBossQuestion.matchAllTargets &&
                      currentBossQuestion.targets.length > 1
                        ? `多号牌城市：${currentBossQuestion.targets.length} 个前缀必须全部答出`
                        : "终极混战题型会随时切换"}
                    </small>
                  </div>
                ) : <LoadingMap />
              ) : level === LEVEL.PROVINCE_NEIGHBORS ? (
                currentChallengeProvince ? (
                  <div className="choice-question neighbor-text-question">
                    <span aria-hidden="true">邻</span>
                    <p>选出全部陆地接壤的省级行政区</p>
                    <strong>{currentChallengeProvince.name}</strong>
                    <small>不再依赖地图，直接根据省份名称判断</small>
                  </div>
                ) : <LoadingMap />
              ) : level === LEVEL.CITY_MAP ? (
                nationalMap && currentCity ? (
                  <div className="gauntlet-map-question">
                    <div className="map-question-banner">
                      <small>点击它所属的省级行政区</small>
                      <strong>{currentCity.city}</strong>
                    </div>
                    <GauntletNationalMap
                      map={nationalMap}
                      selectedCodes={new Set<string>()}
                      correctCodes={reviewProvinceCodes}
                      routeCodes={[]}
                      originCode={null}
                      showLabels={false}
                      onProvince={handleGauntletProvince}
                    />
                  </div>
                ) : <LoadingMap />
              ) : level === LEVEL.NEIGHBOR_CHAIN ? (
                nationalMap ? (
                  <div className="gauntlet-map-question">
                    <div className="map-question-banner">
                      <small>当前省份</small>
                      <strong>{PROVINCE_BY_CODE.get(routeCodes.at(-1) ?? "")?.name ?? "载入中…"}</strong>
                    </div>
                    <GauntletNationalMap
                      map={nationalMap}
                      selectedCodes={new Set<string>()}
                      routeCodes={routeCodes}
                      originCode={routeCodes[0] ?? null}
                      showLabels
                      onProvince={handleGauntletProvince}
                    />
                  </div>
                ) : <LoadingMap />
              ) : level === LEVEL.TRUTH_FLASH ? (
                <div className="truth-question">
                  <span aria-hidden="true">判</span>
                  <p>下面这句话是正确还是错误？</p>
                  <strong>{currentTruthQuestion?.statement ?? "载入中…"}</strong>
                </div>
              ) : level === LEVEL.PLATE_COMPLETION ? (
                <div className="city-question plate-fill-question">
                  <span aria-hidden="true">补</span>
                  <p>补出这个城市或地区的全部车牌字母</p>
                  <strong>{currentCity?.city ?? "载入中…"}</strong>
                  <small className="plate-blank">
                    {currentCity
                      ? `${currentCity.plate.slice(0, 1)} ${currentCity.plates.map((plate) =>
                          "？".repeat(Math.max(1, plate.replace(/^\p{Script=Han}/u, "").length)),
                        ).join(" / ")}`
                      : "？"}
                  </small>
                  {currentCity && currentCity.plates.length > 1 ? (
                    <small>多号牌区域：用顿号或空格分隔，必须全部答出</small>
                  ) : null}
                </div>
              ) : (
                <div className={`city-question ${level === LEVEL.PLATE_PLACE ? "is-plate-question" : ""}`}>
                  <span aria-hidden="true">{level === LEVEL.PLATE_PLACE ? "牌" : "城"}</span>
                  <p>{level === LEVEL.PLATE_PLACE ? "这组车牌属于哪里？" : "这个城市或地区属于哪里？"}</p>
                  <strong>{(level === LEVEL.PLATE_PLACE ? currentCity?.plate : currentCity?.city) ?? "载入中…"}</strong>
                  {level === LEVEL.PLATE_PLACE ? <small>请在一个输入框中连写省份和城市/地区</small> : null}
                </div>
              )}
            </div>

            <aside className="gauntlet-answer-panel">
              <p className="eyebrow">你的答案</p>
              {answerReview ? (
                <AnswerReviewPanel
                  review={answerReview}
                  onContinue={continueAfterReview}
                />
              ) : level === LEVEL.PROVINCE_PUZZLE ? (
                <>
                  <h2>放回正确的省份位置</h2>
                  <p className="map-answer-summary">把左侧上方的轮廓拖到地图；手机端或键盘操作可以直接点击目标省份。</p>
                  <div className="puzzle-progress-dots" aria-label={`已完成 ${mapSelections.size} 块拼图`}>
                    {Array.from({ length: target }, (_, index) => (
                      <i key={index} className={index < mapSelections.size ? "is-done" : ""} />
                    ))}
                  </div>
                </>
              ) : level === LEVEL.CITY_UNDERCOVER ? (
                <>
                  <h2>哪座城市不属于同一省？</h2>
                  <div className="gauntlet-option-grid">
                    {currentUndercoverQuestion?.options.map((item) => (
                      <button key={item.city} type="button" onClick={() => answerOptionQuestion(item.city)}>
                        {item.city}
                      </button>
                    ))}
                  </div>
                </>
              ) : level === LEVEL.REGION_MAP ? (
                <>
                  <h2>在左侧省内地图落点</h2>
                  <p className="map-answer-summary">地图不显示名称；市、自治州、地区、盟、区县等区块都会出题，点击后立即判题。</p>
                  <p className="map-answer-summary">
                    当前范围共 {mapRegionPoolSize} 个地图区块，本轮需连续答对 {target} 题。系统会优先避开最近 {CITY_MAP_RECENT_QUESTION_LIMIT} 道题；答错后会重新打散下一轮。
                  </p>
                </>
              ) : level === LEVEL.TERRITORY_GROUPS ? (
                <>
                  <h2>选出完整的省份集合</h2>
                  <p className="map-answer-summary">已选 {mapSelections.size} 个省级行政区。可以再次点击取消。</p>
                  <button
                    className="gauntlet-primary-action"
                    type="button"
                    disabled={mapSelections.size === 0}
                    onClick={submitProvinceGroup}
                  >
                    确认选择
                  </button>
                </>
              ) : level === LEVEL.PROVINCE_SHORTEST_ROUTE ? (
                <>
                  <h2>沿陆地邻省走到终点</h2>
                  <p className="map-answer-summary">路线不能重复省份。抵达终点后，系统会检查是否为最短路径。</p>
                  <ol className="province-route" aria-label="当前最短路线尝试">
                    {routeCodes.map((code, index) => (
                      <li key={code}>
                        <span>{index + 1}</span>
                        {PROVINCE_BY_CODE.get(code)?.shortName}
                      </li>
                    ))}
                  </ol>
                </>
              ) : level === LEVEL.GEOGRAPHY_ELIMINATION ? (
                <>
                  <h2>{currentDualIntruderQuestion?.instruction}</h2>
                  <div className="gauntlet-option-grid">
                    {currentDualIntruderQuestion?.options.map((item) => (
                      <button key={item} type="button" onClick={() => answerOptionQuestion(item)}>
                        {item}
                      </button>
                    ))}
                  </div>
                </>
              ) : level === LEVEL.PLATE_FAULT ? (
                <>
                  <h2>点击对应错误的一组</h2>
                  <div className="gauntlet-option-grid plate-fault-options">
                    {currentPlateFaultQuestion?.options.map((item) => (
                      <button key={item.id} type="button" onClick={() => answerOptionQuestion(item.id)}>
                        {item.label}
                      </button>
                    ))}
                  </div>
                </>
              ) : level === LEVEL.UNIVERSITY_CITY ? (
                <>
                  <h2>写出这所大学所在的城市</h2>
                  <form onSubmit={submitAnswer}>
                    <label htmlFor="gauntlet-university-city-answer">城市名称</label>
                    <input
                      ref={provinceInputRef}
                      id="gauntlet-university-city-answer"
                      value={provinceAnswer}
                      onChange={(event) => setProvinceAnswer(event.target.value)}
                      placeholder="例如：南京市"
                      autoComplete="off"
                    />
                    <button type="submit" disabled={!provinceAnswer.trim()}>提交答案</button>
                  </form>
                </>
              ) : level === LEVEL.MISTAKE_REVENGE ? (
                currentMistake ? (
                  <>
                    <h2>重新提交这道历史错题</h2>
                    <form onSubmit={submitAnswer}>
                      <label htmlFor="gauntlet-mistake-answer">答案</label>
                      <input
                        ref={provinceInputRef}
                        id="gauntlet-mistake-answer"
                        value={provinceAnswer}
                        onChange={(event) => setProvinceAnswer(event.target.value)}
                        placeholder="输入省份、城市、车牌或判断结果"
                        autoComplete="off"
                      />
                      <button type="submit" disabled={!provinceAnswer.trim()}>提交答案</button>
                    </form>
                  </>
                ) : (
                  <>
                    <h2>错题库已经是空的</h2>
                    <p className="map-answer-summary">返回选关继续挑战；之后出现的新错题会自动加入本关。</p>
                    <button type="button" className="gauntlet-primary-action" onClick={returnToLevels}>
                      返回选关
                    </button>
                  </>
                )
              ) : level === LEVEL.CONFUSABLE_CITIES ? (
                <>
                  <h2>选择正确答案</h2>
                  <div className="gauntlet-option-grid confusable-options">
                    {currentConfusableQuestion?.options.map((item) => (
                      <button key={item} type="button" onClick={() => answerOptionQuestion(item)}>
                        {item}
                      </button>
                    ))}
                  </div>
                </>
              ) : level === LEVEL.CITY_SHORTEST_ROUTE ? (
                <>
                  <h2>依次点击接壤的市级区块</h2>
                  <p className="map-answer-summary">地图显示市级名称；路线不能重复，抵达终点后会检查是否为最短路径。</p>
                  <ol className="province-route city-route-list" aria-label="当前省内路线">
                    {cityRouteNames.map((name, index) => (
                      <li key={name}>
                        <span>{index + 1}</span>
                        {stripAdministrativeSuffix(name)}
                      </li>
                    ))}
                  </ol>
                </>
              ) : level === LEVEL.PROVINCE_CITY_COUNT ? (
                <>
                  <h2>这里有多少座地级及以上城市？</h2>
                  <form onSubmit={submitAnswer}>
                    <label htmlFor="gauntlet-city-count-answer">城市数量</label>
                    <input
                      ref={provinceInputRef}
                      id="gauntlet-city-count-answer"
                      value={provinceAnswer}
                      onChange={(event) => setProvinceAnswer(event.target.value)}
                      placeholder="例如：13"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="off"
                    />
                    <button type="submit" disabled={!provinceAnswer.trim()}>提交答案</button>
                  </form>
                  <p className="map-answer-summary">只需填写数字；自治州、地区、盟和省直辖县级市不计入城市数。</p>
                </>
              ) : level === LEVEL.PLATE_CITY_MAP ? (
                <>
                  <h2>
                    {plateCityMapFocusedProvince
                      ? "在放大地图中选择城市"
                      : "直接选城市，或先放大省份"}
                  </h2>
                  <p className="map-answer-summary">
                    点击城市区块会立即判题；点击每张地图右上角的“放大”只会进入该省，不会判错。
                  </p>
                  {plateCityMapFocusedProvince ? (
                    <p className="map-answer-summary">
                      如果省份没选对，可以返回地图墙重新选择，期间不会影响连胜。
                    </p>
                  ) : null}
                  <p className="map-answer-summary">
                    当前范围共 {selectedCityMapProvinces.length} 个省份、{cityPoolSize} 个城市或地区，优先避开最近 90 道题。
                  </p>
                </>
              ) : level === LEVEL.FINAL_BOSS ? (
                <>
                  <h2>
                    {currentBossQuestion?.kind === "truth"
                      ? "判断这句话的真伪"
                      : currentBossQuestion?.kind === "map"
                        ? "在左侧地图直接落点"
                        : "提交本题答案"}
                  </h2>
                  {currentBossQuestion?.kind === "truth" ? (
                    <div className="truth-actions">
                      <button type="button" onClick={() => answerBossTruth(true)}><span>✓</span> 正确</button>
                      <button type="button" onClick={() => answerBossTruth(false)}><span>×</span> 错误</button>
                    </div>
                  ) : currentBossQuestion?.kind === "map" ? (
                    <p className="map-answer-summary">点击一个省级行政区后立即判题。答错会失去一条生命。</p>
                  ) : (
                    <form onSubmit={submitAnswer}>
                      <label htmlFor="gauntlet-boss-answer">答案</label>
                      <input
                        ref={provinceInputRef}
                        id="gauntlet-boss-answer"
                        value={provinceAnswer}
                        onChange={(event) => setProvinceAnswer(event.target.value)}
                        placeholder="输入省份、城市或车牌前缀"
                        autoComplete="off"
                      />
                      <button type="submit" disabled={!provinceAnswer.trim()}>提交答案</button>
                    </form>
                  )}
                </>
              ) : level === LEVEL.PROVINCE_NEIGHBORS ? (
                <>
                  <h2>选出全部陆地邻省</h2>
                  <div className="gauntlet-option-grid neighbor-text-options">
                    {PROVINCES.filter(
                      (item) => item.code !== currentChallengeProvince?.code,
                    ).map((item) => {
                      const selected = mapSelections.has(item.code);
                      return (
                        <button
                          key={item.code}
                          className={selected ? "is-selected" : ""}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => handleGauntletProvince(item)}
                        >
                          {item.shortName}
                        </button>
                      );
                    })}
                  </div>
                  <p className="map-answer-summary">
                    已选 {mapSelections.size} 个：
                    {Array.from(mapSelections)
                      .map((code) => PROVINCE_BY_CODE.get(code)?.shortName)
                      .filter(Boolean)
                      .join("、") || "暂未选择"}
                  </p>
                  <button
                    className="gauntlet-primary-action"
                    type="button"
                    disabled={mapSelections.size === 0}
                    onClick={submitNeighborSelection}
                  >
                    确认包围圈
                  </button>
                </>
              ) : level === LEVEL.CITY_MAP ? (
                <>
                  <h2>在左侧地图直接落点</h2>
                  <p className="map-answer-summary">地图不显示省份名称。点击一个省级行政区后会立即判题，并自动进入下一题。</p>
                </>
              ) : level === LEVEL.TRUTH_FLASH ? (
                <>
                  <h2>这句话是真的吗？</h2>
                  <div className="truth-actions">
                    <button type="button" onClick={() => answerTruthQuestion(true)}>
                      <span aria-hidden="true">✓</span> 正确
                    </button>
                    <button type="button" onClick={() => answerTruthQuestion(false)}>
                      <span aria-hidden="true">×</span> 错误
                    </button>
                  </div>
                </>
              ) : level === LEVEL.NEIGHBOR_CHAIN ? (
                <>
                  <h2>选择下一个陆地邻省</h2>
                  <p className="map-answer-summary">走过的省份不能重复。选错或走进死路会随机重置起点。</p>
                  <ol className="province-route" aria-label="当前邻省路线">
                    {routeCodes.map((code, index) => (
                      <li key={code}>
                        <span>{index + 1}</span>
                        {PROVINCE_BY_CODE.get(code)?.shortName}
                      </li>
                    ))}
                  </ol>
                </>
              ) : (
                <>
                  <h2>
                    {level === LEVEL.PROVINCE_SHAPE
                      ? "这是哪个省级行政区？"
                      : level === LEVEL.PLATE_COMPLETION
                        ? "填入缺失的车牌字母"
                        : level === LEVEL.PLATE_PLACE
                          ? "写出对应省份和城市/地区"
                          : "写出所属省份"}
                  </h2>
                  <form onSubmit={submitAnswer}>
                    {level === LEVEL.PLATE_COMPLETION ? (
                      <>
                        <label htmlFor="gauntlet-plate-answer">全部车牌字母</label>
                        <input
                          ref={provinceInputRef}
                          id="gauntlet-plate-answer"
                          value={plateAnswer}
                          onChange={(event) => setPlateAnswer(event.target.value)}
                          placeholder={
                            currentCity && currentCity.plates.length > 1
                              ? "例如：A、S"
                              : "例如：A"
                          }
                          autoComplete="off"
                          maxLength={32}
                        />
                      </>
                    ) : (
                      <>
                        <label htmlFor="gauntlet-province-answer">
                          {level === LEVEL.PLATE_PLACE ? "省份和城市/地区" : "省份名称"}
                        </label>
                        <input
                          ref={provinceInputRef}
                          id="gauntlet-province-answer"
                          value={provinceAnswer}
                          onChange={(event) => setProvinceAnswer(event.target.value)}
                          placeholder={
                            level === LEVEL.PLATE_PLACE
                              ? "例如：浙江宁波"
                              : level === LEVEL.PROVINCE_SHAPE
                                ? "例如：江苏省"
                                : "例如：江苏"
                          }
                          autoComplete="off"
                        />
                      </>
                    )}
                    <button
                      type="submit"
                      disabled={level === LEVEL.PLATE_COMPLETION ? !plateAnswer.trim() : !provinceAnswer.trim()}
                    >
                      提交答案
                    </button>
                  </form>
                </>
              )}
              {!answerReview ? (
                <>
                  <p className={`gauntlet-feedback is-${feedbackType}`} aria-live="polite">
                    {feedback}
                  </p>
                  {STREAK_NOTE_LEVELS.has(level) &&
                  (level !== LEVEL.MISTAKE_REVENGE || Boolean(currentMistake)) ? (
                    <p className="streak-note">答对后自动进入下一题；答错才会展示正确答案与知识解释。</p>
                  ) : null}
                </>
              ) : null}
            </aside>
          </section>
        </>
      )}

      {provincePickerOpen ? (
        <div className="province-picker-overlay" role="presentation">
          <section
            className="province-picker-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="province-picker-title"
          >
            <button
              className="province-picker-close"
              type="button"
              aria-label="关闭省份选择"
              onClick={() => setProvincePickerOpen(false)}
            >
              ×
            </button>
            <p className="eyebrow">过关斩将 · 全局设置</p>
            <h2 id="province-picker-title">统一选择省份范围（可多选）</h2>
            <p className="province-picker-hint">
              保存后，辨轮廓、城市、车牌、大学与地图落点等关卡都会自动使用这套范围，下次进入无需重选。邻省连锁、疆域集合、最短省际路线、错题复仇、易混城市和终极混战仍使用各自的全国固定题库。
            </p>
            <div className="province-picker-tools">
              <button
                type="button"
                onClick={selectAllPickerProvinces}
              >
                全选
              </button>
              <button type="button" onClick={clearPickerProvinces}>
                清空
              </button>
              <span>已选 {draftShapeProvinceCodes.size} / {provincePickerOptions.length}</span>
            </div>
            <div className="province-picker-grid">
              {provincePickerOptions.map((item) => {
                const selected = draftShapeProvinceCodes.has(item.key);
                return (
                  <button
                    key={item.key}
                    className={selected ? "is-selected" : ""}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleDraftProvince(item.key)}
                  >
                    <span>{selected ? "✓" : ""}</span>
                    <strong>{item.shortName}</strong>
                    <small>
                      {item.cityCount > 0
                        ? item.cityCount === item.plateCount &&
                            item.cityCount === item.mapRegionCount
                          ? `${item.cityCount} 个城市题`
                          : `${item.cityCount} 城 · ${item.plateCount} 车牌 · ${item.mapRegionCount} 区块`
                        : `${item.kind} · ${item.mapRegionCount} 区块`}
                    </small>
                  </button>
                );
              })}
            </div>
            <div className="province-picker-footer">
              <p>
                {draftShapeProvinceCodes.size === 0
                  ? "请至少选择一个省份"
                  : identity
                    ? "保存后会写入当前玩家存档并同步到云端"
                    : "试玩状态仅本次有效，登录后可长期保存"}
              </p>
              <button
                type="button"
                disabled={!draftSelectionValid}
                onClick={applyProvinceSelection}
              >
                保存范围
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

export default function CityGame() {
  const { identity, progressStorage, syncStatus } = usePlayerData();
  const [gauntletOpen, setGauntletOpen] = useState(false);
  const [atlasOpen, setAtlasOpen] = useState(false);
  const [knowledgeOpen, setKnowledgeOpen] = useState(false);
  const [province, setProvince] = useState<Province | null>(null);
  const [hardMode, setHardMode] = useState(false);
  const [neighborMode, setNeighborMode] = useState(false);
  const [showAllProvinceNames, setShowAllProvinceNames] = useState(false);
  const [showAllCityNames, setShowAllCityNames] = useState(false);
  const [hiddenProvinceCodes, setHiddenProvinceCodes] = useState<Set<string>>(
    new Set(),
  );
  const [completedNames, setCompletedNames] = useState<Set<string>>(new Set());
  const [completedProvinceCodes, setCompletedProvinceCodes] = useState<Set<string>>(
    new Set(),
  );
  const [completedNeighborCodes, setCompletedNeighborCodes] = useState<Set<string>>(
    new Set(),
  );
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hoveredName, setHoveredName] = useState<string | null>(null);
  const [wrongRegion, setWrongRegion] = useState<string | null>(null);
  const [message, setMessage] = useState("请选择一个省级行政区开始挑战");
  const [attempts, setAttempts] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [showAllProvinces, setShowAllProvinces] = useState(false);
  const [pendingFeature, setPendingFeature] = useState<MapFeature | null>(null);
  const [manualAnswer, setManualAnswer] = useState("");
  const [manualError, setManualError] = useState("");
  const [dragGhost, setDragGhost] = useState<{
    name: string;
    x: number;
    y: number;
  } | null>(null);
  const progressRef = useRef<Record<string, string[]>>({});
  const neighborProgressRef = useRef<Record<string, string[]>>({});
  const manualAnswerInputRef = useRef<HTMLInputElement>(null);
  const touchDragRef = useRef<{
    name: string;
    startX: number;
    startY: number;
  } | null>(null);

  const { data: nationalMap, error: nationalError } = useMapData("100000");
  const { data: atlasMap, error: atlasError } = useMapCollection(
    atlasOpen ? ALL_PROVINCE_CODES : [],
  );
  const challengeProvinces = useMemo(() => {
    if (!province) return [];
    const codes = neighborMode
      ? [province.code, ...(PROVINCE_NEIGHBORS[province.code] ?? [])]
      : [province.code];
    return codes
      .map((code) => PROVINCE_BY_CODE.get(code))
      .filter((item): item is Province => Boolean(item));
  }, [neighborMode, province]);
  const challengeCodes = useMemo(
    () => challengeProvinces.map((item) => item.code),
    [challengeProvinces],
  );
  const { data: detailMap, error: detailError } = useMapCollection(challengeCodes);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const saved = JSON.parse(progressStorage.getItem(STORAGE_KEY) ?? "{}") as Record<
          string,
          string[]
        >;
        progressRef.current = saved;
        const savedHardMode = progressStorage.getItem(HARD_MODE_KEY) === "true";
        const savedNeighborMode = progressStorage.getItem(NEIGHBOR_MODE_KEY) === "true";
        const savedNeighborProgress = JSON.parse(
          progressStorage.getItem(NEIGHBOR_PROGRESS_KEY) ?? "{}",
        ) as Record<string, string[]>;
        neighborProgressRef.current = savedNeighborProgress;
        setHardMode(savedHardMode);
        setNeighborMode(savedNeighborMode);
        if (savedHardMode || savedNeighborMode) {
          setMessage(nationalChallengeMessage(savedHardMode, savedNeighborMode));
        }
        setCompletedProvinceCodes(
          new Set(
            PROVINCES.filter(
              (item) => saved[item.code]?.length && saved[item.code][0] === "__complete__",
            ).map((item) => item.code),
          ),
        );
        setCompletedNeighborCodes(
          new Set(
            PROVINCES.filter(
              (item) =>
                savedNeighborProgress[item.code]?.length &&
                savedNeighborProgress[item.code][0] === "__complete__",
            ).map((item) => item.code),
          ),
        );
      } catch {
        progressRef.current = {};
        neighborProgressRef.current = {};
      }
    });

    return () => {
      cancelled = true;
    };
  }, [progressStorage]);

  useEffect(() => {
    if (!pendingFeature) return;
    const frame = window.requestAnimationFrame(() => manualAnswerInputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [pendingFeature]);

  const answerNames = useMemo(
    () => detailMap?.features.map((feature) => feature.properties.name) ?? [],
    [detailMap],
  );

  const shuffledAnswers = useMemo(
    () =>
      deterministicShuffle(
        answerNames,
        `${province?.code ?? "1"}${neighborMode ? "7" : ""}`,
      ),
    [answerNames, neighborMode, province?.code],
  );
  const answerProvinceCodes = useMemo(
    () =>
      new Map(
        detailMap?.features.map((feature) => [
          feature.properties.name,
          feature.properties.provinceCode ?? "",
        ]) ?? [],
      ),
    [detailMap],
  );
  const visibleShuffledAnswers = useMemo(
    () =>
      shuffledAnswers.filter(
        (name) => !hiddenProvinceCodes.has(answerProvinceCodes.get(name) ?? ""),
      ),
    [answerProvinceCodes, hiddenProvinceCodes, shuffledAnswers],
  );

  const isChallengeComplete =
    Boolean(province) &&
    answerNames.length > 0 &&
    completedNames.size === answerNames.length;

  const activeCompletedProvinceCodes = neighborMode
    ? completedNeighborCodes
    : completedProvinceCodes;

  const saveProgress = useCallback(
    (code: string, names: Set<string>, complete: boolean, joined: boolean) => {
      const progress = joined ? neighborProgressRef.current : progressRef.current;
      progress[code] = complete
        ? ["__complete__", ...Array.from(names)]
        : Array.from(names);
      progressStorage.setItem(
        joined ? NEIGHBOR_PROGRESS_KEY : STORAGE_KEY,
        JSON.stringify(progress),
      );
    },
    [progressStorage],
  );

  const enterProvince = useCallback(
    (nextProvince: Province) => {
      setProvince(nextProvince);
      const saved = (
        neighborMode ? neighborProgressRef.current : progressRef.current
      )[nextProvince.code] ?? [];
      setCompletedNames(new Set(saved.filter((name) => name !== "__complete__")));
      setSelectedAnswer(null);
      setHoveredName(null);
      setWrongRegion(null);
      setShowAllCityNames(false);
      setHiddenProvinceCodes(new Set());
      setAttempts(0);
      setMistakes(0);
      setMessage(
        hardMode
          ? neighborMode
            ? "邻省连城：点击联合地图区块并输入名称"
            : "难度提升：点击地图区块并输入名称"
          : neighborMode
          ? `把${nextProvince.shortName}及所有邻省的城市名称送回正确位置`
          : nextProvince.kind === "直辖市"
          ? `把区县名称放到${nextProvince.shortName}地图上的正确位置`
          : `把行政区名称放到${nextProvince.shortName}地图上的正确位置`,
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [hardMode, neighborMode],
  );

  useEffect(() => {
    if (!province || !detailMap) return;
    const validNames = new Set(answerNames);
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setCompletedNames((current) =>
        new Set(Array.from(current).filter((name) => validNames.has(name))),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [answerNames, detailMap, province]);

  const handleGuess = useCallback(
    (regionName: string, answer: string | null | undefined) => {
      if (!province || !detailMap) return;
      const guess = answer || selectedAnswer;
      if (!guess) {
        setMessage("先选择下方名称，再点击地图区块；也可以直接拖拽");
        return;
      }
      if (completedNames.has(regionName)) {
        setMessage(`${regionName}已经填好啦，试试其他区块`);
        return;
      }

      setAttempts((value) => value + 1);
      if (guess !== regionName) {
        setMistakes((value) => value + 1);
        setWrongRegion(regionName);
        setMessage(`“${guess}”不在这里，再观察一下边界形状`);
        window.setTimeout(() => setWrongRegion(null), 560);
        return;
      }

      const next = new Set(completedNames);
      next.add(regionName);
      const complete = next.size === detailMap.features.length;
      setCompletedNames(next);
      setSelectedAnswer(null);
      setMessage(
        complete
          ? neighborMode
            ? `${province.shortName}邻省连城挑战全部完成！`
            : `${province.name}全部完成！`
          : `正确！${regionName}已填入地图`,
      );
      saveProgress(province.code, next, complete, neighborMode);
      if (complete) {
        if (neighborMode) {
          setCompletedNeighborCodes((current) => new Set(current).add(province.code));
        } else {
          setCompletedProvinceCodes((current) => new Set(current).add(province.code));
        }
      }
    },
    [
      completedNames,
      detailMap,
      neighborMode,
      province,
      saveProgress,
      selectedAnswer,
    ],
  );

  const handleMapRegion = (feature: MapFeature, draggedAnswer?: string) => {
    if (hardMode) {
      if (province && completedNames.has(feature.properties.name)) {
        setMessage(`${feature.properties.name}已经填好啦，试试其他区块`);
        return;
      }
      setPendingFeature(feature);
      setManualAnswer("");
      setManualError("");
      setMessage(
        province
          ? "已选中一个区块，请输入它的名称"
          : "已选中一个省级行政区，请输入名称解锁",
      );
      return;
    }
    if (!province) {
      const selectedProvince = provinceForFeature(feature);
      if (selectedProvince) enterProvince(selectedProvince);
      return;
    }
    handleGuess(feature.properties.name, draggedAnswer);
  };

  const submitManualAnswer = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pendingFeature) return;

    if (!province) {
      const selectedProvince = provinceForFeature(pendingFeature);
      if (
        selectedProvince &&
        answerMatches(manualAnswer, [selectedProvince.name, selectedProvince.shortName])
      ) {
        setPendingFeature(null);
        setManualAnswer("");
        setManualError("");
        enterProvince(selectedProvince);
        return;
      }
      setManualError("名称不正确，再观察一下它在全国地图中的位置");
      return;
    }

    const regionName = pendingFeature.properties.name;
    if (answerMatches(manualAnswer, [regionName])) {
      setPendingFeature(null);
      setManualAnswer("");
      setManualError("");
      handleGuess(regionName, regionName);
      return;
    }

    setAttempts((value) => value + 1);
    setMistakes((value) => value + 1);
    setWrongRegion(regionName);
    setManualError("名称不正确，再观察一下这个区块的形状和位置");
    window.setTimeout(() => setWrongRegion(null), 560);
  };

  const toggleHardMode = () => {
    const next = !hardMode;
    setHardMode(next);
    if (next) setShowAllProvinceNames(false);
    progressStorage.setItem(HARD_MODE_KEY, String(next));
    setPendingFeature(null);
    setManualAnswer("");
    setManualError("");
    setSelectedAnswer(null);
    setHoveredName(null);
    setMessage(
      next
        ? province
          ? neighborMode
            ? "邻省连城：点击联合地图区块并输入名称"
            : "难度提升：点击地图区块并输入名称"
          : "难度提升：点击省级行政区并输入名称解锁"
        : province
          ? neighborMode
            ? "名称卡片已恢复，完成整片联合区域吧"
            : "名称提示已恢复，可以拖拽或点选作答"
          : neighborMode
            ? "邻省连城：选择一个省份，联动它的所有接壤省份"
            : "省份名称已恢复，选择一个省级行政区开始挑战",
    );
  };

  const clearProvinceView = () => {
    setProvince(null);
    setSelectedAnswer(null);
    setHoveredName(null);
    setPendingFeature(null);
    setManualAnswer("");
    setManualError("");
    setShowAllCityNames(false);
    setHiddenProvinceCodes(new Set());
  };

  const toggleNeighborMode = () => {
    const next = !neighborMode;
    setNeighborMode(next);
    progressStorage.setItem(NEIGHBOR_MODE_KEY, String(next));
    clearProvinceView();
    setCompletedNames(new Set());
    setAttempts(0);
    setMistakes(0);
    setMessage(nationalChallengeMessage(hardMode, next));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetProvince = () => {
    if (!province) return;
    setCompletedNames(new Set());
    if (neighborMode) {
      setCompletedNeighborCodes((current) => {
        const next = new Set(current);
        next.delete(province.code);
        return next;
      });
      neighborProgressRef.current[province.code] = [];
      progressStorage.setItem(
        NEIGHBOR_PROGRESS_KEY,
        JSON.stringify(neighborProgressRef.current),
      );
    } else {
      setCompletedProvinceCodes((current) => {
        const next = new Set(current);
        next.delete(province.code);
        return next;
      });
      progressRef.current[province.code] = [];
      progressStorage.setItem(STORAGE_KEY, JSON.stringify(progressRef.current));
    }
    setSelectedAnswer(null);
    setShowAllCityNames(false);
    setHiddenProvinceCodes(new Set());
    setAttempts(0);
    setMistakes(0);
    setMessage(
      neighborMode
        ? `已重置以${province.shortName}为起点的联合挑战`
        : `已重置${province.shortName}，重新开始吧`,
    );
  };

  const backToNational = () => {
    clearProvinceView();
    setMessage(nationalChallengeMessage(hardMode, neighborMode));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleProvinceVisibility = (item: Province) => {
    const isHidden = hiddenProvinceCodes.has(item.code);
    if (!isHidden && challengeCodes.length - hiddenProvinceCodes.size <= 1) {
      setMessage("至少保留一个省份显示在联合地图中");
      return;
    }

    const next = new Set(hiddenProvinceCodes);
    if (isHidden) {
      next.delete(item.code);
      setMessage(`已重新显示${item.shortName}`);
    } else {
      next.add(item.code);
      if (selectedAnswer && answerProvinceCodes.get(selectedAnswer) === item.code) {
        setSelectedAnswer(null);
      }
      setMessage(`已隐藏${item.shortName}，再次点击名称可恢复`);
    }
    setHoveredName(null);
    setHiddenProvinceCodes(next);
  };

  const visibleProvinceList = showAllProvinces
    ? PROVINCES
    : PROVINCES.filter((item) => !activeCompletedProvinceCodes.has(item.code));

  const outlineFeatures =
    nationalMap?.features.filter((feature) => {
      const featureProvince = provinceForFeature(feature);
      return Boolean(
        featureProvince && challengeCodes.includes(featureProvince.code),
      );
    }) ?? [];
  const provinceFillColors = useMemo(
    () =>
      Object.fromEntries(
        challengeProvinces.map((item, index) => [
          item.code,
          PROVINCE_FILL_COLORS[index % PROVINCE_FILL_COLORS.length],
        ]),
      ),
    [challengeProvinces],
  );

  const mapError = province ? detailError : nationalError;
  const activeMap = province ? detailMap : nationalMap;
  const accuracy = attempts === 0 ? 100 : Math.round(((attempts - mistakes) / attempts) * 100);

  if (atlasOpen) {
    return (
      <NationalCityAtlas
        map={atlasMap}
        nationalMap={nationalMap}
        error={atlasError || nationalError}
        onExit={() => setAtlasOpen(false)}
      />
    );
  }

  if (knowledgeOpen) {
    return (
      <Suspense fallback={<main className="game-shell"><LoadingMap /></main>}>
        <KnowledgeBase
          provinces={PROVINCES}
          provinceCapitals={PROVINCE_CAPITALS}
          provinceNeighbors={PROVINCE_NEIGHBORS}
          provincePlatePrefixes={PROVINCE_PLATE_PREFIXES}
          provinceGroups={PROVINCE_GROUP_QUESTIONS}
          onExit={() => setKnowledgeOpen(false)}
          onOpenAtlas={() => {
            setKnowledgeOpen(false);
            setAtlasOpen(true);
          }}
        />
      </Suspense>
    );
  }

  if (gauntletOpen) {
    return (
      <GauntletGame
        nationalMap={nationalMap}
        nationalError={nationalError}
        onExit={() => setGauntletOpen(false)}
      />
    );
  }

  return (
    <main className={`game-shell ${hardMode ? "is-hard-mode" : ""} ${neighborMode ? "is-neighbor-mode" : ""}`}>
      <header className="site-header">
        <button className="brand" type="button" onClick={backToNational}>
          <span className="brand-seal" aria-hidden="true">城</span>
          <span>
            <strong>中国城市填充挑战</strong>
            <small>CHINA CITY ATLAS</small>
          </span>
        </button>
        <div className="header-actions">
          {!province ? (
            <>
              <button
                className="atlas-mode-button"
                type="button"
                onClick={() => setAtlasOpen(true)}
              >
                <span aria-hidden="true">图</span>
                全国车牌图鉴
              </button>
              <button
                className="knowledge-mode-button"
                type="button"
                onClick={() => setKnowledgeOpen(true)}
              >
                <span aria-hidden="true">知</span>
                地理知识馆
              </button>
              <button
                className="gauntlet-mode-button"
                type="button"
                onClick={() => setGauntletOpen(true)}
              >
                <span aria-hidden="true">关</span>
                过关斩将
              </button>
            </>
          ) : null}
          <button
            className={`neighbor-mode-button ${neighborMode ? "is-active" : ""}`}
            type="button"
            aria-pressed={neighborMode}
            onClick={toggleNeighborMode}
          >
            <span aria-hidden="true">联</span>
            邻省连城
            {neighborMode ? <i>已开启</i> : null}
          </button>
          <button
            className={`difficulty-button ${hardMode ? "is-active" : ""}`}
            type="button"
            aria-pressed={hardMode}
            onClick={toggleHardMode}
          >
            <span aria-hidden="true">↑</span>
            难度提升
            {hardMode ? <i>已开启</i> : null}
          </button>
          <div className="national-progress" aria-label={`已完成 ${activeCompletedProvinceCodes.size} 个挑战`}>
            <span>{neighborMode ? "联挑战进度" : "全国进度"}</span>
            <strong>{activeCompletedProvinceCodes.size}<i>/34</i></strong>
            <div className="progress-track" aria-hidden="true">
              <span style={{ width: `${(activeCompletedProvinceCodes.size / 34) * 100}%` }} />
            </div>
          </div>
        </div>
      </header>

      <section className="intro-row">
        <div>
          <p className="eyebrow">拖动 · 辨认 · 探索</p>
          <h1>
            {province ? (
              neighborMode ? (
                <><span>{province.shortName}</span>与邻省，连城共答</>
              ) : (
                <><span>{province.shortName}</span>，你认识多少座城？</>
              )
            ) : (
              neighborMode
                ? <>选一省，连起它周围的每一座城</>
                : <>从一省出发，拼出整幅中国城市地图</>
            )}
          </h1>
          <p className="lede">
            {province
              ? neighborMode
                ? `当前联合区域包含 ${challengeProvinces.map((item) => item.shortName).join("、")}，共 ${answerNames.length || "…"} 个城市或区县。${hardMode ? "点击区块并手动输入名称。" : "拖拽或点选名称完成整片区域。"}`
                : hardMode
                ? `点击地图中的任一区块，手动输入它的名称。完成 ${province.name} 的全部 ${answerNames.length || "…"} 个区域即可点亮印章。`
                : province.kind === "直辖市"
                ? `将下方的区县名称拖到地图中。完成 ${province.name} 的全部 ${answerNames.length || "…"} 个区县即可点亮印章。`
                : `将下方的行政区名称拖到地图中。完成 ${province.name} 的全部 ${answerNames.length || "…"} 个区域即可点亮印章。`
              : hardMode
                ? "省份名称已隐藏。点击地图中的省级行政区，手动输入名称，回答正确后才能解锁省内挑战。"
                : neighborMode
                  ? "点击任一省份，把它和所有陆地接壤省份展开成联合地图，一次填完区域内全部城市。"
                  : "点击地图或省份名进入挑战。红色标出省级边界，进入省内后，绿色标出地市或区县边界。"}
          </p>
        </div>
        <div className="legend-card" aria-label="地图图例">
          <p><span className="legend-line legend-line--red" />省级边界</p>
          <p><span className="legend-line legend-line--green" />地市 / 区县边界</p>
          <p><span className="legend-fill" />已正确填入</p>
        </div>
      </section>

      {isChallengeComplete && province ? (
        <section className="success-banner" aria-live="polite">
          <span className="success-kicker">挑战达成</span>
          <strong>{neighborMode ? `${province.shortName}邻省连城` : province.name}</strong>
          <span className="success-icon" aria-label="成功">✓</span>
          <p>这片区域的每一个名字，都已回到正确的位置。</p>
        </section>
      ) : null}

      <div className={`challenge-layout ${province ? "" : "is-national"} ${neighborMode ? "is-joined" : ""}`}>
      <section className="map-card">
        <div className="map-toolbar">
          <div>
            {province ? (
              <button className="back-button" type="button" onClick={backToNational}>
                <span aria-hidden="true">←</span> 返回全国地图
              </button>
            ) : (
              <span className="map-step">
                {hardMode
                  ? "第一步 · 辨认并解锁省份"
                  : neighborMode
                    ? "第一步 · 选择联合区域的起点"
                    : "第一步 · 选择省级行政区"}
              </span>
            )}
          </div>
          <div className="map-status" aria-live="polite">
            <span className={`status-dot ${isChallengeComplete ? "is-complete" : ""}`} />
            {hoveredName && !province && !hardMode
              ? hoveredName
              : hoveredName && completedNames.has(hoveredName)
                ? `已填入：${hoveredName}`
                : message}
          </div>
          {province ? (
            <div className="map-actions">
              <button
                className={`reveal-cities-button ${showAllCityNames ? "is-active" : ""}`}
                type="button"
                aria-pressed={showAllCityNames}
                onClick={() => setShowAllCityNames((value) => !value)}
              >
                {showAllCityNames ? "隐藏全部城市" : "显示全部城市"}
              </button>
              <button className="reset-button" type="button" onClick={resetProvince}>
                重新挑战
              </button>
            </div>
          ) : (
            <div className="map-overview-actions">
              {!hardMode ? (
                <button
                  className={`reveal-cities-button province-label-toggle ${showAllProvinceNames ? "is-active" : ""}`}
                  type="button"
                  aria-pressed={showAllProvinceNames}
                  onClick={() => setShowAllProvinceNames((value) => !value)}
                >
                  <span aria-hidden="true">名</span>
                  {showAllProvinceNames ? "隐藏省名" : "省名标注"}
                </button>
              ) : null}
              <span className="map-total">
                {neighborMode ? "选择一省 · 联动接壤省份" : "34 个省级行政区"}
              </span>
            </div>
          )}
        </div>

        {province && neighborMode ? (
          <div className="joined-province-strip" aria-label="本轮联合区域">
            <strong>本轮区域 · 点击名称可隐藏</strong>
            {challengeProvinces.map((item, index) => (
              <button
                key={item.code}
                type="button"
                className={`${index === 0 ? "is-origin" : ""} ${hiddenProvinceCodes.has(item.code) ? "is-hidden" : ""}`}
                aria-pressed={!hiddenProvinceCodes.has(item.code)}
                aria-label={`${hiddenProvinceCodes.has(item.code) ? "显示" : "隐藏"}${item.name}`}
                onClick={() => toggleProvinceVisibility(item)}
              >
                <b className="province-visibility-mark" aria-hidden="true">
                  {hiddenProvinceCodes.has(item.code) ? "○" : "●"}
                </b>
                {showAllCityNames ? (
                  <b
                    className="province-color-dot"
                    style={{ backgroundColor: provinceFillColors[item.code] }}
                    aria-hidden="true"
                  />
                ) : null}
                {item.shortName}{index === 0 ? <i>起点</i> : null}
              </button>
            ))}
          </div>
        ) : null}

        <div className="map-stage">
          <div className="map-corner map-corner--top" aria-hidden="true" />
          <div className="map-corner map-corner--bottom" aria-hidden="true" />
          {mapError ? (
            <div className="map-error" role="alert">
              <strong>地图没有成功展开</strong>
              <p>请刷新页面后重试。</p>
            </div>
          ) : activeMap ? (
            <MapCanvas
              map={activeMap}
              mode={province ? "detail" : "national"}
              completedNames={completedNames}
              completedProvinceCodes={activeCompletedProvinceCodes}
              selectedAnswer={selectedAnswer}
              wrongRegion={wrongRegion}
              provinceOutlines={outlineFeatures}
              provinceFillColors={provinceFillColors}
              onRegion={handleMapRegion}
              onHover={setHoveredName}
              hideProvinceNames={hardMode}
              showAllLabels={province ? showAllCityNames : showAllProvinceNames}
              joined={neighborMode && Boolean(province)}
              hiddenProvinceCodes={hiddenProvinceCodes}
            />
          ) : (
            <LoadingMap />
          )}
        </div>

        {province ? (
          <div className="round-stats">
            <div><span>已填入</span><strong>{completedNames.size}<i> / {answerNames.length}</i></strong></div>
            <div><span>正确率</span><strong>{accuracy}<i>%</i></strong></div>
            <div><span>待归位</span><strong>{Math.max(answerNames.length - completedNames.size, 0)}</strong></div>
          </div>
        ) : null}
      </section>

      {province ? (
        hardMode ? (
          <section className="answer-dock hard-mode-dock" aria-labelledby="hard-city-title">
            <div className="dock-heading">
              <div>
                <p className="eyebrow">{neighborMode ? "邻省连城 · 无提示" : "无提示模式"}</p>
                <h2 id="hard-city-title">点区块，写名称</h2>
              </div>
            </div>
            <div className="hard-mode-card">
              <span className="hard-mode-mark" aria-hidden="true">?</span>
              <strong>城市名称已全部隐藏</strong>
              <p>
                {neighborMode
                  ? `从 ${challengeProvinces.length} 个省级行政区的联合地图中挑选区块，输入城市、地区或区县名称。`
                  : "从地图中挑选一个尚未填充的区块，输入它的城市、地区或区县名称。"}
              </p>
              <ol>
                <li><i>1</i> 点击地图区块</li>
                <li><i>2</i> 手动输入名称</li>
                <li><i>3</i> 回答正确后填入地图</li>
              </ol>
            </div>
            <div className="hard-mode-summary">
              <span>已识别</span>
              <strong>{completedNames.size}<i> / {answerNames.length}</i></strong>
            </div>
          </section>
        ) : (
        <section className="answer-dock" aria-labelledby="answer-title">
          <div className="dock-heading">
              <div>
              <p className="eyebrow">{neighborMode ? `${challengeProvinces.length} 省连城` : "名称卡片"}</p>
              <h2 id="answer-title">{neighborMode ? "让群城各归其位" : "把名字送回地图"}</h2>
            </div>
            <p><span className="mouse-mark" aria-hidden="true">↖</span> 拖拽到区块，或先点名称再点地图</p>
          </div>
          <div className="answer-grid">
            {visibleShuffledAnswers.map((name) => {
              const isPlaced = completedNames.has(name);
              const isSelected = selectedAnswer === name;
              return (
                <button
                  key={name}
                  type="button"
                  className={`answer-chip ${isPlaced ? "is-placed" : ""} ${isSelected ? "is-selected" : ""}`}
                  draggable={!isPlaced}
                  disabled={isPlaced}
                  aria-pressed={isSelected}
                  onClick={() => {
                    if (!isPlaced) {
                      setSelectedAnswer(isSelected ? null : name);
                      setMessage(isSelected ? "已取消选择" : `已选择“${name}”，请点击地图中的位置`);
                    }
                  }}
                  onDragStart={(event) => {
                    event.dataTransfer.setData("text/plain", name);
                    event.dataTransfer.effectAllowed = "move";
                    setSelectedAnswer(name);
                  }}
                  onDragEnd={() => setDragGhost(null)}
                  onPointerDown={(event) => {
                    if (isPlaced || event.pointerType !== "touch") return;
                    event.currentTarget.setPointerCapture(event.pointerId);
                    touchDragRef.current = {
                      name,
                      startX: event.clientX,
                      startY: event.clientY,
                    };
                    setDragGhost({ name, x: event.clientX, y: event.clientY });
                  }}
                  onPointerMove={(event) => {
                    if (!touchDragRef.current || event.pointerType !== "touch") return;
                    setDragGhost({ name, x: event.clientX, y: event.clientY });
                  }}
                  onPointerUp={(event) => {
                    const drag = touchDragRef.current;
                    if (!drag || event.pointerType !== "touch") return;
                    const distance = Math.hypot(
                      event.clientX - drag.startX,
                      event.clientY - drag.startY,
                    );
                    touchDragRef.current = null;
                    setDragGhost(null);
                    if (distance < 12) return;
                    const target = document
                      .elementFromPoint(event.clientX, event.clientY)
                      ?.closest<SVGPathElement>("[data-region-name]");
                    if (target?.dataset.regionName) {
                      handleGuess(target.dataset.regionName, drag.name);
                    } else {
                      setMessage(`“${drag.name}”没有落在地图区块上，已回到名称区`);
                    }
                  }}
                >
                  <span className="chip-grip" aria-hidden="true">⠿</span>
                  <span>{name}</span>
                  {isPlaced ? <b aria-label="已完成">✓</b> : null}
                </button>
              );
            })}
          </div>
        </section>
        )
      ) : (
        hardMode ? (
          <section className="province-dock hard-mode-dock" aria-labelledby="hard-province-title">
            <div className="dock-heading">
              <div>
                <p className="eyebrow">无提示模式</p>
                <h2 id="hard-province-title">辨认 34 个省份</h2>
              </div>
            </div>
            <div className="hard-mode-card">
              <span className="hard-mode-mark" aria-hidden="true">?</span>
              <strong>省份名称已全部隐藏</strong>
              <p>
                点击全国地图中的任一区块，输入省份名称。回答正确后
                {neighborMode ? "展开它与接壤省份的联合挑战" : "进入该省挑战"}。
              </p>
            </div>
            <div className="blind-progress" aria-label={`已完成 ${activeCompletedProvinceCodes.size} 个挑战`}>
              {PROVINCES.map((item, index) => (
                <span
                  key={item.code}
                  className={activeCompletedProvinceCodes.has(item.code) ? "is-complete" : ""}
                  aria-label={`进度位 ${index + 1}${activeCompletedProvinceCodes.has(item.code) ? "，已完成" : "，未完成"}`}
                >
                  {activeCompletedProvinceCodes.has(item.code) ? "✓" : index + 1}
                </span>
              ))}
            </div>
          </section>
        ) : (
        <section className="province-dock" aria-labelledby="province-title">
          <div className="dock-heading">
            <div>
              <p className="eyebrow">34 个省级行政区</p>
              <h2 id="province-title">{neighborMode ? "选择连城起点" : "也可以从名称进入"}</h2>
            </div>
            <button
              className="text-button"
              type="button"
              onClick={() => setShowAllProvinces((value) => !value)}
            >
              {showAllProvinces ? "只看未完成" : "查看全部"}
            </button>
          </div>
          <div className="province-grid">
            {visibleProvinceList.map((item, index) => {
              const complete = activeCompletedProvinceCodes.has(item.code);
              return (
                <button
                  key={item.code}
                  type="button"
                  className={`province-chip ${complete ? "is-complete" : ""}`}
                  onClick={() => enterProvince(item)}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{item.shortName}</strong>
                  <i>{complete ? "✓" : "→"}</i>
                </button>
              );
            })}
          </div>
          {visibleProvinceList.length === 0 ? (
            <div className="all-complete-note">
              {neighborMode
                ? "34 个邻省连城起点已全部完成，太厉害了！"
                : "全国 34 个省级行政区已全部点亮，太厉害了！"}
            </div>
          ) : null}
        </section>
        )
      )}
      </div>

      <footer>
        <span>一张地图，500 个待归位的名字</span>
        <span>
          边界数据：
          <a href="https://geojson.cn/data/atlas/china" target="_blank" rel="noreferrer">GeoJSON.CN</a>
          {" · "}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a>
        </span>
        <span>
          {identity
            ? syncStatus === "offline"
              ? "离线进度已保存在本机，联网后自动同步"
              : syncStatus === "synced"
                ? "进度已按账号保存并同步到云端"
                : syncStatus === "error"
                  ? "进度已保存在本机，云同步暂不可用"
                  : "进度已保存在账号缓存，正在同步"
            : "游客试玩不保存，登录后可固化进度"}
        </span>
      </footer>

      {pendingFeature ? (
        <div className="answer-dialog-backdrop" role="presentation">
          <section
            className={`answer-dialog ${manualError ? "has-error" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="manual-answer-title"
          >
            <button
              className="dialog-close"
              type="button"
              aria-label="关闭输入框"
              onClick={() => {
                setPendingFeature(null);
                setManualAnswer("");
                setManualError("");
              }}
            >
              ×
            </button>
            <p className="eyebrow">难度提升 · 区块已选中</p>
            <h2 id="manual-answer-title">
              {province ? "这里是什么城市或区县？" : "这里是哪个省份？"}
            </h2>
            <p className="dialog-hint">
              可输入完整行政区名称，也可以省略“省、市、区、县”等常见后缀。
            </p>
            <form onSubmit={submitManualAnswer}>
              <label htmlFor="manual-answer">
                {province ? "城市 / 区县名称" : "省份名称"}
              </label>
              <div className="manual-answer-row">
                <input
                  id="manual-answer"
                  ref={manualAnswerInputRef}
                  value={manualAnswer}
                  autoComplete="off"
                  placeholder={province ? "输入名称" : "输入省份名称"}
                  onChange={(event) => {
                    setManualAnswer(event.target.value);
                    setManualError("");
                  }}
                />
                <button type="submit" disabled={!manualAnswer.trim()}>
                  确认答案
                </button>
              </div>
              <p className="manual-error" aria-live="polite">
                {manualError || "按 Enter 键也可以提交"}
              </p>
            </form>
          </section>
        </div>
      ) : null}

      {dragGhost ? (
        <div
          className="drag-ghost"
          style={{ transform: `translate(${dragGhost.x + 14}px, ${dragGhost.y + 14}px)` }}
          aria-hidden="true"
        >
          {dragGhost.name}
        </div>
      ) : null}
    </main>
  );
}
