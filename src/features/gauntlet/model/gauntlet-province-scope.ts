import { CITY_QUIZ_DATA, PLATE_QUIZ_DATA } from "@/domain/geography/data/city-plates";
import { PROVINCES } from "@/domain/geography/data/provinces";
import { MAP_REGION_QUIZ_DATA } from "@/features/gauntlet/data/map-region-quiz-data";

export const GAUNTLET_PROVINCE_PICKER_OPTIONS = PROVINCES.map((province) => ({
  key: province.code,
  shortName: province.shortName,
  kind: province.kind,
  cityCount: CITY_QUIZ_DATA.filter((city) => city.provinceCode === province.code).length,
  plateCount: PLATE_QUIZ_DATA.filter((item) => item.provinceCode === province.code).length,
  mapRegionCount: MAP_REGION_QUIZ_DATA.filter(
    (region) => region.provinceCode === province.code,
  ).length,
}));

export function summarizeGauntletProvinceScope(selectedCodes: Set<string>) {
  const names = PROVINCES
    .filter((province) => selectedCodes.has(province.code))
    .map((province) => province.shortName);
  if (selectedCodes.size === PROVINCES.length) return `全国 ${PROVINCES.length} 个省级行政区`;
  return names.length <= 6
    ? names.join("、")
    : `${names.slice(0, 5).join("、")}等 ${names.length} 个`;
}
