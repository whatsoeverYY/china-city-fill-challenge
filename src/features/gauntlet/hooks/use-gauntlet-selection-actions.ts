"use client";

import {
  PROVINCE_BY_CODE,
  PROVINCE_NEIGHBORS,
  PROVINCES,
  type Province,
} from "@/domain/geography/data/provinces";
import { PROVINCE_GROUPS } from "@/domain/geography/data/geographic-groups";
import { GAUNTLET_LEVEL_ID } from "@/domain/game/gauntlet-level-ids";
import { useGauntletDerived } from "@/features/gauntlet/model/gauntlet-derived-context";
import { useGauntletSession } from "@/features/gauntlet/model/gauntlet-session-context";
import { setsEqual } from "@/shared/lib/graph";
import { placeNameMatches } from "@/shared/lib/place-name";
import { randomShuffle } from "@/shared/lib/random";
import type { GauntletAdvanceActions } from "./use-gauntlet-advance-actions";
import type { GauntletRoundActions } from "./use-gauntlet-round-actions";

const LEVEL = GAUNTLET_LEVEL_ID;

export function useGauntletSelectionActions(
  round: GauntletRoundActions,
  advance: GauntletAdvanceActions,
) {
  const s = useGauntletSession();
  const d = useGauntletDerived();

  const gradeProvinceSelection = (
    challengeLevel: Parameters<typeof advance.advanceStreakChallenge>[0],
    expectedCodes: string[],
    winTarget: number,
    correctAnswer: string,
    explanation: string,
  ) => {
    advance.advanceStreakChallenge(
      challengeLevel,
      setsEqual(new Set(expectedCodes), s.mapSelections),
      winTarget,
      correctAnswer,
      explanation,
      { highlightProvinceCodes: expectedCodes },
    );
  };

  const submitNeighborSelection = () => {
    const province = d.currentChallengeProvince;
    if (s.level !== LEVEL.PROVINCE_NEIGHBORS || !province || s.answerReview) return;
    const expectedCodes = PROVINCE_NEIGHBORS[province.code] ?? [];
    const names = expectedCodes
      .map((code) => PROVINCE_BY_CODE.get(code)?.shortName)
      .filter(Boolean)
      .join("、");
    gradeProvinceSelection(
      LEVEL.PROVINCE_NEIGHBORS,
      expectedCodes,
      d.target,
      names || "无陆地邻省",
      `${province.shortName}的陆地邻省：${names}`,
    );
  };

  const answerTruthQuestion = (answer: boolean) => {
    const question = d.currentTruthQuestion;
    if (s.level !== LEVEL.TRUTH_FLASH || !question || s.answerReview) return;
    const correctAnswer = question.isTrue ? "正确" : "错误";
    advance.advanceStreakChallenge(
      LEVEL.TRUTH_FLASH,
      answer === question.isTrue,
      d.target,
      correctAnswer,
      question.explanation,
      undefined,
      {
        id: question.id,
        category: "判断",
        prompt: `判断正误：${question.statement}`,
        answers: question.isTrue ? ["正确", "对"] : ["错误", "错", "不正确"],
        correctAnswer,
        explanation: question.explanation,
      },
    );
  };

  const answerOptionQuestion = (answer: string) => {
    if (s.answerReview) return;
    if (s.level === LEVEL.CITY_UNDERCOVER && d.currentUndercoverQuestion) {
      const question = d.currentUndercoverQuestion;
      const correctOption = question.options.find((item) => item.id === question.answerId);
      if (!correctOption) return;
      advance.advanceStreakChallenge(
        LEVEL.CITY_UNDERCOVER,
        answer === question.answerId,
        d.target,
        correctOption.city,
        question.explanation,
        undefined,
        {
          id: question.id,
          category: "城市",
          prompt: `找出不属于同一省份的城市：${question.options.map((item) => item.city).join("、")}`,
          answers: [correctOption.city],
          correctAnswer: correctOption.city,
          explanation: question.explanation,
        },
      );
      return;
    }
    if (s.level === LEVEL.GEOGRAPHY_ELIMINATION && d.currentDualIntruderQuestion) {
      const question = d.currentDualIntruderQuestion;
      const correctOption = question.options.find((item) => item.id === question.answerId);
      if (!correctOption) return;
      advance.advanceStreakChallenge(
        LEVEL.GEOGRAPHY_ELIMINATION,
        answer === question.answerId,
        d.target,
        correctOption.label,
        question.explanation,
        undefined,
        {
          id: question.id,
          category: "城市",
          prompt: `${question.instruction}：${question.prompt}；选项：${question.options.map((item) => item.label).join("、")}`,
          answers: [correctOption.label],
          correctAnswer: correctOption.label,
          explanation: question.explanation,
        },
      );
      return;
    }
    if (s.level === LEVEL.PLATE_FAULT && d.currentPlateFaultQuestion) {
      const question = d.currentPlateFaultQuestion;
      const correctOption = question.options.find((item) => item.id === question.answerId);
      advance.advanceStreakChallenge(
        LEVEL.PLATE_FAULT,
        answer === question.answerId,
        d.target,
        correctOption?.label ?? question.answerId,
        question.explanation,
        undefined,
        correctOption
          ? {
              id: question.id,
              category: "车牌",
              prompt: `找出车牌对应错误的一组：${question.options.map((item) => item.label).join("、")}`,
              answers: [correctOption.label],
              correctAnswer: correctOption.label,
              explanation: question.explanation,
            }
          : undefined,
      );
      return;
    }
    if (s.level === LEVEL.CONFUSABLE_CITIES && d.currentConfusableQuestion) {
      const question = d.currentConfusableQuestion;
      const correctOption = question.options.find((item) => item.id === question.answerId);
      if (!correctOption) return;
      advance.advanceStreakChallenge(
        LEVEL.CONFUSABLE_CITIES,
        answer === question.answerId,
        d.target,
        correctOption.label,
        question.explanation,
        undefined,
        {
          id: `confusable-${question.id}`,
          category: "城市",
          prompt: `${question.instruction} ${question.prompt}；候选：${question.options.map((item) => item.label).join(" / ")}`,
          answers: [correctOption.label],
          correctAnswer: correctOption.label,
          explanation: question.explanation,
        },
      );
    }
  };

  const handleDetailRegion = (regionId: string) => {
    if (s.level === LEVEL.REGION_MAP) {
      const region = d.currentMapRegion;
      if (!region || s.answerReview) return;
      const correct = regionId === region.id;
      advance.rememberCityMapQuestion(LEVEL.REGION_MAP, region);
      advance.advanceStreakChallenge(
        LEVEL.REGION_MAP,
        correct,
        d.target,
        region.city,
        `${region.city}位于${region.province}，对应省内地图上的“${region.city}”区块`,
        {
          highlightRegionId: region.id,
          selectedRegionId: !correct ? regionId : undefined,
        },
      );
      return;
    }
    const city = d.currentCity;
    if (s.level !== LEVEL.PLATE_CITY_MAP || !city || s.answerReview) return;
    s.setPlateCityMapFocusedProvinceCode(null);
    const correct = regionId === city.regionCode;
    advance.rememberCityMapQuestion(LEVEL.PLATE_CITY_MAP, city);
    advance.advanceStreakChallenge(
      LEVEL.PLATE_CITY_MAP,
      correct,
      d.target,
      `${city.plate} · ${city.city}`,
      `${city.plate}对应${city.province}的${city.city}`,
      { highlightRegionId: city.regionCode ?? undefined },
      {
        id: `plate-city-map-${city.id}`,
        category: "车牌",
        prompt: `${city.plate}对应哪个城市或地区？`,
        answers: [city.city],
        correctAnswer: `${city.plate} · ${city.city}`,
        explanation: `${city.plate}对应${city.province}的${city.city}`,
      },
    );
  };

  const submitProvinceGroup = () => {
    const question = d.currentGroupQuestion;
    if (s.level !== LEVEL.TERRITORY_GROUPS || !question || s.answerReview) return;
    const names = question.codes
      .map((code) => PROVINCE_BY_CODE.get(code)?.shortName)
      .filter(Boolean)
      .join("、");
    gradeProvinceSelection(
      LEVEL.TERRITORY_GROUPS,
      question.codes,
      PROVINCE_GROUPS.length,
      names,
      `${question.description}。完整范围包括：${names}`,
    );
  };

  const answerBossTruth = (answer: boolean) => {
    const question = d.currentBossQuestion;
    if (s.level !== LEVEL.FINAL_BOSS || question?.kind !== "truth" || s.answerReview) return;
    advance.advanceBossQuestion(
      answer === question.isTrue,
      question.isTrue ? "正确" : "错误",
      question.explanation,
    );
  };

  const restartProvinceRoute = (message: string) => {
    const start = randomShuffle(PROVINCES.filter(
      (item) => (PROVINCE_NEIGHBORS[item.code]?.length ?? 0) > 0,
    ))[0];
    s.setRouteCodes(start ? [start.code] : []);
    s.setFeedbackType("wrong");
    s.setFeedback(message);
  };

  const handleGauntletProvince = (province: Province) => {
    if (s.answerReview) return;
    if (s.level === LEVEL.TERRITORY_GROUPS) {
      s.setMapSelections((current) => {
        const next = new Set(current);
        if (next.has(province.code)) next.delete(province.code);
        else next.add(province.code);
        return next;
      });
      s.setFeedbackType("idle");
      s.setFeedback("选择完成后，点击右侧确认答案");
      return;
    }
    if (s.level === LEVEL.FINAL_BOSS && d.currentBossQuestion?.kind === "map") {
      const question = d.currentBossQuestion;
      advance.advanceBossQuestion(
        province.code === question.provinceCode,
        PROVINCE_BY_CODE.get(question.provinceCode)?.name ?? question.provinceCode,
        question.explanation,
      );
      return;
    }
    if (s.level === LEVEL.PROVINCE_NEIGHBORS) {
      if (province.code === d.currentChallengeProvince?.code) {
        s.setFeedbackType("wrong");
        s.setFeedback("中心省份不用选择，请只圈出它的陆地邻省");
        return;
      }
      s.setMapSelections((current) => {
        const next = new Set(current);
        if (next.has(province.code)) next.delete(province.code);
        else next.add(province.code);
        return next;
      });
      s.setFeedbackType("idle");
      s.setFeedback("选择完成后，点击右侧确认答案");
      return;
    }
    if (s.level === LEVEL.CITY_MAP) {
      const city = d.currentCity;
      if (!city) return;
      advance.advanceStreakChallenge(
        LEVEL.CITY_MAP,
        placeNameMatches(province.shortName, [city.province, city.provinceShort]),
        d.target,
        city.province,
        `${city.city}属于${city.province}`,
        { highlightProvinceCodes: [city.provinceCode] },
        {
          id: `city-province-${city.id}`,
          category: "城市",
          prompt: `${city.city}属于哪个省级行政区？`,
          answers: [city.province, city.provinceShort],
          correctAnswer: city.province,
          explanation: `${city.city}属于${city.province}`,
        },
      );
      return;
    }
    if (s.level !== LEVEL.NEIGHBOR_CHAIN || s.routeCodes.length === 0) return;
    const currentCode = s.routeCodes[s.routeCodes.length - 1];
    if (s.routeCodes.includes(province.code)) {
      s.setFeedbackType("wrong");
      s.setFeedback("这个省份已经走过，请选择尚未经过的陆地邻省");
      return;
    }
    if (!(PROVINCE_NEIGHBORS[currentCode] ?? []).includes(province.code)) {
      restartProvinceRoute("路线中断：两地不接壤，已随机生成新的起点");
      return;
    }
    const nextRoute = [...s.routeCodes, province.code];
    if (nextRoute.length === d.target) {
      s.setRouteCodes(nextRoute);
      round.finishLevel(LEVEL.NEIGHBOR_CHAIN);
      return;
    }
    const hasUnvisitedNeighbor = (PROVINCE_NEIGHBORS[province.code] ?? [])
      .some((code) => !nextRoute.includes(code));
    if (!hasUnvisitedNeighbor) {
      restartProvinceRoute("这里已经无路可走，已随机生成新的起点");
      return;
    }
    s.setRouteCodes(nextRoute);
    s.setFeedbackType("right");
    s.setFeedback(`路线有效：已连续走过 ${nextRoute.length} 个省级行政区`);
  };

  return {
    answerBossTruth,
    answerOptionQuestion,
    answerTruthQuestion,
    handleDetailRegion,
    handleGauntletProvince,
    submitNeighborSelection,
    submitProvinceGroup,
  };
}
