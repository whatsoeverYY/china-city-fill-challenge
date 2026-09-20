import { useEffect, useState } from "react";
import { appPath } from "../../../shared/lib/app-path.ts";

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

const TAIWAN_PROVINCE_CODE = "710000";

export function mapFeatureId(feature: MapFeature) {
  const { adcode } = feature.properties;
  if (adcode === undefined || adcode === null || String(adcode).length === 0) {
    throw new Error(`地图区块缺少行政区划代码：${feature.properties.name}`);
  }
  return String(adcode);
}

const TAIWAN_NAME_MAP: Record<string, string> = {
  連江縣: "连江县", 宜蘭縣: "宜兰县", 彰化縣: "彰化县", 南投縣: "南投县",
  雲林縣: "云林县", 基隆市: "基隆市", 臺北市: "台北市", 新北市: "新北市",
  臺中市: "台中市", 臺南市: "台南市", 桃園市: "桃园市", 苗栗縣: "苗栗县",
  嘉義市: "嘉义市", 嘉義縣: "嘉义县", 金門縣: "金门县", 高雄市: "高雄市",
  臺東縣: "台东县", 花蓮縣: "花莲县", 澎湖縣: "澎湖县", 新竹市: "新竹市",
  新竹縣: "新竹县", 屏東縣: "屏东县",
};

export function normalizeMapRegionName(name: string, code: string) {
  return code === TAIWAN_PROVINCE_CODE ? TAIWAN_NAME_MAP[name] ?? name : name;
}

const mapPromiseCache = new Map<string, Promise<MapData>>();
const mapDataCache = new Map<string, MapData>();
const mapCollectionCache = new Map<string, MapData>();

function isMapData(value: unknown): value is MapData {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<MapData>;
  return candidate.type === "FeatureCollection" &&
    Array.isArray(candidate.features) &&
    candidate.features.every((feature) =>
      feature?.type === "Feature" &&
      typeof feature.properties?.name === "string" &&
      (typeof feature.properties?.adcode === "string" ||
        typeof feature.properties?.adcode === "number") &&
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
          name: normalizeMapRegionName(feature.properties.name, code),
        },
      })),
  };
}

function mapDataUrl(code: string) {
  return new URL(appPath(`/data/maps/${code}.json`), document.baseURI).toString();
}

function createMapCollection(codes: string[], maps: MapData[]): MapData {
  const codeKey = codes.join(",");
  const cached = mapCollectionCache.get(codeKey);
  if (cached) return cached;

  const collection: MapData = {
    type: "FeatureCollection",
    features: maps.flatMap((map, index) => {
      const code = codes[index];
      return map.features.map((feature) => ({
        ...feature,
        properties: { ...feature.properties, provinceCode: code },
      }));
    }),
  };
  mapCollectionCache.set(codeKey, collection);
  return collection;
}

function getCachedMapCollection(codes: string[]) {
  if (codes.length === 0) return null;

  const cachedCollection = mapCollectionCache.get(codes.join(","));
  if (cachedCollection) return cachedCollection;

  const maps = codes.map((code) => mapDataCache.get(code));
  if (!maps.every((map): map is MapData => Boolean(map))) return null;
  return createMapCollection(codes, maps);
}

export function fetchMapData(code: string) {
  const cachedData = mapDataCache.get(code);
  if (cachedData) return Promise.resolve(cachedData);

  const cached = mapPromiseCache.get(code);
  if (cached) return cached;

  const request = fetch(mapDataUrl(code))
    .then(async (response) => {
      if (!response.ok) throw new Error(`地图载入失败（${response.status}）`);
      const value: unknown = await response.json();
      if (!isMapData(value)) throw new Error("地图数据格式无效");
      const data = normalizeMap(value, code);
      mapDataCache.set(code, data);
      return data;
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
  const requestedCodes = codeKey ? codeKey.split(",") : [];
  const cachedData = getCachedMapCollection(requestedCodes);
  const data = result.key === codeKey ? result.data ?? cachedData : cachedData;
  const error = cachedData
    ? false
    : result.key === codeKey
      ? result.error
      : false;

  useEffect(() => {
    let cancelled = false;
    if (!codeKey) return () => {
      cancelled = true;
    };

    const requestedCodes = codeKey.split(",");
    const cachedCollection = getCachedMapCollection(requestedCodes);
    if (cachedCollection) return () => {
      cancelled = true;
    };

    Promise.all(requestedCodes.map(fetchMapData))
      .then((maps) => {
        if (cancelled) return;
        setResult({
          key: codeKey,
          error: false,
          data: createMapCollection(requestedCodes, maps),
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
