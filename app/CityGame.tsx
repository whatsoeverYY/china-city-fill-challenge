"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CITY_QUIZ_DATA, type CityQuizItem } from "./gauntlet-data";

type Position = [number, number];

type Geometry = {
  type: "Polygon" | "MultiPolygon";
  coordinates: unknown;
};

type MapFeature = {
  type: "Feature";
  properties: {
    name: string;
    adcode?: string | number;
    center?: Position;
    centroid?: Position;
    provinceCode?: string;
  };
  geometry: Geometry;
};

type MapData = {
  type: "FeatureCollection";
  features: MapFeature[];
};

type Province = {
  code: string;
  name: string;
  shortName: string;
  kind: "省" | "自治区" | "直辖市" | "特别行政区";
};

const PROVINCES: Province[] = [
  { code: "110000", name: "北京市", shortName: "北京", kind: "直辖市" },
  { code: "120000", name: "天津市", shortName: "天津", kind: "直辖市" },
  { code: "130000", name: "河北省", shortName: "河北", kind: "省" },
  { code: "140000", name: "山西省", shortName: "山西", kind: "省" },
  { code: "150000", name: "内蒙古自治区", shortName: "内蒙古", kind: "自治区" },
  { code: "210000", name: "辽宁省", shortName: "辽宁", kind: "省" },
  { code: "220000", name: "吉林省", shortName: "吉林", kind: "省" },
  { code: "230000", name: "黑龙江省", shortName: "黑龙江", kind: "省" },
  { code: "310000", name: "上海市", shortName: "上海", kind: "直辖市" },
  { code: "320000", name: "江苏省", shortName: "江苏", kind: "省" },
  { code: "330000", name: "浙江省", shortName: "浙江", kind: "省" },
  { code: "340000", name: "安徽省", shortName: "安徽", kind: "省" },
  { code: "350000", name: "福建省", shortName: "福建", kind: "省" },
  { code: "360000", name: "江西省", shortName: "江西", kind: "省" },
  { code: "370000", name: "山东省", shortName: "山东", kind: "省" },
  { code: "410000", name: "河南省", shortName: "河南", kind: "省" },
  { code: "420000", name: "湖北省", shortName: "湖北", kind: "省" },
  { code: "430000", name: "湖南省", shortName: "湖南", kind: "省" },
  { code: "440000", name: "广东省", shortName: "广东", kind: "省" },
  { code: "450000", name: "广西壮族自治区", shortName: "广西", kind: "自治区" },
  { code: "460000", name: "海南省", shortName: "海南", kind: "省" },
  { code: "500000", name: "重庆市", shortName: "重庆", kind: "直辖市" },
  { code: "510000", name: "四川省", shortName: "四川", kind: "省" },
  { code: "520000", name: "贵州省", shortName: "贵州", kind: "省" },
  { code: "530000", name: "云南省", shortName: "云南", kind: "省" },
  { code: "540000", name: "西藏自治区", shortName: "西藏", kind: "自治区" },
  { code: "610000", name: "陕西省", shortName: "陕西", kind: "省" },
  { code: "620000", name: "甘肃省", shortName: "甘肃", kind: "省" },
  { code: "630000", name: "青海省", shortName: "青海", kind: "省" },
  { code: "640000", name: "宁夏回族自治区", shortName: "宁夏", kind: "自治区" },
  { code: "650000", name: "新疆维吾尔自治区", shortName: "新疆", kind: "自治区" },
  { code: "710000", name: "台湾省", shortName: "台湾", kind: "省" },
  { code: "810000", name: "香港特别行政区", shortName: "香港", kind: "特别行政区" },
  { code: "820000", name: "澳门特别行政区", shortName: "澳门", kind: "特别行政区" },
];

const TAIWAN_NAME_MAP: Record<string, string> = {
  連江縣: "连江县",
  宜蘭縣: "宜兰县",
  彰化縣: "彰化县",
  南投縣: "南投县",
  雲林縣: "云林县",
  基隆市: "基隆市",
  臺北市: "台北市",
  新北市: "新北市",
  臺中市: "台中市",
  臺南市: "台南市",
  桃園市: "桃园市",
  苗栗縣: "苗栗县",
  嘉義市: "嘉义市",
  嘉義縣: "嘉义县",
  金門縣: "金门县",
  高雄市: "高雄市",
  臺東縣: "台东县",
  花蓮縣: "花莲县",
  澎湖縣: "澎湖县",
  新竹市: "新竹市",
  新竹縣: "新竹县",
  屏東縣: "屏东县",
};

const MAP_WIDTH = 920;
const MAP_HEIGHT = 600;
const STORAGE_KEY = "china-city-fill-progress-v1";
const HARD_MODE_KEY = "china-city-fill-hard-mode-v1";
const NEIGHBOR_MODE_KEY = "china-city-fill-neighbor-mode-v1";
const NEIGHBOR_PROGRESS_KEY = "china-city-fill-neighbor-progress-v1";
const GAUNTLET_PROGRESS_KEY = "china-city-fill-gauntlet-progress-v1";

const PROVINCE_NEIGHBORS: Record<string, string[]> = {
  "110000": ["120000", "130000"],
  "120000": ["110000", "130000"],
  "130000": ["110000", "120000", "140000", "150000", "210000", "370000", "410000"],
  "140000": ["130000", "150000", "410000", "610000"],
  "150000": ["130000", "140000", "210000", "220000", "230000", "610000", "620000", "640000"],
  "210000": ["130000", "150000", "220000"],
  "220000": ["150000", "210000", "230000"],
  "230000": ["150000", "220000"],
  "310000": ["320000", "330000"],
  "320000": ["310000", "330000", "340000", "370000"],
  "330000": ["310000", "320000", "340000", "350000", "360000"],
  "340000": ["320000", "330000", "360000", "370000", "410000", "420000"],
  "350000": ["330000", "360000", "440000"],
  "360000": ["330000", "340000", "350000", "420000", "430000", "440000"],
  "370000": ["130000", "320000", "340000", "410000"],
  "410000": ["130000", "140000", "340000", "370000", "420000", "610000"],
  "420000": ["340000", "360000", "410000", "430000", "500000", "610000"],
  "430000": ["360000", "420000", "440000", "450000", "500000", "520000"],
  "440000": ["350000", "360000", "430000", "450000", "810000", "820000"],
  "450000": ["430000", "440000", "520000", "530000"],
  "460000": [],
  "500000": ["420000", "430000", "510000", "520000", "610000"],
  "510000": ["500000", "520000", "530000", "540000", "610000", "620000", "630000"],
  "520000": ["430000", "450000", "500000", "510000", "530000"],
  "530000": ["450000", "510000", "520000", "540000"],
  "540000": ["510000", "530000", "630000", "650000"],
  "610000": ["140000", "150000", "410000", "420000", "500000", "510000", "620000", "640000"],
  "620000": ["150000", "510000", "610000", "630000", "640000", "650000"],
  "630000": ["510000", "540000", "620000", "650000"],
  "640000": ["150000", "610000", "620000"],
  "650000": ["540000", "620000", "630000"],
  "710000": [],
  "810000": ["440000"],
  "820000": ["440000"],
};

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

function normalizeMap(data: MapData, code: string): MapData {
  return {
    ...data,
    features: data.features
      .filter((feature) => Boolean(feature.properties.name))
      .map((feature) => ({
        ...feature,
        properties: {
          ...feature.properties,
          name:
            code === "710000"
              ? TAIWAN_NAME_MAP[feature.properties.name] ?? feature.properties.name
              : feature.properties.name,
        },
      })),
  };
}

function mapDataUrl(code: string) {
  return new URL(`data/maps/${code}.json`, document.baseURI).toString();
}

async function fetchMapData(code: string) {
  const response = await fetch(mapDataUrl(code));
  if (!response.ok) throw new Error("地图载入失败");
  return normalizeMap((await response.json()) as MapData, code);
}

function useMapData(code: string) {
  return useMapCollection([code]);
}

