"use client";

import { PROVINCE_CITY_COUNT_DATA } from "@/domain/geography/data/province-city-counts";
import { PROVINCE_NEIGHBORS, PROVINCES } from "@/domain/geography/data/provinces";
import { PROVINCE_GROUPS } from "@/domain/geography/data/geographic-groups";
import { createEmptyBossStats } from "@/features/gauntlet/model/boss-stats";
import {
  GAUNTLET_OPENING_FEEDBACK,
  GAUNTLET_TIME_LIMIT,
  FINAL_BOSS_LIFE_COUNT,
  MAP_REQUIRED_LEVELS,
  PLATE_QUESTION_LEVELS,
} from "@/features/gauntlet/config/gauntlet-config";
import type { CityQuizItem } from "@/domain/geography/data/city-plates";
import { uniqueReversePlateItems } from "@/domain/geography/lib/city-plate-answer";
import { GAUNTLET_LEVEL_ID } from "@/domain/game/gauntlet-level-ids";
import {
  createCityMapQuestionQueue,
} from "@/features/gauntlet/model/city-map-question-queue";
import { useGauntletDerived } from "@/features/gauntlet/model/gauntlet-derived-context";
import { useGauntletSession } from "@/features/gauntlet/model/gauntlet-session-context";
import type {
  GauntletLevel,
} from "@/features/gauntlet/model/gauntlet-types";
import type { MistakeSeed } from "@/domain/game/mistakes";
import { upsertMistake } from "@/domain/game/mistakes";
import {
  createBossQuestions,
  createConfusableCityQuestions,
  createDualIntruderQuestions,
  createPlateFaultQuestions,
  createTruthQuestions,
  createUndercoverQuestions,
} from "@/features/gauntlet/model/question-generators";
import { provinceForFeature } from "@/features/map/lib/map-geometry";
import {
  GAUNTLET_MISTAKES_KEY,
  GAUNTLET_PROGRESS_KEY,
  GAUNTLET_PROVINCE_SCOPE_KEY,
} from "@/infrastructure/storage/progress-storage";
import { randomShuffle } from "@/shared/lib/random";

const LEVEL = GAUNTLET_LEVEL_ID;

