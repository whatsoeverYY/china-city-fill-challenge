"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { UNIVERSITY_QUIZ_DATA } from "@/domain/geography/data/universities";
import { PROVINCE_NEIGHBORS, PROVINCES } from "@/domain/geography/data/provinces";
import { PROVINCE_GROUPS } from "@/domain/geography/data/geographic-groups";
import {
  ALL_CITY_ROUTE_PROVINCE_CODES,
  FIXED_SCOPE_LEVELS,
  GAUNTLET_FIXED_TARGETS,
  GAUNTLET_REGION_MAP_MAX_TARGET,
  parseGauntletProvinceScope,
  PLATE_QUESTION_LEVELS,
  readRecentQuestionHistory,
  ROTATED_SILHOUETTE_STREAK_TARGET,
} from "@/features/gauntlet/config/gauntlet-config";
import {
  CITY_QUIZ_DATA,
  PLATE_QUIZ_DATA,
  uniqueReversePlateItems,
} from "@/domain/geography/data/city-plates";
import {
  GAUNTLET_LEVEL_ID,
  isGauntletLevelId,
} from "@/domain/game/gauntlet-level-ids";
import { MAP_REGION_QUIZ_DATA } from "@/features/gauntlet/data/map-region-quiz-data";
import {
  cityQuizKey,
} from "@/features/gauntlet/model/city-map-question-queue";
import {
  buildCityAdjacencyMap,
  createCityRouteChallenge,
} from "@/features/gauntlet/model/city-route";
import type { GauntletLevel } from "@/features/gauntlet/model/gauntlet-types";
import { useGauntletSession } from "@/features/gauntlet/model/gauntlet-session-context";
import { normalizeMistakeList } from "@/domain/game/mistakes";
import { provinceForFeature } from "@/features/map/lib/map-geometry";
import { useMapCollection } from "@/features/map/model/map-data";
import {
  GAUNTLET_MISTAKES_KEY,
  GAUNTLET_PLATE_CITY_MAP_HISTORY_KEY,
  GAUNTLET_PROGRESS_KEY,
  GAUNTLET_PROVINCE_SCOPE_KEY,
  GAUNTLET_REGION_MAP_HISTORY_KEY,
} from "@/infrastructure/storage/progress-storage";
import { hasCityGroupWithMinimum } from "./question-generators";

const LEVEL = GAUNTLET_LEVEL_ID;