function useMapCollection(codes: string[]) {
  const [data, setData] = useState<MapData | null>(null);
  const [error, setError] = useState(false);
  const codeKey = codes.join(",");

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(false);

    if (!codeKey) return () => {
      cancelled = true;
    };

    const requestedCodes = codeKey.split(",");
    Promise.all(requestedCodes.map(fetchMapData))
      .then((maps) => {
        if (cancelled) return;
        setData({
          type: "FeatureCollection",
          features: maps.flatMap((map, index) => {
            const code = requestedCodes[index];
            return map.features.map((feature) => ({
              ...feature,
              properties: {
                ...feature.properties,
                provinceCode: code,
              },
            }));
          }),
        });
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [codeKey]);

  return { data, error };
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

  const horizontalPadding = 46;
  const verticalPadding = 36;
  const longitudeSpan = Math.max(maxLongitude - minLongitude, 0.01);
  const latitudeSpan = Math.max(maxLatitude - minLatitude, 0.01);
  const scale = Math.min(
    (MAP_WIDTH - horizontalPadding * 2) / longitudeSpan,
    (MAP_HEIGHT - verticalPadding * 2) / latitudeSpan,
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
    PROVINCES.find((province) => province.code === code) ??
    PROVINCES.find((province) => province.name === feature.properties.name)
  );
}

function isActivationKey(key: string) {
  return key === "Enter" || key === " ";
}

function deterministicShuffle(values: string[], seed: string) {
  let state = Number(seed) || 1;
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    state = (state * 9301 + 49297) % 233280;
    const target = Math.floor((state / 233280) * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
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
    if (isActivationKey(event.key)) {
      event.preventDefault();
      onRegion(feature);
    }
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

      {mode === "detail"
        ? visibleFeatures
            .filter(
              (feature) =>
                (showAllLabels || completedNames.has(feature.properties.name)),
            )
            .map((feature) => {
              const [x, y] = featureLabelPosition(feature, project);
              const name = feature.properties.name;
              const isHint = !completedNames.has(name);
              return (
                <text
                  key={`label-${String(feature.properties.adcode)}-${name}`}
                  x={x}
                  y={y}
                  className={`region-label ${name.length > 7 ? "is-long" : ""} ${isHint ? "is-hint" : ""}`}
                  textAnchor="middle"
                  dominantBaseline="central"
                  aria-hidden="true"
                >
                  {name}
                </text>
              );
            })
        : null}
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

type GauntletLevel =
  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20;

const GAUNTLET_LEVELS: Array<{
  level: GauntletLevel;
  title: string;
  badge: string;
  description: string;
  target: string;
}> = [
  {
    level: 1,
    title: "辨形识省",
    badge: "省形",
    description: "只看省级行政区轮廓，写出它的名称。34 个全部答对即可过关。",
    target: "34 个省级行政区",
  },
  {
    level: 2,
    title: "城归何处",
    badge: "城市",
    description: "根据随机出现的城市名称，写出所属省级行政区。",
    target: "连续答对 30 题",
  },
  {
    level: 3,
    title: "省牌双答",
    badge: "车牌",
    description: "根据城市名称，同时写出所属省份与车牌前缀。",
    target: "连续答对 20 题",
  },
  {
    level: 4,
    title: "牌归省市",
    badge: "识牌",
    description: "根据随机出现的车牌前缀，同时写出对应的省份与城市。",
    target: "连续答对 20 题",
  },
  {
    level: 5,
    title: "邻省包围圈",
    badge: "邻省",
    description: "根据指定省份，在全国地图上选出所有与它陆地接壤的省份。",
    target: "连续答对 10 题",
  },
  {
    level: 6,
    title: "车牌补全",
    badge: "补牌",
    description: "根据城市和车牌简称，补出缺失的车牌字母。",
    target: "连续答对 20 题",
  },
  {
    level: 7,
    title: "省会攻防",
    badge: "省会",
    description: "省份与省会（首府、行政中心）双向随机出题。",
    target: "连续答对 20 题",
  },
  {
    level: 8,
    title: "城市落点",
    badge: "落点",
    description: "看到城市名称后，在无名称全国地图上点击它所属的省份。",
    target: "连续答对 30 题",
  },
  {
    level: 9,
    title: "真假闪电",
    badge: "真假",
    description: "快速判断城市与省份或车牌前缀的对应关系是否正确。",
    target: "连续答对 30 题",
  },
  {
    level: 10,
    title: "邻省连锁",
    badge: "连锁",
    description: "从随机省份出发，每一步只能前往未走过的陆地邻省。",
    target: "连续走过 10 个省份",
  },
  {
    level: 11,
    title: "省份拼图",
    badge: "拼图",
    description: "观察省份轮廓，把它拖放或点击到全国地图的正确位置。",
    target: "完成所选省份拼图",
  },
  {
    level: 12,
    title: "谁是卧底",
    badge: "卧底",
    description: "四座城市中有三座来自同一省份，找出唯一的异类。",
    target: "连续答对 20 题",
  },
  {
    level: 13,
    title: "市域落点",
    badge: "市域",
    description: "在无名称省内地图上，点击随机城市对应的市级区块。",
    target: "连续答对 20 题",
  },
  {
    level: 14,
    title: "沿海与沿边",
    badge: "疆域",
    description: "选出全部沿海、陆地边境或长江流经省级行政区。",
    target: "连续答对 10 题",
  },
  {
    level: 15,
    title: "最短省际路线",
    badge: "最短",
    description: "用陆地接壤关系连接起终点，并走出最短路线。",
    target: "完成 10 条最短路线",
  },
  {
    level: 16,
    title: "城市卧底",
    badge: "双向",
    description: "在城市与省份之间双向找出唯一正确项或错误项。",
    target: "连续答对 20 题",
  },
  {
    level: 17,
    title: "旋转轮廓",
    badge: "旋转",
    description: "省份轮廓会随机旋转，失去正常方向提示后辨认名称。",
    target: "连续答对 20 题",
  },
  {
    level: 18,
    title: "车牌找茬",
    badge: "找茬",
    description: "四组城市与车牌组合中，找出对应错误的一组。",
    target: "连续答对 20 题",
  },
  {
    level: 19,
    title: "省会落点",
    badge: "首府",
    description: "看到省会、首府或行政中心后，在无名称全国地图上落点。",
    target: "连续答对 30 题",
  },
  {
    level: 20,
    title: "终极混战",
    badge: "终极",
    description: "六类题型随机混合，带着三条生命完成最终考验。",
    target: "3 条生命完成 50 题",
  },
];

const MAP_REQUIRED_LEVELS = new Set<GauntletLevel>([
  1, 5, 8, 10, 11, 13, 14, 15, 17, 19, 20,
]);

const NATIONAL_PICKER_LEVELS = new Set<GauntletLevel>([1, 5, 7, 11, 17, 19]);
const NO_PICKER_LEVELS = new Set<GauntletLevel>([10, 14, 15, 20]);

const GAUNTLET_OPENING_FEEDBACK: Record<GauntletLevel, string> = {
  1: "观察轮廓，写出省级行政区名称",
  2: "写出这座城市所属的省级行政区",
  3: "省份和车牌前缀都答对才计入连胜",
  4: "省份和城市都答对才计入连胜",
  5: "在地图上选出全部陆地邻省，再确认答案",
  6: "补出车牌简称后缺失的字母",
  7: "省份与行政中心会交替双向出题",
  8: "直接点击城市所属的省级行政区",
  9: "判断屏幕上的对应关系是真是假",
  10: "从起点出发，只能走向未走过的陆地邻省",
  11: "拖动轮廓到全国地图的正确位置",
  12: "观察四座城市，找出唯一不属于同一省份的城市",
  13: "在省内无名称地图上点击目标城市",
  14: "根据题目选出完整的省级行政区集合",
  15: "从起点出发，用最少步数抵达终点",
  16: "根据提示找出唯一正确项或错误项",
  17: "忽略旋转方向，辨认省份轮廓",
  18: "找出城市与车牌对应错误的一组",
  19: "根据行政中心在全国地图上点击对应省份",
  20: "三条生命、五十道混合题，准备迎接最终考验",
};

const GAUNTLET_ROUND_HEADINGS: Record<GauntletLevel, string> = {
  1: "看轮廓，识省份",
  2: "看城市，答归属",
  3: "城市、省份、车牌三连答",
  4: "看车牌，答省市",
  5: "圈出全部陆地邻省",
  6: "看城市，补车牌字母",
  7: "省份与省会双向攻防",
  8: "看城市，在地图上落点",
  9: "辨真伪，拼反应",
  10: "沿陆地邻省连成路线",
  11: "把省份轮廓送回正确位置",
  12: "四座城市，找出唯一卧底",
  13: "在省内地图精准落点",
  14: "沿海、沿边与长江疆域",
  15: "寻找最短省际路线",
  16: "城市与省份双向排除",
  17: "旋转之后还能认出省份吗",
  18: "四组车牌，找出错误对应",
  19: "根据行政中心在地图落点",
  20: "三条生命迎战终极混战",
};

const PROVINCE_CAPITALS: Record<string, string> = {
  "110000": "北京市",
  "120000": "天津市",
  "130000": "石家庄市",
  "140000": "太原市",
  "150000": "呼和浩特市",
  "210000": "沈阳市",
  "220000": "长春市",
  "230000": "哈尔滨市",
  "310000": "上海市",
  "320000": "南京市",
  "330000": "杭州市",
  "340000": "合肥市",
  "350000": "福州市",
  "360000": "南昌市",
  "370000": "济南市",
  "410000": "郑州市",
  "420000": "武汉市",
  "430000": "长沙市",
  "440000": "广州市",
  "450000": "南宁市",
  "460000": "海口市",
  "500000": "重庆市",
  "510000": "成都市",
  "520000": "贵阳市",
  "530000": "昆明市",
  "540000": "拉萨市",
  "610000": "西安市",
  "620000": "兰州市",
  "630000": "西宁市",
  "640000": "银川市",
  "650000": "乌鲁木齐市",
  "710000": "台北市",
  "810000": "香港",
  "820000": "澳门",
};

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
    codes: [
      "310000", "320000", "340000", "360000", "420000", "430000",
      "500000", "510000", "530000", "540000", "630000",
    ],
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

type BossQuestion =
  | {
      kind: "text";
      badge: string;
      prompt: string;
      value: string;
      targets: string[];
      explanation: string;
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
    };

const GAUNTLET_QUIZ_PROVINCES = Array.from(
  CITY_QUIZ_DATA.reduce(
    (groups, item) => {
      const current = groups.get(item.provinceShort);
      if (current) {
        current.questionCount += 1;
      } else {
        groups.set(item.provinceShort, {
          name: item.province,
          shortName: item.provinceShort,
          questionCount: 1,
        });
      }
      return groups;
    },
    new Map<
      string,
      { name: string; shortName: string; questionCount: number }
    >(),
  ).values(),
);

const ALL_GAUNTLET_PROVINCE_NAMES = GAUNTLET_QUIZ_PROVINCES.map(
  (item) => item.shortName,
);

const ALL_GAUNTLET_SHAPE_PROVINCE_CODES = PROVINCES.map((item) => item.code);

function randomShuffle<T>(values: T[]) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
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
    if (index % 2 === 0) {
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
    } else {
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
    }
  }
  return questions;
}

function createPlateFaultQuestions(pool: CityQuizItem[]) {
  const source = pool.length >= 4 ? pool : CITY_QUIZ_DATA;
  return Array.from({ length: 80 }, (_, index): PlateFaultQuestion => {
    const items = randomShuffle(source).slice(0, 4);
    const wrongIndex = index % items.length;
    const wrongPlate = randomShuffle(CITY_QUIZ_DATA).find(
      (item) => normalizePlate(item.plate) !== normalizePlate(items[wrongIndex].plate),
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

function shortestProvincePath(startCode: string, endCode: string) {
  const queue: string[][] = [[startCode]];
  const visited = new Set([startCode]);
  while (queue.length) {
    const path = queue.shift()!;
    const current = path[path.length - 1];
    if (current === endCode) return path;
    for (const neighbor of PROVINCE_NEIGHBORS[current] ?? []) {
      if (visited.has(neighbor)) continue;
      visited.add(neighbor);
      queue.push([...path, neighbor]);
    }
  }
  return [];
}

function createRouteChallenge(): RouteChallenge {
  const connected = PROVINCES.filter(
    (item) => (PROVINCE_NEIGHBORS[item.code]?.length ?? 0) > 0,
  );
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const [start, end] = randomShuffle(connected).slice(0, 2);
    const shortestPath = shortestProvincePath(start.code, end.code);
    if (shortestPath.length >= 3 && shortestPath.length <= 7) {
      return { startCode: start.code, endCode: end.code, shortestPath };
    }
  }
  return {
    startCode: "110000",
    endCode: "310000",
    shortestPath: shortestProvincePath("110000", "310000"),
  };
}

function createBossQuestions() {
  return Array.from({ length: 50 }, (_, index): BossQuestion => {
    const city = randomShuffle(CITY_QUIZ_DATA)[0];
    const province = randomShuffle(PROVINCES)[0];
    const provinceCode = PROVINCES.find(
      (item) => item.shortName === city.provinceShort,
    )?.code ?? "110000";
    if (index % 6 === 0) {
      return {
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
        kind: "text",
        badge: "牌",
        prompt: "写出这座城市的车牌前缀",
        value: city.city,
        targets: [city.plate],
        explanation: `${city.city}的车牌前缀是 ${city.plate}`,
      };
    }
    if (index % 6 === 2) {
      return {
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
        kind: "map",
        badge: "点",
        prompt: "在地图上点击这座城市所属的省份",
        value: city.city,
        provinceCode,
        explanation: `${city.city}属于${city.province}`,
      };
    }
    return {
      kind: "shape",
      badge: "形",
      prompt: "写出这个旋转轮廓的省份名称",
      provinceCode: province.code,
      targets: [province.name, province.shortName],
      explanation: `这个轮廓是${province.name}`,
    };
  });
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
  return (
    <svg
      className={className}
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
    >
      <g style={{ transform: `rotate(${rotation}deg)`, transformOrigin: "center" }}>
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
}: {
  map: MapData;
  onRegion: (name: string) => void;
}) {
  const project = useMemo(() => makeProjection(map.features), [map.features]);
  return (
    <svg
      className="gauntlet-detail-map"
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      role="img"
      aria-label="无名称省内市级行政区地图"
    >
      {map.features.map((feature) => (
        <path
          key={`${feature.properties.adcode}-${feature.properties.name}`}
          d={geometryToPath(feature.geometry, project)}
          fillRule="evenodd"
          role="button"
          tabIndex={0}
          aria-label="待选择市级区块"
          onClick={() => onRegion(feature.properties.name)}
          onKeyDown={(event) => {
            if (isActivationKey(event.key)) {
              event.preventDefault();
              onRegion(feature.properties.name);
            }
          }}
        />
      ))}
    </svg>
  );
}

type TruthQuestion = {
  statement: string;
  isTrue: boolean;
  explanation: string;
};

function createTruthQuestions(pool: CityQuizItem[]) {
  if (!pool.length) return [];
  const fallbackPool = CITY_QUIZ_DATA;
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
      (candidate) => normalizePlate(candidate.plate) !== normalizePlate(item.plate),
    );
    const shownPlate = isTrue ? item.plate : alternative?.plate ?? "京A";
    return {
      statement: `${item.city}的车牌前缀是 ${shownPlate}`,
      isTrue,
      explanation: `${item.city}的车牌前缀是 ${item.plate}`,
    };
  });
}

function GauntletNationalMap({
  map,
  selectedCodes,
  routeCodes,
  originCode,
  showLabels,
  onProvince,
  onProvinceDrop,
}: {
  map: MapData;
  selectedCodes: Set<string>;
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
          const inRoute = routeSet.has(province.code);
          const current = currentCode === province.code;
          const origin = originCode === province.code;
          return (
            <path
              key={province.code}
              d={geometryToPath(feature.geometry, project)}
              className={`gauntlet-national-region ${selected ? "is-selected" : ""} ${inRoute ? "is-route" : ""} ${current ? "is-current" : ""} ${origin ? "is-origin" : ""}`}
              fillRule="evenodd"
              role="button"
              tabIndex={0}
              aria-label={`${province.name}${selected ? "，已选择" : ""}${inRoute ? "，已加入路线" : ""}`}
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
              onKeyDown={(event) => {
                if (isActivationKey(event.key)) {
                  event.preventDefault();
                  onProvince(province);
                }
              }}
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
  const [level, setLevel] = useState<GauntletLevel | null>(null);
  const [passedLevel, setPassedLevel] = useState<GauntletLevel | null>(null);
  const [completedLevels, setCompletedLevels] = useState<Set<GauntletLevel>>(
    new Set(),
  );
  const [provinceOrder, setProvinceOrder] = useState<MapFeature[]>([]);
  const [provinceChallengeOrder, setProvinceChallengeOrder] = useState<Province[]>([]);
  const [cityOrder, setCityOrder] = useState<CityQuizItem[]>([]);
  const [truthOrder, setTruthOrder] = useState<TruthQuestion[]>([]);
  const [undercoverOrder, setUndercoverOrder] = useState<UndercoverQuestion[]>([]);
  const [dualIntruderOrder, setDualIntruderOrder] = useState<DualIntruderQuestion[]>([]);
  const [plateFaultOrder, setPlateFaultOrder] = useState<PlateFaultQuestion[]>([]);
  const [groupOrder, setGroupOrder] = useState<ProvinceGroupQuestion[]>([]);
  const [routeChallenge, setRouteChallenge] = useState<RouteChallenge | null>(null);
  const [bossOrder, setBossOrder] = useState<BossQuestion[]>([]);
  const [bossLives, setBossLives] = useState(3);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [provinceAnswer, setProvinceAnswer] = useState("");
  const [plateAnswer, setPlateAnswer] = useState("");
  const [cityAnswer, setCityAnswer] = useState("");
  const [mapSelections, setMapSelections] = useState<Set<string>>(new Set());
  const [routeCodes, setRouteCodes] = useState<string[]>([]);
  const [timeLimit, setTimeLimit] = useState<0 | 60 | 90>(0);
  const [timeLeft, setTimeLeft] = useState(GAUNTLET_TIME_LIMIT);
  const [feedback, setFeedback] = useState("准备好后提交答案");
  const [feedbackType, setFeedbackType] = useState<"idle" | "right" | "wrong">(
    "idle",
  );
  const [selectedQuizProvinces, setSelectedQuizProvinces] = useState<Set<string>>(
    () => new Set(ALL_GAUNTLET_PROVINCE_NAMES),
  );
  const [draftQuizProvinces, setDraftQuizProvinces] = useState<Set<string>>(
    () => new Set(ALL_GAUNTLET_PROVINCE_NAMES),
  );
  const [selectedShapeProvinceCodes, setSelectedShapeProvinceCodes] = useState<
    Set<string>
  >(() => new Set(ALL_GAUNTLET_SHAPE_PROVINCE_CODES));
  const [draftShapeProvinceCodes, setDraftShapeProvinceCodes] = useState<
    Set<string>
  >(() => new Set(ALL_GAUNTLET_SHAPE_PROVINCE_CODES));
  const [provincePickerOpen, setProvincePickerOpen] = useState(false);
  const provinceInputRef = useRef<HTMLInputElement>(null);
  const timedMode = timeLimit > 0;

  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(GAUNTLET_PROGRESS_KEY) ?? "[]",
      ) as number[];
      setCompletedLevels(
        new Set(
          saved.filter(
            (item): item is GauntletLevel =>
              GAUNTLET_LEVELS.some((config) => config.level === item),
          ),
        ),
      );
    } catch {
      setCompletedLevels(new Set());
    }
  }, []);

  useEffect(() => {
    if (
      !timedMode ||
      !level ||
      passedLevel ||
      timeLeft === 0 ||
      provincePickerOpen
    ) {
      return;
    }
    const timer = window.setInterval(() => {
      setTimeLeft((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [level, passedLevel, provincePickerOpen, timeLeft, timedMode]);

  const currentProvinceFeature = provinceOrder.length
    ? provinceOrder[
        level === 17 ? questionIndex % provinceOrder.length : questionIndex
      ] ?? null
    : null;
  const currentProvince = currentProvinceFeature
    ? provinceForFeature(currentProvinceFeature)
    : null;
  const currentCity = cityOrder.length
    ? cityOrder[questionIndex % cityOrder.length]
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
  const detailProvinceCode =
    level === 13 && currentCity
      ? PROVINCES.find((item) => item.shortName === currentCity.provinceShort)?.code
      : null;
  const { data: gauntletDetailMap, error: gauntletDetailError } = useMapCollection(
    detailProvinceCode ? [detailProvinceCode] : [],
  );
  const gauntletDetailReady = Boolean(
    gauntletDetailMap?.features.length &&
    gauntletDetailMap.features.every(
      (feature) => feature.properties.provinceCode === detailProvinceCode,
    ),
  );
  const capitalDirection = questionIndex % 2 === 0
    ? "province-to-capital"
    : "capital-to-province";
  const target = level === 1 || level === 11
    ? provinceOrder.length
    : level === 2 || level === 8 || level === 9 || level === 19
      ? 30
      : level === 5 || level === 10 || level === 14 || level === 15
        ? 10
        : level === 20
          ? 50
        : 20;
  const progress = level === 1
    ? questionIndex
    : level === 11
      ? mapSelections.size
    : level === 10
      ? routeCodes.length
      : level === 20
        ? questionIndex
      : streak;
  const usesNationalPicker = level ? NATIONAL_PICKER_LEVELS.has(level) : false;
  const pickerAvailable = level ? !NO_PICKER_LEVELS.has(level) : false;
  const provincePickerOptions = usesNationalPicker
    ? PROVINCES.map((item) => ({
        key: item.code,
        shortName: item.shortName,
        questionCount:
          level === 5 ? PROVINCE_NEIGHBORS[item.code]?.length ?? 0 : 1,
      }))
    : GAUNTLET_QUIZ_PROVINCES.map((item) => ({
        key: item.shortName,
        shortName: item.shortName,
        questionCount: item.questionCount,
      }));
  const selectedPickerProvinces = usesNationalPicker
    ? selectedShapeProvinceCodes
    : selectedQuizProvinces;
  const draftPickerProvinces = usesNationalPicker
    ? draftShapeProvinceCodes
    : draftQuizProvinces;
  const draftQuizItems = CITY_QUIZ_DATA.filter((item) =>
    draftQuizProvinces.has(item.provinceShort),
  );
  const draftSelectionValid = draftPickerProvinces.size > 0 &&
    (level !== 5 ||
      Array.from(draftPickerProvinces).some(
        (code) => (PROVINCE_NEIGHBORS[code]?.length ?? 0) > 0,
      )) &&
    ((level !== 12 && level !== 16) ||
      cityGroups(draftQuizItems).some(([, items]) => items.length >= 3)) &&
    (level !== 18 || draftQuizItems.length >= 4);
  const hasTimedOut = timedMode && Boolean(level) && !passedLevel && timeLeft === 0;
  const hasLostBoss = level === 20 && bossLives === 0 && !passedLevel;

  const focusProvinceInput = () => {
    window.requestAnimationFrame(() => provinceInputRef.current?.focus());
  };

  const resetRoundProgress = (message: string) => {
    setTimeLeft(timeLimit || GAUNTLET_TIME_LIMIT);
    setQuestionIndex(0);
    setStreak(0);
    setProvinceAnswer("");
    setPlateAnswer("");
    setCityAnswer("");
    setMapSelections(new Set());
    setRouteCodes([]);
    setFeedbackType("idle");
    setFeedback(message);
  };

  const setCityChallengeQuestions = (
    challengeLevel: GauntletLevel,
    questions: CityQuizItem[],
  ) => {
    const shuffledQuestions = randomShuffle(questions);
    setCityOrder(shuffledQuestions);
    setTruthOrder(
      challengeLevel === 9 ? createTruthQuestions(shuffledQuestions) : [],
    );
    setUndercoverOrder(
      challengeLevel === 12 ? createUndercoverQuestions(shuffledQuestions) : [],
    );
    setDualIntruderOrder(
      challengeLevel === 16 ? createDualIntruderQuestions(shuffledQuestions) : [],
    );
    setPlateFaultOrder(
      challengeLevel === 18 ? createPlateFaultQuestions(shuffledQuestions) : [],
    );
  };

  const startLevel = (nextLevel: GauntletLevel) => {
    if (
      MAP_REQUIRED_LEVELS.has(nextLevel) &&
      (!nationalMap || nationalError)
    ) {
      return;
    }
    setLevel(nextLevel);
    setPassedLevel(null);
    resetRoundProgress(GAUNTLET_OPENING_FEEDBACK[nextLevel]);
    setUndercoverOrder([]);
    setDualIntruderOrder([]);
    setPlateFaultOrder([]);
    setGroupOrder([]);
    setRouteChallenge(null);
    setBossOrder([]);
    setBossLives(3);

    if ((nextLevel === 1 || nextLevel === 11 || nextLevel === 17) && nationalMap) {
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
    } else if (nextLevel === 5) {
      const selectedOrigins = PROVINCES.filter(
        (item) =>
          selectedShapeProvinceCodes.has(item.code) &&
          (PROVINCE_NEIGHBORS[item.code]?.length ?? 0) > 0,
      );
      const nextOrigins = selectedOrigins.length
        ? selectedOrigins
        : PROVINCES.filter(
            (item) => (PROVINCE_NEIGHBORS[item.code]?.length ?? 0) > 0,
          );
      if (!selectedOrigins.length) {
        setSelectedShapeProvinceCodes(
          new Set(ALL_GAUNTLET_SHAPE_PROVINCE_CODES),
        );
        setDraftShapeProvinceCodes(
          new Set(ALL_GAUNTLET_SHAPE_PROVINCE_CODES),
        );
      }
      setProvinceChallengeOrder(
        randomShuffle(nextOrigins),
      );
      setProvinceOrder([]);
      setCityOrder([]);
      setTruthOrder([]);
    } else if (nextLevel === 7) {
      setProvinceChallengeOrder(
        randomShuffle(
          PROVINCES.filter((item) => selectedShapeProvinceCodes.has(item.code)),
        ),
      );
      setProvinceOrder([]);
      setCityOrder([]);
      setTruthOrder([]);
    } else if (nextLevel === 19) {
      setProvinceChallengeOrder(
        randomShuffle(
          PROVINCES.filter((item) => selectedShapeProvinceCodes.has(item.code)),
        ),
      );
      setProvinceOrder([]);
      setCityOrder([]);
      setTruthOrder([]);
    } else if (nextLevel === 10) {
      const possibleStarts = PROVINCES.filter(
        (item) => (PROVINCE_NEIGHBORS[item.code]?.length ?? 0) > 0,
      );
      const start = randomShuffle(possibleStarts)[0];
      setRouteCodes(start ? [start.code] : []);
      setProvinceOrder([]);
      setProvinceChallengeOrder([]);
      setCityOrder([]);
      setTruthOrder([]);
    } else if (nextLevel === 14) {
      setGroupOrder(randomShuffle(PROVINCE_GROUP_QUESTIONS));
      setProvinceOrder([]);
      setProvinceChallengeOrder([]);
      setCityOrder([]);
      setTruthOrder([]);
    } else if (nextLevel === 15) {
      const challenge = createRouteChallenge();
      setRouteChallenge(challenge);
      setRouteCodes([challenge.startCode]);
      setProvinceOrder([]);
      setProvinceChallengeOrder([]);
      setCityOrder([]);
      setTruthOrder([]);
    } else if (nextLevel === 20) {
      setBossOrder(createBossQuestions());
      setProvinceOrder([]);
      setProvinceChallengeOrder([]);
      setCityOrder([]);
      setTruthOrder([]);
    } else {
      let nextQuestions = randomShuffle(
        CITY_QUIZ_DATA.filter((item) =>
          selectedQuizProvinces.has(item.provinceShort),
        ),
      );
      if (
        (nextLevel === 12 || nextLevel === 16) &&
        !cityGroups(nextQuestions).some(([, items]) => items.length >= 3)
      ) {
        nextQuestions = randomShuffle(CITY_QUIZ_DATA);
        setSelectedQuizProvinces(new Set(ALL_GAUNTLET_PROVINCE_NAMES));
        setDraftQuizProvinces(new Set(ALL_GAUNTLET_PROVINCE_NAMES));
      }
      if (nextLevel === 18 && nextQuestions.length < 4) {
        nextQuestions = randomShuffle(CITY_QUIZ_DATA);
        setSelectedQuizProvinces(new Set(ALL_GAUNTLET_PROVINCE_NAMES));
        setDraftQuizProvinces(new Set(ALL_GAUNTLET_PROVINCE_NAMES));
      }
      setCityChallengeQuestions(nextLevel, nextQuestions);
      setProvinceOrder([]);
      setProvinceChallengeOrder([]);
    }
    setProvincePickerOpen(false);
    focusProvinceInput();
  };

  const openProvincePicker = () => {
    if (usesNationalPicker) {
      setDraftShapeProvinceCodes(new Set(selectedShapeProvinceCodes));
    } else {
      setDraftQuizProvinces(new Set(selectedQuizProvinces));
    }
    setProvincePickerOpen(true);
  };

  const toggleDraftProvince = (key: string) => {
    const next = new Set(draftPickerProvinces);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    if (usesNationalPicker) {
      setDraftShapeProvinceCodes(next);
    } else {
      setDraftQuizProvinces(next);
    }
  };

  const applyProvinceSelection = () => {
    if (!level || !draftSelectionValid) return;

    let rangeMessage = "";
    if (usesNationalPicker) {
      if (!nationalMap) return;
      const nextSelection = new Set(draftShapeProvinceCodes);
      setSelectedShapeProvinceCodes(nextSelection);
      if (level === 1 || level === 11 || level === 17) {
        const nextFeatures = nationalMap.features.filter((feature) => {
          const featureProvince = provinceForFeature(feature);
          return Boolean(
            featureProvince && nextSelection.has(featureProvince.code),
          );
        });
        setProvinceOrder(randomShuffle(nextFeatures));
        rangeMessage = level === 11
          ? `拼图范围已更新：本轮放置 ${nextFeatures.length} 个省级行政区`
          : level === 17
            ? `题目范围已更新：从 ${nextFeatures.length} 个旋转轮廓中出题`
            : `题目范围已更新：本轮辨认 ${nextFeatures.length} 个省级行政区`;
      } else if (level === 5) {
        const nextProvinces = PROVINCES.filter(
          (item) =>
            nextSelection.has(item.code) &&
            (PROVINCE_NEIGHBORS[item.code]?.length ?? 0) > 0,
        );
        setProvinceChallengeOrder(randomShuffle(nextProvinces));
        rangeMessage = `题目范围已更新：从 ${nextProvinces.length} 个有陆地邻省的省份中出题`;
      } else {
        const nextProvinces = PROVINCES.filter((item) =>
          nextSelection.has(item.code),
        );
        setProvinceChallengeOrder(randomShuffle(nextProvinces));
        rangeMessage = `题目范围已更新：本轮包含 ${nextProvinces.length} 个省级行政区`;
      }
    } else {
      const nextSelection = new Set(draftQuizProvinces);
      const nextQuestions = CITY_QUIZ_DATA.filter((item) =>
        nextSelection.has(item.provinceShort),
      );
      setSelectedQuizProvinces(nextSelection);
      setCityChallengeQuestions(level, nextQuestions);
      rangeMessage = `题目范围已更新：${nextSelection.size} 个省级行政区，共 ${nextQuestions.length} 座城市`;
    }
    resetRoundProgress(rangeMessage);
    setProvincePickerOpen(false);
    focusProvinceInput();
  };

  const selectAllPickerProvinces = () => {
    if (usesNationalPicker) {
      setDraftShapeProvinceCodes(
        new Set(ALL_GAUNTLET_SHAPE_PROVINCE_CODES),
      );
    } else {
      setDraftQuizProvinces(new Set(ALL_GAUNTLET_PROVINCE_NAMES));
    }
  };

  const clearPickerProvinces = () => {
    if (usesNationalPicker) {
      setDraftShapeProvinceCodes(new Set());
    } else {
      setDraftQuizProvinces(new Set());
    }
  };

  const finishLevel = (finishedLevel: GauntletLevel) => {
    const nextCompleted = new Set(completedLevels);
    nextCompleted.add(finishedLevel);
    setCompletedLevels(nextCompleted);
    localStorage.setItem(
      GAUNTLET_PROGRESS_KEY,
      JSON.stringify(Array.from(nextCompleted)),
    );
    setPassedLevel(finishedLevel);
    setFeedbackType("right");
  };

  const advanceStreakChallenge = (
    challengeLevel: GauntletLevel,
    correct: boolean,
    winTarget: number,
    rightMessage: string,
    wrongMessage: string,
  ) => {
    const nextStreak = correct ? streak + 1 : 0;
    if (correct && nextStreak === winTarget) {
      finishLevel(challengeLevel);
      return;
    }
    setStreak(nextStreak);
    setQuestionIndex((value) => value + 1);
    setProvinceAnswer("");
    setPlateAnswer("");
    setCityAnswer("");
    setMapSelections(new Set());
    setFeedbackType(correct ? "right" : "wrong");
    setFeedback(
      correct
        ? `${rightMessage}，当前连续答对 ${nextStreak} 题`
        : `连胜中断。${wrongMessage}`,
    );
    focusProvinceInput();
  };

  const advanceBossQuestion = (correct: boolean, explanation: string) => {
    const nextLives = correct ? bossLives : bossLives - 1;
    if (!correct) setBossLives(nextLives);
    if (nextLives <= 0) {
      setFeedbackType("wrong");
      setFeedback(`生命耗尽。${explanation}`);
      return;
    }
    const nextIndex = questionIndex + 1;
    if (nextIndex === 50) {
      finishLevel(20);
      return;
    }
    setQuestionIndex(nextIndex);
    setProvinceAnswer("");
    setPlateAnswer("");
    setFeedbackType(correct ? "right" : "wrong");
    setFeedback(
      correct
        ? `回答正确，还剩 ${50 - nextIndex} 题`
        : `回答错误，失去一条生命。${explanation}`,
    );
    focusProvinceInput();
  };

  const submitAnswer = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!level) return;

    if (
      level === 20 &&
      currentBossQuestion &&
      (currentBossQuestion.kind === "text" || currentBossQuestion.kind === "shape")
    ) {
      const correct = currentBossQuestion.targets.some(
        (targetAnswer) =>
          answerMatches(provinceAnswer, [targetAnswer]) ||
          normalizePlate(provinceAnswer) === normalizePlate(targetAnswer),
      );
      advanceBossQuestion(correct, currentBossQuestion.explanation);
      return;
    }

    if (level === 1) {
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
        finishLevel(1);
        return;
      }
      setQuestionIndex(nextIndex);
      setProvinceAnswer("");
      setFeedbackType("right");
      setFeedback(`回答正确：${currentProvince.name}。继续下一题`);
      focusProvinceInput();
      return;
    }

    if (level === 7) {
      if (!currentChallengeProvince) return;
      const capital = PROVINCE_CAPITALS[currentChallengeProvince.code];
      const targets = capitalDirection === "province-to-capital"
        ? [capital]
        : [currentChallengeProvince.name, currentChallengeProvince.shortName];
      const correct = answerMatches(provinceAnswer, targets);
      advanceStreakChallenge(
        7,
        correct,
        20,
        "回答正确",
        `${currentChallengeProvince.name}的行政中心是${capital}`,
      );
      return;
    }

    if (level === 17) {
      if (!currentProvince) return;
      const correct = answerMatches(provinceAnswer, [
        currentProvince.name,
        currentProvince.shortName,
      ]);
      advanceStreakChallenge(
        17,
        correct,
        20,
        "旋转轮廓辨认正确",
        `这个轮廓是${currentProvince.name}`,
      );
      return;
    }

    if (level === 6) {
      if (!currentCity) return;
      const expectedLetter = normalizePlate(currentCity.plate).slice(1);
      const normalizedAnswer = normalizePlate(plateAnswer);
      const correct =
        normalizedAnswer === expectedLetter ||
        normalizedAnswer === normalizePlate(currentCity.plate);
      advanceStreakChallenge(
        6,
        correct,
        20,
        "补全正确",
        `${currentCity.city}的车牌前缀是 ${currentCity.plate}`,
      );
      return;
    }

    if (level !== 2 && level !== 3 && level !== 4) return;

    if (!currentCity) return;
    const provinceCorrect = answerMatches(provinceAnswer, [
      currentCity.province,
      currentCity.provinceShort,
    ]);
    const secondaryCorrect =
      level === 2
        ? true
        : level === 3
          ? normalizePlate(plateAnswer) === normalizePlate(currentCity.plate)
          : answerMatches(cityAnswer, [currentCity.city]);
    const correct = provinceCorrect && secondaryCorrect;
    const winTarget = level === 2 ? 30 : 20;
    const wrongMessage = level === 2
      ? `${currentCity.city}属于${currentCity.province}`
      : level === 3
        ? `正确答案：${currentCity.provinceShort} · ${currentCity.plate}`
        : `正确答案：${currentCity.provinceShort} · ${currentCity.city}`;
    advanceStreakChallenge(
      level,
      correct,
      winTarget,
      "回答正确",
      wrongMessage,
    );
  };

  const submitNeighborSelection = () => {
    if (level !== 5 || !currentChallengeProvince) return;
    const expected = new Set(PROVINCE_NEIGHBORS[currentChallengeProvince.code] ?? []);
    const correct =
      expected.size === mapSelections.size &&
      Array.from(expected).every((code) => mapSelections.has(code));
    const neighborNames = Array.from(expected)
      .map((code) => PROVINCES.find((item) => item.code === code)?.shortName)
      .filter(Boolean)
      .join("、");
    advanceStreakChallenge(
      5,
      correct,
      10,
      "包围圈正确",
      `${currentChallengeProvince.shortName}的陆地邻省：${neighborNames}`,
    );
  };

  const answerTruthQuestion = (answer: boolean) => {
    if (level !== 9 || !currentTruthQuestion) return;
    const correct = answer === currentTruthQuestion.isTrue;
    advanceStreakChallenge(
      9,
      correct,
      30,
      "判断正确",
      currentTruthQuestion.explanation,
    );
  };

  const answerOptionQuestion = (answer: string) => {
    if (level === 12 && currentUndercoverQuestion) {
      advanceStreakChallenge(
        12,
        answer === currentUndercoverQuestion.answerCity,
        20,
        "卧底识别正确",
        currentUndercoverQuestion.explanation,
      );
      return;
    }
    if (level === 16 && currentDualIntruderQuestion) {
      advanceStreakChallenge(
        16,
        answer === currentDualIntruderQuestion.answer,
        20,
        "双向判断正确",
        currentDualIntruderQuestion.explanation,
      );
      return;
    }
    if (level === 18 && currentPlateFaultQuestion) {
      advanceStreakChallenge(
        18,
        answer === currentPlateFaultQuestion.answer,
        20,
        "车牌找茬正确",
        currentPlateFaultQuestion.explanation,
      );
    }
  };

  const handleDetailRegion = (regionName: string) => {
    if (level !== 13 || !currentCity) return;
    advanceStreakChallenge(
      13,
      answerMatches(regionName, [currentCity.city]),
      20,
      "市域落点正确",
      `${currentCity.city}对应地图上的“${currentCity.city}”区块`,
    );
  };

  const submitProvinceGroup = () => {
    if (level !== 14 || !currentGroupQuestion) return;
    const expected = new Set(currentGroupQuestion.codes);
    const correct =
      expected.size === mapSelections.size &&
      Array.from(expected).every((code) => mapSelections.has(code));
    const names = currentGroupQuestion.codes
      .map((code) => PROVINCES.find((item) => item.code === code)?.shortName)
      .filter(Boolean)
      .join("、");
    advanceStreakChallenge(
      14,
      correct,
      10,
      "疆域集合完整正确",
      `正确答案：${names}`,
    );
  };

  const placePuzzleProvince = (
    selectedProvince: Province,
    draggedCode?: string,
  ) => {
    if (level !== 11 || !currentPuzzleFeature) return;
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
      finishLevel(11);
      return;
    }
    setMapSelections(next);
    setFeedbackType("right");
    setFeedback(`放置正确：${puzzleProvince.name}。继续下一块拼图`);
  };

  const answerBossTruth = (answer: boolean) => {
    if (level !== 20 || currentBossQuestion?.kind !== "truth") return;
    advanceBossQuestion(
      answer === currentBossQuestion.isTrue,
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
    if (level === 11) {
      placePuzzleProvince(selectedProvince);
      return;
    }

    if (level === 14) {
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

    if (level === 19) {
      if (!currentChallengeProvince) return;
      advanceStreakChallenge(
        19,
        selectedProvince.code === currentChallengeProvince.code,
        30,
        "省会落点正确",
        `${PROVINCE_CAPITALS[currentChallengeProvince.code]}对应${currentChallengeProvince.name}`,
      );
      return;
    }

    if (level === 20 && currentBossQuestion?.kind === "map") {
      advanceBossQuestion(
        selectedProvince.code === currentBossQuestion.provinceCode,
        currentBossQuestion.explanation,
      );
      return;
    }

    if (level === 5) {
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

    if (level === 15) {
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
        finishLevel(15);
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

    if (level === 8) {
      if (!currentCity) return;
      const correct = answerMatches(selectedProvince.shortName, [
        currentCity.province,
        currentCity.provinceShort,
      ]);
      advanceStreakChallenge(
        8,
        correct,
        30,
        "落点正确",
        `${currentCity.city}属于${currentCity.province}`,
      );
      return;
    }

    if (level !== 10 || routeCodes.length === 0) return;
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
      finishLevel(10);
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
    setProvincePickerOpen(false);
    setFeedbackType("idle");
  };

  const roundHeading = level ? GAUNTLET_ROUND_HEADINGS[level] : "";

  const activeConfig = level
    ? GAUNTLET_LEVELS.find((item) => item.level === level)
    : null;
  const completedTarget = passedLevel === 1
    ? `已辨认本轮所选的 ${target} 个省级行政区`
    : passedLevel === 11
      ? `已完成本轮所选的 ${target} 块省份拼图`
      : activeConfig
        ? `已完成目标：${activeConfig.target}`
        : "已完成本关目标";

  return (
    <main className="game-shell gauntlet-shell">
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

      {!level ? (
        <>
          <section className="gauntlet-intro">
            <p className="eyebrow">过关斩将 · 二十重试炼</p>
            <h1>从轮廓到终极混战，<span>把中国地理练成直觉</span></h1>
            <p className="lede">二十个关卡均可直接选择。连续答题关卡一旦答错，连胜数会归零。</p>
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
              <small>{timeLimit === 0 ? "点击切换到 90 秒限时" : timeLimit === 90 ? "点击切换到 60 秒极速" : "点击切回不限时，选省时会暂停"}</small>
            </button>
          </section>
          <section className="gauntlet-level-grid" aria-label="选择关卡">
            {GAUNTLET_LEVELS.map((item) => {
              const completed = completedLevels.has(item.level);
              return (
                <button
                  key={item.level}
                  className="gauntlet-level-card"
                  type="button"
                  onClick={() => startLevel(item.level)}
                  disabled={
                    MAP_REQUIRED_LEVELS.has(item.level) &&
                    (!nationalMap || nationalError)
                  }
                >
                  <span className="level-number">第 {item.level} 关</span>
                  <i>{item.badge}</i>
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                  <b>{item.target}</b>
                  <span className={`level-state ${completed ? "is-complete" : ""}`}>
                    {completed
                      ? "✓ 已过关"
                      : MAP_REQUIRED_LEVELS.has(item.level) && !nationalMap
                        ? "地图载入中…"
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
          <p className="eyebrow">第 {level} 关 · {hasLostBoss ? "生命耗尽" : "时间耗尽"}</p>
          <h1>还差一点，再冲一次</h1>
          <p>
            {hasLostBoss
              ? "三条生命已经用完，本轮成绩不会计入通关记录。"
              : `${timeLimit} 秒倒计时已结束，本轮成绩不会计入通关记录。`}
          </p>
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
          <p className="eyebrow">第 {passedLevel} 关 · 挑战达成</p>
          <h1>{activeConfig?.title}，过关！</h1>
          <p>{completedTarget}，这一关已留下通关印记。</p>
          <div>
            {passedLevel < 20 ? (
              <button type="button" onClick={() => startLevel((passedLevel + 1) as GauntletLevel)}>
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
              <p className="eyebrow">第 {level} 关 · {activeConfig?.title}</p>
              <h1>{roundHeading}</h1>
            </div>
            <div className="gauntlet-round-actions">
              {pickerAvailable ? (
                <button
                  className="province-picker-button"
                  type="button"
                  onClick={openProvincePicker}
                >
                  <span aria-hidden="true">选</span>
                  <b>选择省份</b>
                  <i>{selectedPickerProvinces.size} / {provincePickerOptions.length}</i>
                </button>
              ) : null}
              {level === 20 ? (
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
                  {level === 1
                    ? "答题进度"
                    : level === 10
                      ? "路线长度"
                      : level === 11
                        ? "拼图进度"
                        : level === 15
                          ? "完成路线"
                          : level === 20
                            ? "题目进度"
                            : "当前连胜"}
                </span>
                <strong>{progress}<i> / {target}</i></strong>
                <div><span style={{ width: `${target ? (progress / target) * 100 : 0}%` }} /></div>
              </div>
            </div>
          </section>

          <section className={`gauntlet-play-card ${feedbackType === "wrong" ? "has-error" : ""}`}>
            <div className="gauntlet-question-stage">
              <span className="question-count">
                {level === 1
                  ? `${selectedShapeProvinceCodes.size} 省 · 第 ${questionIndex + 1} / ${target} 题`
                  : level === 11
                    ? `${selectedShapeProvinceCodes.size} 省 · 已放置 ${mapSelections.size} / ${target}`
                  : level === 17
                    ? `${selectedShapeProvinceCodes.size} 省 · 第 ${questionIndex + 1} 题`
                  : level === 5 || level === 7 || level === 19
                    ? `${selectedShapeProvinceCodes.size} 省 · 第 ${questionIndex + 1} 题`
                    : level === 10
                      ? `全国路线 · 已走 ${routeCodes.length} / 10`
                      : level === 14
                        ? `疆域集合 · 第 ${questionIndex + 1} 题`
                        : level === 15
                          ? `最短路线 · 已完成 ${streak} / 10`
                          : level === 20
                            ? `终极混战 · 第 ${questionIndex + 1} / 50 题`
                      : `${selectedQuizProvinces.size} 省 · ${cityOrder.length} 城 · 第 ${questionIndex + 1} 题`}
              </span>
              {level === 1 ? (
                currentProvinceFeature ? <ProvinceSilhouette feature={currentProvinceFeature} /> : <LoadingMap />
              ) : level === 11 ? (
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
              ) : level === 12 ? (
                <div className="choice-question">
                  <span aria-hidden="true">卧</span>
                  <p>其中三座城市属于同一个省份</p>
                  <strong>找出唯一的城市卧底</strong>
                  <small>需要自己判断另外三座城市的共同归属</small>
                </div>
              ) : level === 13 ? (
                gauntletDetailMap && gauntletDetailReady && currentCity ? (
                  <div className="gauntlet-map-question">
                    <div className="map-question-banner">
                      <small>在{currentCity.provinceShort}地图上找到</small>
                      <strong>{currentCity.city}</strong>
                    </div>
                    <GauntletDetailMap map={gauntletDetailMap} onRegion={handleDetailRegion} />
                  </div>
                ) : gauntletDetailError ? (
                  <p className="map-error">省内地图载入失败，请重试本关</p>
                ) : <LoadingMap />
              ) : level === 14 ? (
                nationalMap && currentGroupQuestion ? (
                  <div className="gauntlet-map-question">
                    <div className="map-question-banner">
                      <small>{currentGroupQuestion.description}</small>
                      <strong>{currentGroupQuestion.title}</strong>
                    </div>
                    <GauntletNationalMap
                      map={nationalMap}
                      selectedCodes={mapSelections}
                      routeCodes={[]}
                      originCode={null}
                      showLabels
                      onProvince={handleGauntletProvince}
                    />
                  </div>
                ) : <LoadingMap />
              ) : level === 15 ? (
                nationalMap && routeChallenge ? (
                  <div className="gauntlet-map-question">
                    <div className="map-question-banner route-target-banner">
                      <small>用最少步数连接</small>
                      <strong>
                        {PROVINCES.find((item) => item.code === routeChallenge.startCode)?.shortName}
                        <i>→</i>
                        {PROVINCES.find((item) => item.code === routeChallenge.endCode)?.shortName}
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
              ) : level === 16 ? (
                <div className="choice-question is-dual">
                  <span aria-hidden="true">双</span>
                  <p>{currentDualIntruderQuestion?.instruction}</p>
                  <strong>{currentDualIntruderQuestion?.prompt ?? "载入中…"}</strong>
                  <small>城市与省份会交替反向出题</small>
                </div>
              ) : level === 17 ? (
                currentProvinceFeature ? (
                  <ProvinceSilhouette
                    feature={currentProvinceFeature}
                    rotation={(questionIndex * 137 + 47) % 360}
                  />
                ) : <LoadingMap />
              ) : level === 18 ? (
                <div className="choice-question plate-fault-heading">
                  <span aria-hidden="true">查</span>
                  <p>四组对应关系中有且仅有一组错误</p>
                  <strong>找出车牌错误项</strong>
                  <small>城市名称与车牌前缀必须同时匹配</small>
                </div>
              ) : level === 19 ? (
                nationalMap && currentChallengeProvince ? (
                  <div className="gauntlet-map-question">
                    <div className="map-question-banner">
                      <small>点击这个行政中心对应的省级行政区</small>
                      <strong>{PROVINCE_CAPITALS[currentChallengeProvince.code]}</strong>
                    </div>
                    <GauntletNationalMap
                      map={nationalMap}
                      selectedCodes={new Set<string>()}
                      routeCodes={[]}
                      originCode={null}
                      showLabels={false}
                      onProvince={handleGauntletProvince}
                    />
                  </div>
                ) : <LoadingMap />
              ) : level === 20 ? (
                currentBossQuestion?.kind === "map" && nationalMap ? (
                  <div className="gauntlet-map-question boss-question-stage">
                    <div className="map-question-banner">
                      <small>{currentBossQuestion.prompt}</small>
                      <strong>{currentBossQuestion.value}</strong>
                    </div>
                    <GauntletNationalMap
                      map={nationalMap}
                      selectedCodes={new Set<string>()}
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
                    <small>终极混战题型会随时切换</small>
                  </div>
                ) : <LoadingMap />
              ) : level === 5 ? (
                nationalMap && currentChallengeProvince ? (
                  <div className="gauntlet-map-question">
                    <div className="map-question-banner">
                      <small>选出全部陆地邻省</small>
                      <strong>{currentChallengeProvince.name}</strong>
                    </div>
                    <GauntletNationalMap
                      map={nationalMap}
                      selectedCodes={mapSelections}
                      routeCodes={[]}
                      originCode={currentChallengeProvince.code}
                      showLabels
                      onProvince={handleGauntletProvince}
                    />
                  </div>
                ) : <LoadingMap />
              ) : level === 8 ? (
                nationalMap && currentCity ? (
                  <div className="gauntlet-map-question">
                    <div className="map-question-banner">
                      <small>点击它所属的省级行政区</small>
                      <strong>{currentCity.city}</strong>
                    </div>
                    <GauntletNationalMap
                      map={nationalMap}
                      selectedCodes={new Set<string>()}
                      routeCodes={[]}
                      originCode={null}
                      showLabels={false}
                      onProvince={handleGauntletProvince}
                    />
                  </div>
                ) : <LoadingMap />
              ) : level === 10 ? (
                nationalMap ? (
                  <div className="gauntlet-map-question">
                    <div className="map-question-banner">
                      <small>当前省份</small>
                      <strong>{PROVINCES.find((item) => item.code === routeCodes.at(-1))?.name ?? "载入中…"}</strong>
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
              ) : level === 9 ? (
                <div className="truth-question">
                  <span aria-hidden="true">判</span>
                  <p>下面这句话是正确还是错误？</p>
                  <strong>{currentTruthQuestion?.statement ?? "载入中…"}</strong>
                </div>
              ) : level === 7 ? (
                <div className="city-question capital-question">
                  <span aria-hidden="true">都</span>
                  <p>{capitalDirection === "province-to-capital" ? "写出行政中心" : "写出对应省级行政区"}</p>
                  <strong>
                    {capitalDirection === "province-to-capital"
                      ? currentChallengeProvince?.name
                      : currentChallengeProvince
                        ? PROVINCE_CAPITALS[currentChallengeProvince.code]
                        : "载入中…"}
                  </strong>
                  <small>省会、首府、直辖市及特别行政区行政中心均包含在内</small>
                </div>
              ) : level === 6 ? (
                <div className="city-question plate-fill-question">
                  <span aria-hidden="true">补</span>
                  <p>补出这座城市的车牌字母</p>
                  <strong>{currentCity?.city ?? "载入中…"}</strong>
                  <small className="plate-blank">{currentCity ? `${currentCity.plate.slice(0, 1)} ？` : "？"}</small>
                </div>
              ) : (
                <div className={`city-question ${level === 4 ? "is-plate-question" : ""}`}>
                  <span aria-hidden="true">{level === 4 ? "牌" : "城"}</span>
                  <p>{level === 4 ? "这组车牌属于哪里？" : "这座城市属于哪里？"}</p>
                  <strong>{(level === 4 ? currentCity?.plate : currentCity?.city) ?? "载入中…"}</strong>
                  {level === 3 ? <small>还需要写出它的车牌前缀</small> : null}
                  {level === 4 ? <small>需要同时写出省份和城市</small> : null}
                </div>
              )}
            </div>

            <aside className="gauntlet-answer-panel">
              <p className="eyebrow">你的答案</p>
              {level === 11 ? (
                <>
                  <h2>放回正确的省份位置</h2>
                  <p className="map-answer-summary">把左侧上方的轮廓拖到地图；手机端或键盘操作可以直接点击目标省份。</p>
                  <div className="puzzle-progress-dots" aria-label={`已完成 ${mapSelections.size} 块拼图`}>
                    {Array.from({ length: target }, (_, index) => (
                      <i key={index} className={index < mapSelections.size ? "is-done" : ""} />
                    ))}
                  </div>
                </>
              ) : level === 12 ? (
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
              ) : level === 13 ? (
                <>
                  <h2>在左侧省内地图落点</h2>
                  <p className="map-answer-summary">地图只显示市级边界，不显示名称。点击区块后立即判题。</p>
                </>
              ) : level === 14 ? (
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
              ) : level === 15 ? (
                <>
                  <h2>沿陆地邻省走到终点</h2>
                  <p className="map-answer-summary">路线不能重复省份。抵达终点后，系统会检查是否为最短路径。</p>
                  <ol className="province-route" aria-label="当前最短路线尝试">
                    {routeCodes.map((code, index) => (
                      <li key={code}>
                        <span>{index + 1}</span>
                        {PROVINCES.find((item) => item.code === code)?.shortName}
                      </li>
                    ))}
                  </ol>
                </>
              ) : level === 16 ? (
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
              ) : level === 18 ? (
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
              ) : level === 19 ? (
                <>
                  <h2>在左侧地图点击省份</h2>
                  <p className="map-answer-summary">地图不会显示省份名称，点击后立即判题。</p>
                </>
              ) : level === 20 ? (
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
              ) : level === 5 ? (
                <>
                  <h2>选出全部陆地邻省</h2>
                  <p className="map-answer-summary">
                    已选 {mapSelections.size} 个：
                    {Array.from(mapSelections)
                      .map((code) => PROVINCES.find((item) => item.code === code)?.shortName)
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
              ) : level === 8 ? (
                <>
                  <h2>在左侧地图直接落点</h2>
                  <p className="map-answer-summary">地图不显示省份名称。点击一个省级行政区后会立即判题，并自动进入下一题。</p>
                </>
              ) : level === 9 ? (
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
              ) : level === 10 ? (
                <>
                  <h2>选择下一个陆地邻省</h2>
                  <p className="map-answer-summary">走过的省份不能重复。选错或走进死路会随机重置起点。</p>
                  <ol className="province-route" aria-label="当前邻省路线">
                    {routeCodes.map((code, index) => (
                      <li key={code}>
                        <span>{index + 1}</span>
                        {PROVINCES.find((item) => item.code === code)?.shortName}
                      </li>
                    ))}
                  </ol>
                </>
              ) : (
                <>
                  <h2>
                    {level === 1
                      ? "这是哪个省级行政区？"
                      : level === 6
                        ? "填入缺失的车牌字母"
                        : level === 7
                          ? capitalDirection === "province-to-capital"
                            ? "写出行政中心"
                            : "写出对应省级行政区"
                          : "写出所属省份"}
                  </h2>
                  <form onSubmit={submitAnswer}>
                    {level === 6 ? (
                      <>
                        <label htmlFor="gauntlet-plate-answer">车牌字母</label>
                        <input
                          ref={provinceInputRef}
                          id="gauntlet-plate-answer"
                          value={plateAnswer}
                          onChange={(event) => setPlateAnswer(event.target.value)}
                          placeholder="例如：A"
                          autoComplete="off"
                          maxLength={5}
                        />
                      </>
                    ) : (
                      <>
                        <label htmlFor="gauntlet-province-answer">
                          {level === 7 && capitalDirection === "province-to-capital"
                            ? "行政中心名称"
                            : "省份名称"}
                        </label>
                        <input
                          ref={provinceInputRef}
                          id="gauntlet-province-answer"
                          value={provinceAnswer}
                          onChange={(event) => setProvinceAnswer(event.target.value)}
                          placeholder={
                            level === 7 && capitalDirection === "province-to-capital"
                              ? "例如：南京市"
                              : level === 1
                                ? "例如：江苏省"
                                : "例如：江苏"
                          }
                          autoComplete="off"
                        />
                      </>
                    )}
                    {level === 3 ? (
                      <>
                        <label htmlFor="gauntlet-plate-answer">车牌前缀</label>
                        <input
                          id="gauntlet-plate-answer"
                          value={plateAnswer}
                          onChange={(event) => setPlateAnswer(event.target.value)}
                          placeholder="例如：苏A"
                          autoComplete="off"
                          maxLength={5}
                        />
                      </>
                    ) : null}
                    {level === 4 ? (
                      <>
                        <label htmlFor="gauntlet-city-answer">城市名称</label>
                        <input
                          id="gauntlet-city-answer"
                          value={cityAnswer}
                          onChange={(event) => setCityAnswer(event.target.value)}
                          placeholder="例如：南京市"
                          autoComplete="off"
                        />
                      </>
                    ) : null}
                    <button
                      type="submit"
                      disabled={
                        (level === 6 ? !plateAnswer.trim() : !provinceAnswer.trim()) ||
                        (level === 3 && !plateAnswer.trim()) ||
                        (level === 4 && !cityAnswer.trim())
                      }
                    >
                      提交答案
                    </button>
                  </form>
                </>
              )}
              <p className={`gauntlet-feedback is-${feedbackType}`} aria-live="polite">
                {feedback}
              </p>
              {[2, 3, 4, 5, 6, 7, 8, 9, 12, 13, 14, 16, 17, 18, 19].includes(level) ? (
                <p className="streak-note">答错后连胜归零，并自动进入下一题。</p>
              ) : null}
            </aside>
          </section>
        </>
      )}

      {provincePickerOpen && level ? (
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
            <p className="eyebrow">限定出题范围</p>
            <h2 id="province-picker-title">选择省份（可多选）</h2>
            <p className="province-picker-hint">
              {level === 1
                ? "应用后，后续轮廓只会来自所选省份，本轮进度将重新计算。"
                : level === 11
                  ? "应用后，本轮只需把所选省份拼回全国地图。"
                  : level === 17
                    ? "应用后，旋转轮廓只会从所选省份中抽取。"
                    : level === 19
                      ? "应用后，行政中心落点题只会从所选省份中抽取。"
                : level === 5
                  ? "应用后，中心省份只会从所选范围中抽取；答案仍需选择它的全部陆地邻省。"
                  : level === 7
                    ? "应用后，省会与省份题只会来自所选范围，当前连胜将重新计数。"
                    : level === 13
                      ? "市域落点使用省内市级地图，暂不包含四个直辖市。"
                    : "应用后，后续题目只会来自所选省份，当前连胜将重新计数。"}
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
              <span>已选 {draftPickerProvinces.size} / {provincePickerOptions.length}</span>
            </div>
            <div className="province-picker-grid">
              {provincePickerOptions.map((item) => {
                const selected = draftPickerProvinces.has(item.key);
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
                    <small>{item.questionCount} 题</small>
                  </button>
                );
              })}
            </div>
            <div className="province-picker-footer">
              <p>
                {draftPickerProvinces.size === 0
                  ? "请至少选择一个省份"
                  : level === 5 && !draftSelectionValid
                    ? "海南与台湾没有陆地邻省，请再选择其他省份"
                    : (level === 12 || level === 16) && !draftSelectionValid
                      ? "请至少选择一个题库中包含 3 座城市的省份"
                    : level === 18 && !draftSelectionValid
                      ? "车牌找茬至少需要 4 座候选城市"
                    : "应用后将从新范围重新出题"}
              </p>
              <button
                type="button"
                disabled={!draftSelectionValid}
                onClick={applyProvinceSelection}
              >
                应用选择
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

export default function CityGame() {
  const [gauntletOpen, setGauntletOpen] = useState(false);
  const [province, setProvince] = useState<Province | null>(null);
  const [hardMode, setHardMode] = useState(false);
  const [neighborMode, setNeighborMode] = useState(false);
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
  const touchDragRef = useRef<{
    name: string;
    startX: number;
    startY: number;
  } | null>(null);

  const { data: nationalMap, error: nationalError } = useMapData("100000");
  const challengeProvinces = useMemo(() => {
    if (!province) return [];
    const codes = neighborMode
      ? [province.code, ...(PROVINCE_NEIGHBORS[province.code] ?? [])]
      : [province.code];
    return codes
      .map((code) => PROVINCES.find((item) => item.code === code))
      .filter((item): item is Province => Boolean(item));
  }, [neighborMode, province]);
  const challengeCodes = useMemo(
    () => challengeProvinces.map((item) => item.code),
    [challengeProvinces],
  );
  const { data: detailMap, error: detailError } = useMapCollection(challengeCodes);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<
        string,
        string[]
      >;
      progressRef.current = saved;
      const savedHardMode = localStorage.getItem(HARD_MODE_KEY) === "true";
      const savedNeighborMode = localStorage.getItem(NEIGHBOR_MODE_KEY) === "true";
      const savedNeighborProgress = JSON.parse(
        localStorage.getItem(NEIGHBOR_PROGRESS_KEY) ?? "{}",
      ) as Record<string, string[]>;
      neighborProgressRef.current = savedNeighborProgress;
      setHardMode(savedHardMode);
      setNeighborMode(savedNeighborMode);
      if (savedHardMode) {
        setMessage("难度提升：点击省级行政区并输入名称解锁");
      } else if (savedNeighborMode) {
        setMessage("邻省连城：选择一个省份，联动它的所有接壤省份");
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
  }, []);

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
      localStorage.setItem(
        joined ? NEIGHBOR_PROGRESS_KEY : STORAGE_KEY,
        JSON.stringify(progress),
      );
    },
    [],
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
    setCompletedNames((current) => {
      const filtered = new Set(Array.from(current).filter((name) => validNames.has(name)));
      return filtered;
    });
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
    localStorage.setItem(HARD_MODE_KEY, String(next));
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

  const toggleNeighborMode = () => {
    const next = !neighborMode;
    setNeighborMode(next);
    localStorage.setItem(NEIGHBOR_MODE_KEY, String(next));
    setProvince(null);
    setCompletedNames(new Set());
    setSelectedAnswer(null);
    setHoveredName(null);
    setPendingFeature(null);
    setManualAnswer("");
    setManualError("");
    setShowAllCityNames(false);
    setHiddenProvinceCodes(new Set());
    setAttempts(0);
    setMistakes(0);
    setMessage(
      hardMode
        ? "点击省级行政区并输入名称解锁"
        : next
          ? "邻省连城：选择一个省份，联动它的所有接壤省份"
          : "请选择一个省级行政区开始挑战",
    );
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
      localStorage.setItem(
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progressRef.current));
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
    setProvince(null);
    setSelectedAnswer(null);
    setHoveredName(null);
    setPendingFeature(null);
    setManualAnswer("");
    setManualError("");
    setShowAllCityNames(false);
    setHiddenProvinceCodes(new Set());
    setMessage(
      hardMode
        ? "点击省级行政区并输入名称解锁"
        : neighborMode
          ? "邻省连城：选择一个省份，联动它的所有接壤省份"
          : "请选择一个省级行政区开始挑战",
    );
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
            <button
              className="gauntlet-mode-button"
              type="button"
              onClick={() => setGauntletOpen(true)}
            >
              <span aria-hidden="true">关</span>
              过关斩将
            </button>
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
            <span className="map-total">
              {neighborMode ? "选择一省 · 联动接壤省份" : "34 个省级行政区"}
            </span>
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
              showAllLabels={showAllCityNames}
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
        <span>一张地图，497 个待归位的名字</span>
        <span>进度自动保存在当前设备</span>
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
                  value={manualAnswer}
                  autoFocus
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