export function useGauntletRoundActions() {
  const s = useGauntletSession();
  const d = useGauntletDerived();

  const usesCompactViewport = () =>
    window.matchMedia("(max-width: 760px), (pointer: coarse)").matches;

  const focusProvinceInput = () => {
    window.requestAnimationFrame(() => {
      if (!usesCompactViewport()) {
        s.provinceInputRef.current?.focus({ preventScroll: true });
      }
    });
  };

  const showRoundFromTop = () => {
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) activeElement.blur();
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      if (!usesCompactViewport()) {
        s.provinceInputRef.current?.focus({ preventScroll: true });
      }
    });
  };

  const resetRoundProgress = (message: string) => {
    s.setAnswerReview(null);
    s.setTimeLeft(s.timeLimit || GAUNTLET_TIME_LIMIT);
    s.setQuestionIndex(0);
    s.setStreak(0);
    s.setProvinceAnswer("");
    s.setPlateAnswer("");
    s.setMapSelections(new Set());
    s.setPlateCityMapFocusedProvinceCode(null);
    s.setRouteCodes([]);
    s.setFeedbackType("idle");
    s.setFeedback(message);
  };

  const setCityChallengeQuestions = (
    challengeLevel: GauntletLevel,
    questions: CityQuizItem[],
  ) => {
    const eligibleQuestions =
      challengeLevel === LEVEL.PLATE_PLACE || challengeLevel === LEVEL.PLATE_CITY_MAP
        ? uniqueReversePlateItems(questions)
        : questions;
    const shuffledQuestions = challengeLevel === LEVEL.PLATE_CITY_MAP
      ? createCityMapQuestionQueue(
          eligibleQuestions,
          s.plateCityMapHistoryRef.current,
          randomShuffle,
        )
      : randomShuffle(eligibleQuestions);
    s.setCityOrder(shuffledQuestions);
    s.setTruthOrder(
      challengeLevel === LEVEL.TRUTH_FLASH
        ? createTruthQuestions(shuffledQuestions)
        : [],
    );
    s.setUndercoverOrder(
      challengeLevel === LEVEL.CITY_UNDERCOVER
        ? createUndercoverQuestions(shuffledQuestions)
        : [],
    );
    s.setDualIntruderOrder(
      challengeLevel === LEVEL.GEOGRAPHY_ELIMINATION
        ? createDualIntruderQuestions(shuffledQuestions)
        : [],
    );
    s.setPlateFaultOrder(
      challengeLevel === LEVEL.PLATE_FAULT
        ? createPlateFaultQuestions(shuffledQuestions)
        : [],
    );
  };

  const clearQuestionOrders = () => {
    s.setProvinceOrder([]);
    s.setProvinceChallengeOrder([]);
    s.setCityOrder([]);
    s.setTruthOrder([]);
  };

  const startLevel = (nextLevel: GauntletLevel) => {
    const scopeIssue = d.provinceScopeIssue(nextLevel);
    if (scopeIssue) {
      s.setLevel(null);
      s.setPassedLevel(null);
      s.setProvinceScopeMessage(scopeIssue);
      return;
    }
    if (MAP_REQUIRED_LEVELS.has(nextLevel) && (!s.nationalMap || s.nationalError)) {
      return;
    }
    s.setProvinceScopeMessage("");
    s.setLevel(nextLevel);
    s.setPassedLevel(null);
    resetRoundProgress(GAUNTLET_OPENING_FEEDBACK[nextLevel]);
    s.setMapRegionOrder([]);
    s.setUndercoverOrder([]);
    s.setDualIntruderOrder([]);
    s.setPlateFaultOrder([]);
    s.setGroupOrder([]);
    s.setBossOrder([]);
    s.setUniversityOrder([]);
    s.setMistakeOrder([]);
    s.setMistakeSessionTotal(0);
    s.setConfusableOrder([]);
    s.setProvinceCityCountOrder([]);
    s.setBossLives(FINAL_BOSS_LIFE_COUNT);
    s.setBossStats(createEmptyBossStats());

    if (nextLevel === LEVEL.PROVINCE_SHAPE && s.nationalMap) {
      s.setProvinceOrder(randomShuffle(s.nationalMap.features.filter((feature) => {
        const province = provinceForFeature(feature);
        return Boolean(province && s.selectedShapeProvinceCodes.has(province.code));
      })));
      s.setCityOrder([]);
      s.setProvinceChallengeOrder([]);
      s.setTruthOrder([]);
    } else if (nextLevel === LEVEL.PROVINCE_NEIGHBORS) {
      s.setProvinceChallengeOrder(randomShuffle(PROVINCES.filter(
        (item) => s.selectedShapeProvinceCodes.has(item.code) &&
          (PROVINCE_NEIGHBORS[item.code]?.length ?? 0) > 0,
      )));
      s.setProvinceOrder([]);
      s.setCityOrder([]);
      s.setTruthOrder([]);
    } else if (nextLevel === LEVEL.NEIGHBOR_CHAIN) {
      const start = randomShuffle(PROVINCES.filter(
        (item) => (PROVINCE_NEIGHBORS[item.code]?.length ?? 0) > 0,
      ))[0];
      s.setRouteCodes(start ? [start.code] : []);
      clearQuestionOrders();
    } else if (nextLevel === LEVEL.REGION_MAP) {
      s.setMapRegionOrder(createCityMapQuestionQueue(
        d.selectedMapRegionItems,
        s.regionMapHistoryRef.current,
        randomShuffle,
      ));
      clearQuestionOrders();
    } else if (nextLevel === LEVEL.TERRITORY_GROUPS) {
      s.setGroupOrder(randomShuffle(PROVINCE_GROUPS));
      clearQuestionOrders();
    } else if (nextLevel === LEVEL.UNIVERSITY_CITY) {
      s.setUniversityOrder(randomShuffle(d.selectedUniversityItems));
      clearQuestionOrders();
    } else if (nextLevel === LEVEL.MISTAKE_REVENGE) {
      const mistakes = randomShuffle(s.mistakes);
      s.setMistakeOrder(mistakes);
      s.setMistakeSessionTotal(mistakes.length);
      clearQuestionOrders();
    } else if (nextLevel === LEVEL.CONFUSABLE_CITIES) {
      s.setConfusableOrder(createConfusableCityQuestions());
      clearQuestionOrders();
    } else if (nextLevel === LEVEL.PROVINCE_CITY_COUNT) {
      s.setProvinceCityCountOrder(randomShuffle(PROVINCE_CITY_COUNT_DATA.filter(
        (item) => s.selectedShapeProvinceCodes.has(item.code),
      )));
      clearQuestionOrders();
    } else if (nextLevel === LEVEL.FINAL_BOSS) {
      s.setBossOrder(createBossQuestions());
      clearQuestionOrders();
    } else {
      const questions = nextLevel === LEVEL.PLATE_CITY_MAP
        ? d.selectedPlateCityMapItems
        : PLATE_QUESTION_LEVELS.has(nextLevel)
          ? d.selectedPlateQuizItems
          : d.selectedQuizItems;
      setCityChallengeQuestions(nextLevel, questions);
      s.setProvinceOrder([]);
      s.setProvinceChallengeOrder([]);
    }
    s.setProvincePickerOpen(false);
    showRoundFromTop();
  };

  const openProvincePicker = () => {
    s.setDraftShapeProvinceCodes(new Set(s.selectedShapeProvinceCodes));
    s.setProvincePickerOpen(true);
  };

  const toggleDraftProvince = (code: string) => {
    const next = new Set(s.draftShapeProvinceCodes);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    s.setDraftShapeProvinceCodes(next);
  };

  const applyProvinceSelection = () => {
    if (!d.draftSelectionValid) return;
    const orderedCodes = PROVINCES
      .filter((item) => s.draftShapeProvinceCodes.has(item.code))
      .map((item) => item.code);
    const nextSelection = new Set(orderedCodes);
    s.setSelectedShapeProvinceCodes(nextSelection);
    s.setDraftShapeProvinceCodes(new Set(nextSelection));
    s.progressStorage.setItem(
      GAUNTLET_PROVINCE_SCOPE_KEY,
      JSON.stringify(orderedCodes),
    );
    s.setProvinceScopeMessage(s.identity
      ? `已保存 ${orderedCodes.length} 个省级行政区，后续关卡将自动沿用并同步云存档`
      : `本次试玩已选择 ${orderedCodes.length} 个省级行政区；登录后可长期保存`);
    s.setProvincePickerOpen(false);
  };

  const selectAllPickerProvinces = () => {
    s.setDraftShapeProvinceCodes(new Set(
      d.provincePickerOptions.map((item) => item.key),
    ));
  };

  const clearPickerProvinces = () => s.setDraftShapeProvinceCodes(new Set());

  const finishLevel = (finishedLevel: GauntletLevel) => {
    const nextCompleted = new Set(s.completedLevels).add(finishedLevel);
    s.setCompletedLevels(nextCompleted);
    s.progressStorage.setItem(
      GAUNTLET_PROGRESS_KEY,
      JSON.stringify(Array.from(nextCompleted)),
    );
    s.setPassedLevel(finishedLevel);
    s.setFeedbackType("right");
  };

  const recordMistake = (seed: MistakeSeed) => {
    s.setMistakes((current) => {
      const next = upsertMistake(current, seed);
      s.progressStorage.setItem(GAUNTLET_MISTAKES_KEY, JSON.stringify(next));
      return next;
    });
  };

  const masterMistake = (id: string) => {
    s.setMistakes((current) => {
      const next = current.filter((item) => item.id !== id);
      s.progressStorage.setItem(GAUNTLET_MISTAKES_KEY, JSON.stringify(next));
      return next;
    });
  };

  const returnToLevels = () => {
    s.setLevel(null);
    s.setPassedLevel(null);
    s.setAnswerReview(null);
    s.setProvincePickerOpen(false);
    s.setFeedbackType("idle");
  };

  return {
    applyProvinceSelection, clearPickerProvinces, finishLevel,
    focusProvinceInput, masterMistake, openProvincePicker, recordMistake,
    returnToLevels, selectAllPickerProvinces, startLevel,
    toggleDraftProvince,
  };
}

export type GauntletRoundActions = ReturnType<typeof useGauntletRoundActions>;
