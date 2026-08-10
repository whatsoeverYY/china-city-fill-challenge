"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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

function useMapData(code: string) {
  const [data, setData] = useState<MapData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(false);

    fetch(`/data/maps/${code}.json`)
      .then((response) => {
        if (!response.ok) throw new Error("地图载入失败");
        return response.json() as Promise<MapData>;
      })
      .then((result) => {
        if (!cancelled) setData(normalizeMap(result, code));
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [code]);

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
  provinceOutline,
  onRegion,
  onHover,
}: {
  map: MapData;
  mode: "national" | "detail";
  completedNames: Set<string>;
  completedProvinceCodes: Set<string>;
  selectedAnswer: string | null;
  wrongRegion: string | null;
  provinceOutline?: MapFeature;
  onRegion: (feature: MapFeature, answer?: string) => void;
  onHover: (name: string | null) => void;
}) {
  const project = useMemo(() => makeProjection(map.features), [map]);

  const handleKeyDown = (
    event: React.KeyboardEvent<SVGPathElement>,
    feature: MapFeature,
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onRegion(feature);
    }
  };

  return (
    <svg
      className={`game-map game-map--${mode}`}
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
        {map.features.map((feature) => {
          const province = provinceForFeature(feature);
          const isComplete =
            mode === "national"
              ? Boolean(province && completedProvinceCodes.has(province.code))
              : completedNames.has(feature.properties.name);
          const path = geometryToPath(feature.geometry, project);
          return (
            <path
              key={`${feature.properties.name}-${String(feature.properties.adcode)}`}
              d={path}
              className={`map-region ${isComplete ? "is-complete" : ""} ${
                wrongRegion === feature.properties.name ? "is-wrong" : ""
              } ${selectedAnswer && mode === "detail" ? "is-targetable" : ""}`}
              data-region-name={feature.properties.name}
              fillRule="evenodd"
              role="button"
              tabIndex={0}
              aria-label={
                mode === "national"
                  ? `${feature.properties.name}${isComplete ? "，已完成" : "，未完成"}`
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

      {mode === "detail" && provinceOutline ? (
        <path
          className="province-outline"
          d={geometryToPath(provinceOutline.geometry, project)}
          fill="none"
          fillRule="evenodd"
          aria-hidden="true"
        />
      ) : null}

      {mode === "detail"
        ? map.features
            .filter((feature) => completedNames.has(feature.properties.name))
            .map((feature) => {
              const [x, y] = featureLabelPosition(feature, project);
              const name = feature.properties.name;
              return (
                <text
                  key={`label-${name}`}
                  x={x}
                  y={y}
                  className={`region-label ${name.length > 7 ? "is-long" : ""}`}
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

export default function CityGame() {
  const [province, setProvince] = useState<Province | null>(null);
  const [completedNames, setCompletedNames] = useState<Set<string>>(new Set());
  const [completedProvinceCodes, setCompletedProvinceCodes] = useState<Set<string>>(
    new Set(),
  );
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hoveredName, setHoveredName] = useState<string | null>(null);
  const [wrongRegion, setWrongRegion] = useState<string | null>(null);
  const [message, setMessage] = useState("请选择一个省级行政区开始挑战");
  const [attempts, setAttempts] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [showAllProvinces, setShowAllProvinces] = useState(false);
  const [dragGhost, setDragGhost] = useState<{
    name: string;
    x: number;
    y: number;
  } | null>(null);
  const progressRef = useRef<Record<string, string[]>>({});
  const touchDragRef = useRef<{
    name: string;
    startX: number;
    startY: number;
  } | null>(null);

  const { data: nationalMap, error: nationalError } = useMapData("100000");
  const { data: detailMap, error: detailError } = useMapData(
    province?.code ?? "100000",
  );

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<
        string,
        string[]
      >;
      progressRef.current = saved;
      setCompletedProvinceCodes(
        new Set(
          PROVINCES.filter(
            (item) => saved[item.code]?.length && saved[item.code][0] === "__complete__",
          ).map((item) => item.code),
        ),
      );
    } catch {
      progressRef.current = {};
    }
  }, []);

  const answerNames = useMemo(
    () => detailMap?.features.map((feature) => feature.properties.name) ?? [],
    [detailMap],
  );

  const shuffledAnswers = useMemo(
    () => deterministicShuffle(answerNames, province?.code ?? "1"),
    [answerNames, province?.code],
  );

  const isProvinceComplete =
    Boolean(province) &&
    answerNames.length > 0 &&
    completedNames.size === answerNames.length;

  const saveProgress = useCallback(
    (code: string, names: Set<string>, complete: boolean) => {
      progressRef.current[code] = complete
        ? ["__complete__", ...Array.from(names)]
        : Array.from(names);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progressRef.current));
    },
    [],
  );

  const enterProvince = useCallback(
    (nextProvince: Province) => {
      setProvince(nextProvince);
      const saved = progressRef.current[nextProvince.code] ?? [];
      setCompletedNames(new Set(saved.filter((name) => name !== "__complete__")));
      setSelectedAnswer(null);
      setHoveredName(null);
      setWrongRegion(null);
      setAttempts(0);
      setMistakes(0);
      setMessage(
        nextProvince.kind === "直辖市"
          ? `把区县名称放到${nextProvince.shortName}地图上的正确位置`
          : `把行政区名称放到${nextProvince.shortName}地图上的正确位置`,
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [],
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
          ? `${province.name}全部完成！`
          : `正确！${regionName}已填入地图`,
      );
      saveProgress(province.code, next, complete);
      if (complete) {
        setCompletedProvinceCodes((current) => new Set(current).add(province.code));
      }
    },
    [completedNames, detailMap, province, saveProgress, selectedAnswer],
  );

  const handleMapRegion = (feature: MapFeature, draggedAnswer?: string) => {
    if (!province) {
      const selectedProvince = provinceForFeature(feature);
      if (selectedProvince) enterProvince(selectedProvince);
      return;
    }
    handleGuess(feature.properties.name, draggedAnswer);
  };

  const resetProvince = () => {
    if (!province) return;
    setCompletedNames(new Set());
    setCompletedProvinceCodes((current) => {
      const next = new Set(current);
      next.delete(province.code);
      return next;
    });
    progressRef.current[province.code] = [];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progressRef.current));
    setSelectedAnswer(null);
    setAttempts(0);
    setMistakes(0);
    setMessage(`已重置${province.shortName}，重新开始吧`);
  };

  const backToNational = () => {
    setProvince(null);
    setSelectedAnswer(null);
    setHoveredName(null);
    setMessage("请选择一个省级行政区开始挑战");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const visibleProvinceList = showAllProvinces
    ? PROVINCES
    : PROVINCES.filter((item) => !completedProvinceCodes.has(item.code));

  const outlineFeature = nationalMap?.features.find(
    (feature) => provinceForFeature(feature)?.code === province?.code,
  );

  const mapError = province ? detailError : nationalError;
  const activeMap = province ? detailMap : nationalMap;
  const accuracy = attempts === 0 ? 100 : Math.round(((attempts - mistakes) / attempts) * 100);

  return (
    <main className="game-shell">
      <header className="site-header">
        <button className="brand" type="button" onClick={backToNational}>
          <span className="brand-seal" aria-hidden="true">城</span>
          <span>
            <strong>中国城市填充挑战</strong>
            <small>CHINA CITY ATLAS</small>
          </span>
        </button>
        <div className="national-progress" aria-label={`已完成 ${completedProvinceCodes.size} 个省级行政区`}>
          <span>全国进度</span>
          <strong>{completedProvinceCodes.size}<i>/34</i></strong>
          <div className="progress-track" aria-hidden="true">
            <span style={{ width: `${(completedProvinceCodes.size / 34) * 100}%` }} />
          </div>
        </div>
      </header>

      <section className="intro-row">
        <div>
          <p className="eyebrow">拖动 · 辨认 · 探索</p>
          <h1>
            {province ? (
              <>
                <span>{province.shortName}</span>，你认识多少座城？
              </>
            ) : (
              <>从一省出发，拼出整幅中国城市地图</>
            )}
          </h1>
          <p className="lede">
            {province
              ? province.kind === "直辖市"
                ? `将下方的区县名称拖到地图中。完成 ${province.name} 的全部 ${answerNames.length || "…"} 个区县即可点亮印章。`
                : `将下方的行政区名称拖到地图中。完成 ${province.name} 的全部 ${answerNames.length || "…"} 个区域即可点亮印章。`
              : "点击地图或省份名进入挑战。红色标出省级边界，进入省内后，绿色标出地市或区县边界。"}
          </p>
        </div>
        <div className="legend-card" aria-label="地图图例">
          <p><span className="legend-line legend-line--red" />省级边界</p>
          <p><span className="legend-line legend-line--green" />地市 / 区县边界</p>
          <p><span className="legend-fill" />已正确填入</p>
        </div>
      </section>

      {isProvinceComplete && province ? (
        <section className="success-banner" aria-live="polite">
          <span className="success-kicker">挑战达成</span>
          <strong>{province.name}</strong>
          <span className="success-icon" aria-label="成功">✓</span>
          <p>这片区域的每一个名字，都已回到正确的位置。</p>
        </section>
      ) : null}

      <div className={`challenge-layout ${province ? "" : "is-national"}`}>
      <section className="map-card">
        <div className="map-toolbar">
          <div>
            {province ? (
              <button className="back-button" type="button" onClick={backToNational}>
                <span aria-hidden="true">←</span> 返回全国地图
              </button>
            ) : (
              <span className="map-step">第一步 · 选择省级行政区</span>
            )}
          </div>
          <div className="map-status" aria-live="polite">
            <span className={`status-dot ${isProvinceComplete ? "is-complete" : ""}`} />
            {hoveredName && !province
              ? hoveredName
              : hoveredName && completedNames.has(hoveredName)
                ? `已填入：${hoveredName}`
                : message}
          </div>
          {province ? (
            <button className="reset-button" type="button" onClick={resetProvince}>
              重新挑战
            </button>
          ) : (
            <span className="map-total">34 个省级行政区</span>
          )}
        </div>

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
              completedProvinceCodes={completedProvinceCodes}
              selectedAnswer={selectedAnswer}
              wrongRegion={wrongRegion}
              provinceOutline={outlineFeature}
              onRegion={handleMapRegion}
              onHover={setHoveredName}
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
        <section className="answer-dock" aria-labelledby="answer-title">
          <div className="dock-heading">
            <div>
              <p className="eyebrow">名称卡片</p>
              <h2 id="answer-title">把名字送回地图</h2>
            </div>
            <p><span className="mouse-mark" aria-hidden="true">↖</span> 拖拽到区块，或先点名称再点地图</p>
          </div>
          <div className="answer-grid">
            {shuffledAnswers.map((name) => {
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
      ) : null}
      </div>

      {!province ? (
        <section className="province-dock" aria-labelledby="province-title">
          <div className="dock-heading">
            <div>
              <p className="eyebrow">34 个省级行政区</p>
              <h2 id="province-title">也可以从名称进入</h2>
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
              const complete = completedProvinceCodes.has(item.code);
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
            <div className="all-complete-note">全国 34 个省级行政区已全部点亮，太厉害了！</div>
          ) : null}
        </section>
      ) : null}

      <footer>
        <span>一张地图，497 个待归位的名字</span>
        <span>进度自动保存在当前设备</span>
      </footer>

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
