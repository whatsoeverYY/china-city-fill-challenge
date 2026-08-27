import { useEffect, useState } from "react";

export type Position = [number, number];

export type Geometry = {
  type: "Polygon" | "MultiPolygon";
  coordinates: unknown;
};

export type MapFeature = {
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

export type MapData = {
  type: "FeatureCollection";
  features: MapFeature[];
};

const TAIWAN_NAME_MAP: Record<string, string> = {
  連江縣: "连江县", 宜蘭縣: "宜兰县", 彰化縣: "彰化县", 南投縣: "南投县",
  雲林縣: "云林县", 基隆市: "基隆市", 臺北市: "台北市", 新北市: "新北市",
  臺中市: "台中市", 臺南市: "台南市", 桃園市: "桃园市", 苗栗縣: "苗栗县",
  嘉義市: "嘉义市", 嘉義縣: "嘉义县", 金門縣: "金门县", 高雄市: "高雄市",
  臺東縣: "台东县", 花蓮縣: "花莲县", 澎湖縣: "澎湖县", 新竹市: "新竹市",
  新竹縣: "新竹县", 屏東縣: "屏东县",
};

const mapPromiseCache = new Map<string, Promise<MapData>>();

function isMapData(value: unknown): value is MapData {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<MapData>;
  return candidate.type === "FeatureCollection" &&
    Array.isArray(candidate.features) &&
    candidate.features.every((feature) =>
      feature?.type === "Feature" &&
      typeof feature.properties?.name === "string" &&
      (feature.geometry?.type === "Polygon" || feature.geometry?.type === "MultiPolygon") &&
      Array.isArray(feature.geometry.coordinates)
    );
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
          name: code === "710000"
            ? TAIWAN_NAME_MAP[feature.properties.name] ?? feature.properties.name
            : feature.properties.name,
        },
      })),
  };
}

function mapDataUrl(code: string) {
  return new URL(`data/maps/${code}.json`, document.baseURI).toString();
}

export function fetchMapData(code: string) {
  const cached = mapPromiseCache.get(code);
  if (cached) return cached;

  const request = fetch(mapDataUrl(code))
    .then(async (response) => {
      if (!response.ok) throw new Error(`地图载入失败（${response.status}）`);
      const value: unknown = await response.json();
      if (!isMapData(value)) throw new Error("地图数据格式无效");
      return normalizeMap(value, code);
    })
    .catch((error) => {
      mapPromiseCache.delete(code);
      throw error;
    });
  mapPromiseCache.set(code, request);
  return request;
}

export function useMapData(code: string) {
  return useMapCollection([code]);
}

export function useMapCollection(codes: string[]) {
  const codeKey = codes.join(",");
  const [result, setResult] = useState<{
    key: string;
    data: MapData | null;
    error: boolean;
  }>({ key: "", data: null, error: false });
  const data = result.key === codeKey ? result.data : null;
  const error = result.key === codeKey ? result.error : false;

  useEffect(() => {
    let cancelled = false;
    if (!codeKey) return () => {
      cancelled = true;
    };

    const requestedCodes = codeKey.split(",");
    Promise.all(requestedCodes.map(fetchMapData))
      .then((maps) => {
        if (cancelled) return;
        setResult({
          key: codeKey,
          error: false,
          data: {
            type: "FeatureCollection",
            features: maps.flatMap((map, index) => {
              const code = requestedCodes[index];
              return map.features.map((feature) => ({
                ...feature,
                properties: { ...feature.properties, provinceCode: code },
              }));
            }),
          },
        });
      })
      .catch(() => {
        if (!cancelled) setResult({ key: codeKey, data: null, error: true });
      });

    return () => {
      cancelled = true;
    };
  }, [codeKey]);

  return { data, error };
}