function useGauntletDerivedValue() {
  const session = useGauntletSession();
  const {
    answerReview, bossLives, bossOrder, cityOrder, cityRouteAttempt,
    cityRouteProvinceOrder, confusableOrder, draftShapeProvinceCodes,
    dualIntruderOrder, groupOrder, level, mapRegionOrder, mapSelections,
    mistakeOrder, mistakeSessionTotal, nationalMap, passedLevel,
    plateCityMapFocusedProvinceCode, plateFaultOrder, progressStorage,
    provinceChallengeOrder, provinceCityCountOrder, provinceOrder,
    provincePickerOpen, questionIndex, routeCodes, selectedShapeProvinceCodes,
    setCityRouteAttempt, setCompletedLevels, setDraftShapeProvinceCodes,
    setMistakes, setProvinceScopeReady, setSelectedShapeProvinceCodes,
    setTimeLeft, streak, timeLeft, timeLimit, truthOrder, undercoverOrder,
    universityOrder, regionMapHistoryRef, plateCityMapHistoryRef,
  } = session;
  const timedMode = timeLimit > 0;
  const selectedQuizProvinces = useMemo(
    () => new Set(
      CITY_QUIZ_DATA
        .filter((item) => selectedShapeProvinceCodes.has(item.provinceCode))
        .map((item) => item.provinceCode),
    ),
    [selectedShapeProvinceCodes],
  );
  const selectedUniversityProvinces = useMemo(
    () => new Set(
      UNIVERSITY_QUIZ_DATA
        .filter((item) => selectedShapeProvinceCodes.has(item.provinceCode))
        .map((item) => item.provinceCode),
    ),
    [selectedShapeProvinceCodes],
  );
  const selectedCityRouteProvinceCodes = useMemo(
    () => new Set(
      ALL_CITY_ROUTE_PROVINCE_CODES.filter((code) =>
        selectedShapeProvinceCodes.has(code)
      ),
    ),
    [selectedShapeProvinceCodes],
  );
  const provincePickerOptions = useMemo(
    () => PROVINCES.map((province) => ({
      key: province.code,
      shortName: province.shortName,
      kind: province.kind,
      cityCount: CITY_QUIZ_DATA.filter(
        (city) => city.provinceCode === province.code,
      ).length,
      plateCount: PLATE_QUIZ_DATA.filter(
        (region) => region.provinceCode === province.code,
      ).length,
      mapRegionCount: MAP_REGION_QUIZ_DATA.filter(
        (region) => region.provinceCode === province.code,
      ).length,
    })),
    [],
  );
  const selectedProvinceNames = useMemo(
    () => PROVINCES
      .filter((item) => selectedShapeProvinceCodes.has(item.code))
      .map((item) => item.shortName),
    [selectedShapeProvinceCodes],
  );
  const provinceScopeSummary = selectedShapeProvinceCodes.size === PROVINCES.length
    ? "全国 34 个省级行政区"
    : selectedProvinceNames.length <= 6
      ? selectedProvinceNames.join("、")
      : `${selectedProvinceNames.slice(0, 5).join("、")}等 ${selectedProvinceNames.length} 个`;

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const saved = JSON.parse(
          progressStorage.getItem(GAUNTLET_PROGRESS_KEY) ?? "[]",
        ) as unknown;
        const completedLevelIds = Array.isArray(saved)
          ? Array.from(new Set(saved.filter(isGauntletLevelId)))
          : [];
        setCompletedLevels(new Set(completedLevelIds));
        if (JSON.stringify(saved) !== JSON.stringify(completedLevelIds)) {
          progressStorage.setItem(
            GAUNTLET_PROGRESS_KEY,
            JSON.stringify(completedLevelIds),
          );
        }
      } catch {
        setCompletedLevels(new Set());
      }
      try {
        const savedMistakes = JSON.parse(
          progressStorage.getItem(GAUNTLET_MISTAKES_KEY) ?? "[]",
        ) as unknown[];
        setMistakes(normalizeMistakeList(savedMistakes));
      } catch {
        setMistakes([]);
      }
      const savedProvinceScope = parseGauntletProvinceScope(
        progressStorage.getItem(GAUNTLET_PROVINCE_SCOPE_KEY),
      );
      setSelectedShapeProvinceCodes(savedProvinceScope);
      setDraftShapeProvinceCodes(new Set(savedProvinceScope));
      setProvinceScopeReady(true);
      regionMapHistoryRef.current = readRecentQuestionHistory(
        progressStorage,
        GAUNTLET_REGION_MAP_HISTORY_KEY,
      );
      plateCityMapHistoryRef.current = readRecentQuestionHistory(
        progressStorage,
        GAUNTLET_PLATE_CITY_MAP_HISTORY_KEY,
      );
    });
    return () => {
      cancelled = true;
    };
  }, [
    plateCityMapHistoryRef,
    progressStorage,
    regionMapHistoryRef,
    setCompletedLevels,
    setDraftShapeProvinceCodes,
    setMistakes,
    setProvinceScopeReady,
    setSelectedShapeProvinceCodes,
  ]);

  useEffect(() => {
    if (
      !timedMode || !level || passedLevel || timeLeft === 0 ||
      provincePickerOpen || answerReview
    ) return;
    const timer = window.setInterval(() => {
      setTimeLeft((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [
    answerReview, level, passedLevel, provincePickerOpen, setTimeLeft,
    timeLeft, timedMode,
  ]);

  const provinceShapeNormalTarget = provinceOrder.length;
  const isRotatedProvinceShapeStage = Boolean(
    level === LEVEL.PROVINCE_SHAPE && provinceShapeNormalTarget > 0 &&
    questionIndex >= provinceShapeNormalTarget,
  );
  const currentProvinceFeature = provinceOrder.length
    ? provinceOrder[
        isRotatedProvinceShapeStage
          ? (questionIndex - provinceShapeNormalTarget) % provinceOrder.length
          : questionIndex
      ] ?? null
    : null;
  const currentProvince = currentProvinceFeature
    ? provinceForFeature(currentProvinceFeature)
    : null;
  const currentCity = cityOrder.length
    ? cityOrder[questionIndex % cityOrder.length]
    : null;
  const currentMapRegion = mapRegionOrder[questionIndex] ?? null;
  const cityPoolSize = useMemo(
    () => new Set(cityOrder.map(cityQuizKey)).size,
    [cityOrder],
  );
  const mapRegionPoolSize = useMemo(
    () => new Set(mapRegionOrder.map(cityQuizKey)).size,
    [mapRegionOrder],
  );
  const currentUniversity = universityOrder.length
    ? universityOrder[questionIndex % universityOrder.length]
    : null;
  const currentMistake = mistakeOrder[0] ?? null;
  const currentConfusableQuestion = confusableOrder.length
    ? confusableOrder[questionIndex % confusableOrder.length]
    : null;
  const currentCityRouteProvinceCode = cityRouteProvinceOrder.length
    ? cityRouteProvinceOrder[questionIndex % cityRouteProvinceOrder.length]
    : null;
  const currentProvinceCityCount = provinceCityCountOrder.length
    ? provinceCityCountOrder[questionIndex % provinceCityCountOrder.length]
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
    const province = provinceForFeature(feature);
    return Boolean(province && !mapSelections.has(province.code));
  }) ?? null;
  const bossShapeFeature = currentBossQuestion?.kind === "shape" && nationalMap
    ? nationalMap.features.find(
        (feature) =>
          provinceForFeature(feature)?.code === currentBossQuestion.provinceCode,
      ) ?? null
    : null;
  const selectedCityMapProvinces = useMemo(
    () => PROVINCES.filter((province) => selectedQuizProvinces.has(province.code)),
    [selectedQuizProvinces],
  );
  const plateCityMapFocusedProvince = plateCityMapFocusedProvinceCode
    ? selectedCityMapProvinces.find(
        (province) => province.code === plateCityMapFocusedProvinceCode,
      ) ?? null
    : null;
  const detailProvinceCode = level === LEVEL.REGION_MAP && currentMapRegion
    ? currentMapRegion.provinceCode
    : level === LEVEL.CITY_SHORTEST_ROUTE
      ? currentCityRouteProvinceCode
      : null;
  const detailProvinceCodes = level === LEVEL.PLATE_CITY_MAP
    ? selectedCityMapProvinces.map((province) => province.code)
    : detailProvinceCode
      ? [detailProvinceCode]
      : [];
  const { data: gauntletDetailMap, error: gauntletDetailError } =
    useMapCollection(detailProvinceCodes);
  const detailProvinceCodeSet = new Set(detailProvinceCodes);
  const gauntletDetailReady = Boolean(
    detailProvinceCodes.length && gauntletDetailMap?.features.length &&
    gauntletDetailMap.features.every(
      (feature) =>
        detailProvinceCodeSet.has(feature.properties.provinceCode ?? ""),
    ) &&
    detailProvinceCodes.every((code) =>
      gauntletDetailMap?.features.some(
        (feature) => feature.properties.provinceCode === code,
      )
    ),
  );
  const cityAdjacency = useMemo(
    () => level === LEVEL.CITY_SHORTEST_ROUTE &&
        gauntletDetailMap && gauntletDetailReady
      ? buildCityAdjacencyMap(gauntletDetailMap)
      : {},
    [gauntletDetailMap, gauntletDetailReady, level],
  );
  const cityRouteChallenge = useMemo(
    () => level === LEVEL.CITY_SHORTEST_ROUTE &&
        currentCityRouteProvinceCode && gauntletDetailMap && gauntletDetailReady
      ? createCityRouteChallenge(
          currentCityRouteProvinceCode,
          gauntletDetailMap,
          cityAdjacency,
          questionIndex,
        )
      : null,
    [
      cityAdjacency, currentCityRouteProvinceCode, gauntletDetailMap,
      gauntletDetailReady, level, questionIndex,
    ],
  );
  const cityRouteKey = cityRouteChallenge
    ? `${questionIndex}-${cityRouteChallenge.provinceCode}-${cityRouteChallenge.startName}-${cityRouteChallenge.endName}`
    : "";
  const cityRouteNames = cityRouteChallenge
    ? cityRouteAttempt?.key === cityRouteKey
      ? cityRouteAttempt.names
      : [cityRouteChallenge.startName]
    : [];
  const setCityRouteNames = (names: string[]) => {
    setCityRouteAttempt(cityRouteChallenge ? { key: cityRouteKey, names } : null);
  };
  const selectedQuizItems = useMemo(
    () => CITY_QUIZ_DATA.filter(
      (item) => selectedShapeProvinceCodes.has(item.provinceCode),
    ),
    [selectedShapeProvinceCodes],
  );
  const selectedPlateQuizItems = useMemo(
    () => PLATE_QUIZ_DATA.filter(
      (item) => selectedShapeProvinceCodes.has(item.provinceCode),
    ),
    [selectedShapeProvinceCodes],
  );
  const selectedMapRegionItems = useMemo(
    () => MAP_REGION_QUIZ_DATA.filter(
      (item) => selectedShapeProvinceCodes.has(item.provinceCode),
    ),
    [selectedShapeProvinceCodes],
  );
  const selectedPlateCityMapItems = useMemo(
    () => selectedPlateQuizItems.filter((item) => item.mapRegion),
    [selectedPlateQuizItems],
  );
  const selectedUniversityItems = useMemo(
    () => UNIVERSITY_QUIZ_DATA.filter(
      (item) => selectedShapeProvinceCodes.has(item.provinceCode),
    ),
    [selectedShapeProvinceCodes],
  );
  const regionMapTarget = Math.min(
    GAUNTLET_REGION_MAP_MAX_TARGET,
    selectedMapRegionItems.length,
  );
  const target = level === LEVEL.PROVINCE_SHAPE
    ? provinceShapeNormalTarget + ROTATED_SILHOUETTE_STREAK_TARGET
    : level === LEVEL.PROVINCE_PUZZLE
      ? provinceOrder.length
      : level === LEVEL.MISTAKE_REVENGE
        ? mistakeSessionTotal
        : level === LEVEL.REGION_MAP
          ? regionMapTarget
          : level === LEVEL.TERRITORY_GROUPS
            ? PROVINCE_GROUPS.length
            : level
              ? GAUNTLET_FIXED_TARGETS[level] ?? 0
              : 0;
  const progress = level === LEVEL.PROVINCE_SHAPE
    ? isRotatedProvinceShapeStage
      ? provinceShapeNormalTarget + streak
      : questionIndex
    : level === LEVEL.PROVINCE_PUZZLE
      ? mapSelections.size
      : level === LEVEL.NEIGHBOR_CHAIN
        ? routeCodes.length
        : level === LEVEL.MISTAKE_REVENGE
          ? Math.max(0, mistakeSessionTotal - mistakeOrder.length)
          : level === LEVEL.FINAL_BOSS
            ? questionIndex + (answerReview ? 1 : 0)
            : streak;
  const provinceScopeIssue = (challengeLevel: GauntletLevel) => {
    if (!session.provinceScopeReady) return "正在读取已保存的省份范围";
    if (FIXED_SCOPE_LEVELS.has(challengeLevel)) return null;
    if (selectedShapeProvinceCodes.size === 0) return "请先选择至少一个省份";
    if (
      challengeLevel === LEVEL.PROVINCE_NEIGHBORS &&
      !Array.from(selectedShapeProvinceCodes).some(
        (code) => (PROVINCE_NEIGHBORS[code]?.length ?? 0) > 0,
      )
    ) return "当前范围没有可用于陆地邻省题的省份";
    if (challengeLevel === LEVEL.UNIVERSITY_CITY && !selectedUniversityItems.length) {
      return "当前范围没有 985、211 大学题目";
    }
    if (
      challengeLevel === LEVEL.CITY_SHORTEST_ROUTE &&
      !selectedCityRouteProvinceCodes.size
    ) return "省内穿越暂不支持当前范围";
    if (
      (challengeLevel === LEVEL.CITY_UNDERCOVER ||
        challengeLevel === LEVEL.GEOGRAPHY_ELIMINATION) &&
      !hasCityGroupWithMinimum(selectedQuizItems, 3)
    ) return "当前范围缺少至少 3 座城市的省份";
    if (challengeLevel === LEVEL.PLATE_FAULT && selectedPlateQuizItems.length < 4) {
      return "车牌找茬至少需要 4 个候选城市或地区";
    }
    if (
      (challengeLevel === LEVEL.PLATE_PLACE ||
        challengeLevel === LEVEL.PLATE_CITY_MAP) &&
      !uniqueReversePlateItems(
        challengeLevel === LEVEL.PLATE_CITY_MAP
          ? selectedPlateCityMapItems
          : selectedPlateQuizItems,
      ).length
    ) return "当前范围没有可唯一定位城市或地区的车牌题目";
    if (
      (challengeLevel === LEVEL.CITY_PROVINCE ||
        challengeLevel === LEVEL.CITY_MAP) &&
      !selectedQuizItems.length
    ) return "当前范围没有可用的城市题目";
    if (
      PLATE_QUESTION_LEVELS.has(challengeLevel) &&
      !selectedPlateQuizItems.length
    ) return "当前范围没有可用的车牌题目";
    if (challengeLevel === LEVEL.REGION_MAP && !selectedMapRegionItems.length) {
      return "当前范围没有可用的地图区块题目";
    }
    if (
      challengeLevel === LEVEL.PLATE_CITY_MAP &&
      !selectedPlateCityMapItems.length
    ) return "当前范围没有可用于地图定位的车牌题目";
    return null;
  };
  const hasTimedOut = timedMode && Boolean(level) && !passedLevel && timeLeft === 0;
  const hasLostBoss = level === LEVEL.FINAL_BOSS && bossLives === 0 && !passedLevel;

  return {
    bossShapeFeature, cityAdjacency, cityPoolSize, cityRouteChallenge, cityRouteKey,
    cityRouteNames, currentBossQuestion, currentChallengeProvince, currentCity,
    currentCityRouteProvinceCode, currentConfusableQuestion,
    currentDualIntruderQuestion, currentGroupQuestion, currentMapRegion,
    currentMistake, currentPlateFaultQuestion, currentProvince,
    currentProvinceCityCount, currentProvinceFeature, currentPuzzleFeature,
    currentTruthQuestion, currentUndercoverQuestion, currentUniversity,
    draftSelectionValid: draftShapeProvinceCodes.size > 0, gauntletDetailError,
    gauntletDetailMap, gauntletDetailReady, hasLostBoss, hasTimedOut,
    isRotatedProvinceShapeStage, mapRegionPoolSize, plateCityMapFocusedProvince,
    progress, provincePickerOptions, provinceScopeIssue, provinceScopeSummary,
    provinceShapeNormalTarget,
    reviewProvinceCodes: new Set(answerReview?.highlightProvinceCodes ?? []),
    selectedCityMapProvinces, selectedCityRouteProvinceCodes,
    selectedMapRegionItems, selectedPlateCityMapItems, selectedPlateQuizItems,
    selectedQuizItems, selectedQuizProvinces, selectedUniversityItems,
    selectedUniversityProvinces, setCityRouteNames, target, timedMode,
  };
}

export type GauntletDerived = ReturnType<typeof useGauntletDerivedValue>;
const GauntletDerivedContext = createContext<GauntletDerived | null>(null);

export function GauntletDerivedProvider({ children }: { children: ReactNode }) {
  return (
    <GauntletDerivedContext.Provider value={useGauntletDerivedValue()}>
      {children}
    </GauntletDerivedContext.Provider>
  );
}

export function useGauntletDerived() {
  const value = useContext(GauntletDerivedContext);
  if (!value) throw new Error("GauntletDerivedProvider is missing");
  return value;
}
