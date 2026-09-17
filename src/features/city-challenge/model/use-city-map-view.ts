import { useMemo } from "react";
import type { Province } from "@/domain/geography/data/provinces";
import { provinceForFeature } from "@/features/map/lib/map-geometry";
import type { MapData } from "@/features/map/model/map-data";
import { PROVINCE_FILL_COLORS } from "@/shared/config/map-colors";

export function useCityMapView(
  nationalMap: MapData | null,
  challengeCodes: string[],
  challengeProvinces: Province[],
) {
  const outlineFeatures = nationalMap?.features.filter((feature) => {
    const province = provinceForFeature(feature);
    return Boolean(province && challengeCodes.includes(province.code));
  }) ?? [];

  const provinceFillColors = useMemo(
    () =>
      Object.fromEntries(
        challengeProvinces.map((province, index) => [
          province.code,
          PROVINCE_FILL_COLORS[index % PROVINCE_FILL_COLORS.length],
        ]),
      ),
    [challengeProvinces],
  );

  return { outlineFeatures, provinceFillColors };
}
