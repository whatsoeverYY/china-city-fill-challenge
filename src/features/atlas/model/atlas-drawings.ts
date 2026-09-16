import { PLATE_QUIZ_DATA } from "@/domain/geography/data/city-plates";
import { PROVINCE_PLATE_PREFIXES, PROVINCES } from "@/domain/geography/data/provinces";
import type { AtlasProvinceDrawing, AtlasRegionDrawing } from "./atlas-types";
import {
  featureLabelPosition,
  geometryToPath,
  PROVINCE_FILL_COLORS,
} from "@/features/map/lib/map-geometry";
import {
  mapFeatureId,
  type MapData,
  type Position,
} from "@/features/map/model/map-data";

type Project = (position: Position) => Position;

const CITY_PLATE_BY_REGION_ID = new Map(
  PLATE_QUIZ_DATA
    .filter((item) => item.regionCode)
    .map((item) => [item.regionCode!, item.plate]),
);

export function createProvinceFillColors() {
  return Object.fromEntries(
    PROVINCES.map((province, index) => [
      province.code,
      PROVINCE_FILL_COLORS[index % PROVINCE_FILL_COLORS.length],
    ]),
  );
}

export function createAtlasRegions(
  map: MapData | null,
  project: Project | null,
  provinceFillColors: Record<string, string>,
): AtlasRegionDrawing[] {
  if (!map || !project) return [];
  return map.features.map((feature) => {
    const regionId = mapFeatureId(feature);
    const provinceCode = feature.properties.provinceCode ?? "";
    const name = feature.properties.name;
    const [labelX, labelY] = featureLabelPosition(feature, project);
    return {
      key: regionId,
      path: geometryToPath(feature.geometry, project),
      fill: provinceFillColors[provinceCode] ?? "#ece4d4",
      name,
      plate:
        CITY_PLATE_BY_REGION_ID.get(regionId) ??
        PROVINCE_PLATE_PREFIXES[provinceCode] ??
        "—",
      labelX,
      labelY,
      longLabel: name.length > 6,
    };
  });
}

export function createAtlasProvinceDrawings(
  nationalMap: MapData | null,
  project: Project | null,
): AtlasProvinceDrawing[] {
  if (!nationalMap || !project) return [];
  return nationalMap.features.map((feature) => ({
    key: mapFeatureId(feature),
    path: geometryToPath(feature.geometry, project),
  }));
}
