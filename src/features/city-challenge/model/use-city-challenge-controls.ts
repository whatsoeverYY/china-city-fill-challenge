import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { Province } from "@/domain/geography/data/provinces";
import type { MapFeature } from "@/features/map/model/map-data";
import type { CityAnswer } from "@/features/city-challenge/model/city-challenge-types";
import { nationalChallengeMessage } from "@/features/city-challenge/model/use-city-progress";
import {
  HARD_MODE_KEY,
  NEIGHBOR_MODE_KEY,
  NEIGHBOR_PROGRESS_KEY,
  STORAGE_KEY,
  type ProgressStorage,
} from "@/infrastructure/storage/progress-storage";

type Options = {
  answerById: Map<string, CityAnswer>;
  challengeCodes: string[];
  hardMode: boolean;
  hiddenProvinceCodes: Set<string>;
  neighborMode: boolean;
  neighborProgressRef: MutableRefObject<Record<string, string[]>>;
  progressRef: MutableRefObject<Record<string, string[]>>;
  progressStorage: ProgressStorage;
  province: Province | null;
  selectedAnswerId: string | null;
  setAttempts: Dispatch<SetStateAction<number>>;
  setCompletedNeighborCodes: Dispatch<SetStateAction<Set<string>>>;
  setCompletedProvinceCodes: Dispatch<SetStateAction<Set<string>>>;
  setCompletedRegionIds: Dispatch<SetStateAction<Set<string>>>;
  setHardMode: Dispatch<SetStateAction<boolean>>;
  setHiddenProvinceCodes: Dispatch<SetStateAction<Set<string>>>;
  setHoveredFeature: Dispatch<SetStateAction<MapFeature | null>>;
  setManualAnswer: Dispatch<SetStateAction<string>>;
  setManualError: Dispatch<SetStateAction<string>>;
  setMessage: Dispatch<SetStateAction<string>>;
  setMistakes: Dispatch<SetStateAction<number>>;
  setNeighborMode: Dispatch<SetStateAction<boolean>>;
  setPendingFeature: Dispatch<SetStateAction<MapFeature | null>>;
  setProvince: Dispatch<SetStateAction<Province | null>>;
  setSelectedAnswerId: Dispatch<SetStateAction<string | null>>;
  setShowAllCityNames: Dispatch<SetStateAction<boolean>>;
  setShowAllProvinceNames: Dispatch<SetStateAction<boolean>>;
};

export function useCityChallengeControls(options: Options) {
  const {
    answerById, challengeCodes, hardMode, hiddenProvinceCodes, neighborMode,
    neighborProgressRef, progressRef, progressStorage, province, selectedAnswerId,
    setAttempts, setCompletedNeighborCodes, setCompletedProvinceCodes,
    setCompletedRegionIds, setHardMode, setHiddenProvinceCodes, setHoveredFeature,
    setManualAnswer, setManualError, setMessage, setMistakes, setNeighborMode,
    setPendingFeature, setProvince, setSelectedAnswerId, setShowAllCityNames,
    setShowAllProvinceNames,
  } = options;

  const clearProvinceView = () => {
    setProvince(null);
    setSelectedAnswerId(null);
    setHoveredFeature(null);
    setPendingFeature(null);
    setManualAnswer("");
    setManualError("");
    setShowAllCityNames(false);
    setHiddenProvinceCodes(new Set());
  };

  const toggleHardMode = () => {
    const next = !hardMode;
    setHardMode(next);
    if (next) setShowAllProvinceNames(false);
    progressStorage.setItem(HARD_MODE_KEY, String(next));
    setPendingFeature(null);
    setManualAnswer("");
    setManualError("");
    setSelectedAnswerId(null);
    setHoveredFeature(null);
    setMessage(
      next
        ? province
          ? neighborMode ? "邻省连城：点击联合地图区块并输入名称" : "难度提升：点击地图区块并输入名称"
          : "难度提升：点击省级行政区并输入名称解锁"
        : province
          ? neighborMode ? "名称卡片已恢复，完成整片联合区域吧" : "名称提示已恢复，可以拖拽或点选作答"
          : neighborMode ? "邻省连城：选择一个省份，联动它的所有接壤省份" : "省份名称已恢复，选择一个省级行政区开始挑战",
    );
  };

  const toggleNeighborMode = () => {
    const next = !neighborMode;
    setNeighborMode(next);
    progressStorage.setItem(NEIGHBOR_MODE_KEY, String(next));
    clearProvinceView();
    setCompletedRegionIds(new Set());
    setAttempts(0);
    setMistakes(0);
    setMessage(nationalChallengeMessage(hardMode, next));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetProvince = () => {
    if (!province) return;
    setCompletedRegionIds(new Set());
    if (neighborMode) {
      setCompletedNeighborCodes((current) => {
        const next = new Set(current);
        next.delete(province.code);
        return next;
      });
      neighborProgressRef.current[province.code] = [];
      progressStorage.setItem(NEIGHBOR_PROGRESS_KEY, JSON.stringify(neighborProgressRef.current));
    } else {
      setCompletedProvinceCodes((current) => {
        const next = new Set(current);
        next.delete(province.code);
        return next;
      });
      progressRef.current[province.code] = [];
      progressStorage.setItem(STORAGE_KEY, JSON.stringify(progressRef.current));
    }
    setSelectedAnswerId(null);
    setShowAllCityNames(false);
    setHiddenProvinceCodes(new Set());
    setAttempts(0);
    setMistakes(0);
    setMessage(neighborMode
      ? `已重置以${province.shortName}为起点的联合挑战`
      : `已重置${province.shortName}，重新开始吧`);
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
      if (selectedAnswerId && answerById.get(selectedAnswerId)?.provinceCode === item.code) {
        setSelectedAnswerId(null);
      }
      setMessage(`已隐藏${item.shortName}，再次点击名称可恢复`);
    }
    setHoveredFeature(null);
    setHiddenProvinceCodes(next);
  };

  return {
    backToNational,
    resetProvince,
    toggleHardMode,
    toggleNeighborMode,
    toggleProvinceVisibility,
  };
}
