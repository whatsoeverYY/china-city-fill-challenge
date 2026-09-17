import { useCallback, useEffect, type MutableRefObject } from "react";
import {
  PROVINCE_BY_CODE,
  type Province,
} from "@/domain/geography/data/provinces";
import { cityChallengePath } from "@/features/city-challenge/config/city-challenge-routes";
import { MAP_COMPLETION_MARKER } from "@/infrastructure/storage/progress-storage";

function provinceChallengeMessage(
  province: Province,
  hardMode: boolean,
  neighborMode: boolean,
) {
  if (hardMode) {
    return neighborMode
      ? "邻省连城：点击联合地图区块并输入名称"
      : "手动填写：点击地图区块并输入名称";
  }
  if (neighborMode) {
    return `把${province.shortName}及所有邻省的城市名称送回正确位置`;
  }
  return province.kind === "直辖市"
    ? `把区县名称放到${province.shortName}地图上的正确位置`
    : `把行政区名称放到${province.shortName}地图上的正确位置`;
}

export function useCityChallengeNavigation({
  initialProvinceCode,
  hardMode,
  neighborMode,
  progressReady,
  neighborProgressRef,
  progressRef,
  setCompletedRegionIds,
  setMessage,
}: {
  initialProvinceCode: string | null;
  hardMode: boolean;
  neighborMode: boolean;
  progressReady: boolean;
  neighborProgressRef: MutableRefObject<Record<string, string[]>>;
  progressRef: MutableRefObject<Record<string, string[]>>;
  setCompletedRegionIds: (value: Set<string>) => void;
  setMessage: (value: string) => void;
}) {
  const province = initialProvinceCode
    ? PROVINCE_BY_CODE.get(initialProvinceCode) ?? null
    : null;

  useEffect(() => {
    if (!province || !progressReady) return;
    const saved = (
      neighborMode ? neighborProgressRef.current : progressRef.current
    )[province.code] ?? [];
    setCompletedRegionIds(new Set(
      saved.filter((regionId) => regionId !== MAP_COMPLETION_MARKER),
    ));
    setMessage(provinceChallengeMessage(province, hardMode, neighborMode));
  }, [
    hardMode, neighborMode, neighborProgressRef, progressReady, progressRef,
    province, setCompletedRegionIds, setMessage,
  ]);

  const enterProvince = useCallback((nextProvince: Province) => {
    window.location.assign(cityChallengePath(nextProvince.code, {
      hardMode,
      neighborMode,
    }));
  }, [hardMode, neighborMode]);

  return { enterProvince, province };
}
