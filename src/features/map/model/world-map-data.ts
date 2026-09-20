import { useEffect, useState } from "react";
import type { Geometry, Position } from "./map-data.ts";
import { appPath } from "../../../shared/lib/app-path.ts";

export type WorldMapFeature = {
  type: "Feature";
  properties: {
    id: string;
    name: string;
    englishName?: string;
    m49Code?: string;
    isoAlpha3?: string;
    continentId?: string;
    label?: Position;
    playable: boolean;
    shapeEligible?: boolean;
  };
  geometry: Geometry;
};

export type WorldMapData = {
  type: "FeatureCollection";
  mapDataAsOf: string;
  sourceVersion: string;
  sourceRetrievedAt: string;
  sourceItemId: string;
  sourceUrl: string;
  audit: {
    studyCountryGeometryCount: number;
    sourceFeatureCount: number;
  };
  features: WorldMapFeature[];
};

let worldMapData: WorldMapData | null = null;
let worldMapPromise: Promise<WorldMapData> | null = null;

function isWorldMapData(value: unknown): value is WorldMapData {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<WorldMapData>;
  return candidate.type === "FeatureCollection" &&
    typeof candidate.mapDataAsOf === "string" &&
    typeof candidate.sourceVersion === "string" &&
    typeof candidate.sourceRetrievedAt === "string" &&
    typeof candidate.sourceItemId === "string" &&
    Array.isArray(candidate.features) &&
    candidate.features.every((feature) =>
      feature?.type === "Feature" &&
      typeof feature.properties?.id === "string" &&
      typeof feature.properties?.name === "string" &&
      typeof feature.properties?.playable === "boolean" &&
      (feature.geometry?.type === "Polygon" ||
        feature.geometry?.type === "MultiPolygon") &&
      Array.isArray(feature.geometry.coordinates)
    );
}

export function worldMapFeatureId(feature: WorldMapFeature) {
  return feature.properties.id;
}

export function fetchWorldMapData() {
  if (worldMapData) return Promise.resolve(worldMapData);
  if (worldMapPromise) return worldMapPromise;
  const url = new URL(
    appPath("/data/maps/world/50m.json"),
    document.baseURI,
  ).toString();
  worldMapPromise = fetch(url)
    .then(async (response) => {
      if (!response.ok) throw new Error(`世界地图载入失败（${response.status}）`);
      const value: unknown = await response.json();
      if (!isWorldMapData(value)) throw new Error("世界地图数据格式无效");
      worldMapData = value;
      return value;
    })
    .catch((error) => {
      worldMapPromise = null;
      throw error;
    });
  return worldMapPromise;
}

export function useWorldMapData() {
  const [result, setResult] = useState<{
    data: WorldMapData | null;
    error: boolean;
  }>(() => ({ data: worldMapData, error: false }));

  useEffect(() => {
    let cancelled = false;
    fetchWorldMapData()
      .then((data) => {
        if (!cancelled) setResult({ data, error: false });
      })
      .catch(() => {
        if (!cancelled) setResult({ data: null, error: true });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return result;
}
