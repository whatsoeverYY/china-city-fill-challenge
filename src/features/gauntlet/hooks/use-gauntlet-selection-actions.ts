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
import { createRouteChallenge } from "@/features/gauntlet/model/question-generators";
import { provinceForFeature } from "@/features/map/lib/map-geometry";
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
        id: `truth-${question.statement}`,
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
      advance.advanceStreakChallenge(
        LEVEL.CITY_UNDERCOVER,
        answer === question.answerCity,
        d.target,
        question.answerCity,
        question.explanation,
        undefined,
        {
          id: `undercover-${question.options.map((item) => item.city).sort().join("-")}`,
          category: "城市",
          prompt: `找出不属于同一省份的城市：${question.options.map((item) => item.city).join("、")}`,
          answers: [question.answerCity],
          correctAnswer: question.answerCity,
          explanation: question.explanation,
        },
      );
      return;
    }
    if (s.level === LEVEL.GEOGRAPHY_ELIMINATION && d.currentDualIntruderQuestion) {
      const question = d.currentDualIntruderQuestion;
      advance.advanceStreakChallenge(
        LEVEL.GEOGRAPHY_ELIMINATION,
        answer === question.answer,
        d.target,
        question.answer,
        question.explanation,
        undefined,
        {
          id: `exclude-${question.instruction}-${question.prompt}-${question.answer}`,
          category: "城市",
          prompt: `${question.instruction}：${question.prompt}；选项：${question.options.join("、")}`,
          answers: [question.answer],
          correctAnswer: question.answer,
          explanation: question.explanation,
        },
      );
      return;
    }
    if (s.level === LEVEL.PLATE_FAULT && d.currentPlateFaultQuestion) {
      const question = d.currentPlateFaultQuestion;
      const correctOption = question.options.find((item) => item.id === question.answer);
      advance.advanceStreakChallenge(
        LEVEL.PLATE_FAULT,
        answer === question.answer,
        d.target,
        correctOption?.label ?? question.answer,
        question.explanation,
        undefined,
        correctOption
          ? {
              id: `plate-fault-${correctOption.label}`,
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
      advance.advanceStreakChallenge(
        LEVEL.CONFUSABLE_CITIES,
        answer === question.answer,
        d.target,
        question.answer,
        question.explanation,
        undefined,
        {
          id: `confusable-${question.id}`,
          category: "城市",
          prompt: `${question.instruction} ${question.prompt}；候选：${question.options.join(" / ")}`,
          answers: [question.answer],
          correctAnswer: question.answer,
          explanation: question.explanation,
        },
      );
    }
  };

  const handleDetailRegion = (regionName: string) => {
    if (s.level === LEVEL.CITY_SHORTEST_ROUTE) {
      const challenge = d.cityRouteChallenge;
      if (!challenge || d.cityRouteNames.length === 0 || s.answerReview) return;
      const currentRegion = d.cityRouteNames[d.cityRouteNames.length - 1];
      if (d.cityRouteNames.includes(regionName)) {
        s.setFeedbackType("wrong");
        s.setFeedback("路线不能重复经过同一个市级区块");
        return;
      }
      if (!(d.cityAdjacency[currentRegion] ?? []).includes(regionName)) {
        d.setCityRouteNames([challenge.startName]);
        s.setFeedbackType("wrong");
        s.setFeedback("两个区块不接壤，路线已回到起点");
        return;
      }
      const nextRoute = [...d.cityRouteNames, regionName];
      if (regionName !== challenge.endName) {
        const canContinue = (d.cityAdjacency[regionName] ?? []).some(
          (neighbor) => !nextRoute.includes(neighbor),
        );
        if (!canContinue) {
          d.setCityRouteNames([challenge.startName]);
          s.setFeedbackType("wrong");
          s.setFeedback("这里已经无路可走，路线已回到起点");
          return;
        }
        d.setCityRouteNames(nextRoute);
        s.setFeedbackType("right");
        s.setFeedback(`路线有效，当前已走 ${nextRoute.length - 1} 步`);
        return;
      }
      const correct = nextRoute.length === challenge.shortestPath.length;
      const nextCompleted = correct ? s.streak + 1 : s.streak;
      d.setCityRouteNames(nextRoute);
      s.setStreak(nextCompleted);
      if (correct) {
        s.setFeedbackType("right");
        if (nextCompleted === d.target) {
          round.finishLevel(LEVEL.CITY_SHORTEST_ROUTE);
          return;
        }
        s.setCityRouteAttempt(null);
        s.setQuestionIndex((value) => value + 1);
        s.setFeedback("省内最短路线正确，已自动生成下一条路线");
        return;
      }
      s.setFeedbackType("wrong");
      s.setFeedback("已经抵达终点，但还不是最短路线");
      s.setAnswerReview({
        correct: false,
        correctAnswer: challenge.shortestPath.join(" → "),
        explanation: `${PROVINCE_BY_CODE.get(challenge.provinceCode)?.name ?? "本省"}内，从${challenge.startName}到${challenge.endName}最少需要 ${challenge.shortestPath.length - 1} 步。`,
        level: LEVEL.CITY_SHORTEST_ROUTE,
        nextAction: "next",
      });
      return;
    }
    if (s.level === LEVEL.REGION_MAP) {
      const region = d.currentMapRegion;
      if (!region || s.answerReview) return;
      const correct = placeNameMatches(regionName, [region.city]);
      advance.rememberCityMapQuestion(LEVEL.REGION_MAP, region);
      advance.advanceStreakChallenge(
        LEVEL.REGION_MAP,
        correct,
        d.target,
        region.city,
        `${region.city}位于${region.province}，对应省内地图上的“${region.city}”区块`,
        {
          highlightRegionName: region.city,
          selectedRegionName: !correct ? regionName : undefined,
        },
      );
      return;
    }
    const city = d.currentCity;
    if (s.level !== LEVEL.PLATE_CITY_MAP || !city || s.answerReview) return;
    s.setPlateCityMapFocusedProvinceCode(null);
    const correct = placeNameMatches(regionName, [city.city]);
    advance.rememberCityMapQuestion(LEVEL.PLATE_CITY_MAP, city);
    advance.advanceStreakChallenge(
      LEVEL.PLATE_CITY_MAP,
      correct,
      d.target,
      `${city.plate} · ${city.city}`,
      `${city.plate}对应${city.province}的${city.city}`,
      { highlightRegionName: city.city },
      {
        id: `plate-city-map-${city.plate}`,
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

  const placePuzzleProvince = (province: Province, draggedCode?: string) => {
    if (s.level !== LEVEL.PROVINCE_PUZZLE || !d.currentPuzzleFeature) return;
    const expected = provinceForFeature(d.currentPuzzleFeature);
    if (!expected) return;
    const correct = province.code === expected.code &&
      (!draggedCode || draggedCode === expected.code);
    if (!correct) {
      s.setFeedbackType("wrong");
      s.setFeedback("位置不对，再观察轮廓与全国地图中的相对位置");
      return;
    }
    const next = new Set(s.mapSelections).add(expected.code);
    if (next.size === s.provinceOrder.length) {
      s.setMapSelections(next);
      round.finishLevel(LEVEL.PROVINCE_PUZZLE);
      return;
    }
    s.setMapSelections(next);
    s.setFeedbackType("right");
    s.setFeedback(`放置正确：${expected.name}。继续下一块拼图`);
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
    if (s.level === LEVEL.PROVINCE_PUZZLE) {
      placePuzzleProvince(province);
      return;
    }
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
    if (s.level === LEVEL.PROVINCE_SHORTEST_ROUTE) {
      const challenge = s.routeChallenge;
      if (!challenge || s.routeCodes.length === 0) return;
      const currentCode = s.routeCodes[s.routeCodes.length - 1];
      if (s.routeCodes.includes(province.code)) {
        s.setFeedbackType("wrong");
        s.setFeedback("这条路线不能重复经过同一省份");
        return;
      }
      if (!(PROVINCE_NEIGHBORS[currentCode] ?? []).includes(province.code)) {
        s.setRouteCodes([challenge.startCode]);
        s.setFeedbackType("wrong");
        s.setFeedback("两地不接壤，路线已回到起点");
        return;
      }
      const nextRoute = [...s.routeCodes, province.code];
      if (province.code !== challenge.endCode) {
        const hasNext = (PROVINCE_NEIGHBORS[province.code] ?? [])
          .some((code) => !nextRoute.includes(code));
        if (!hasNext) {
          s.setRouteCodes([challenge.startCode]);
          s.setFeedbackType("wrong");
          s.setFeedback("这里已经无路可走，路线已回到起点");
          return;
        }
        s.setRouteCodes(nextRoute);
        s.setFeedbackType("right");
        s.setFeedback(`路线有效，当前已走 ${nextRoute.length - 1} 步`);
        return;
      }
      if (nextRoute.length !== challenge.shortestPath.length) {
        s.setRouteCodes([challenge.startCode]);
        s.setFeedbackType("wrong");
        s.setFeedback(`已经抵达终点，但不是最短路线；最少需要 ${challenge.shortestPath.length - 1} 步`);
        return;
      }
      const nextCompleted = s.streak + 1;
      if (nextCompleted === d.target) {
        s.setRouteCodes(nextRoute);
        round.finishLevel(LEVEL.PROVINCE_SHORTEST_ROUTE);
        return;
      }
      const nextChallenge = createRouteChallenge();
      s.setStreak(nextCompleted);
      s.setRouteChallenge(nextChallenge);
      s.setRouteCodes([nextChallenge.startCode]);
      s.setFeedbackType("right");
      s.setFeedback(`最短路线正确，已完成 ${nextCompleted} / ${d.target} 条`);
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
          id: `city-province-${city.city}`,
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
    placePuzzleProvince,
    submitNeighborSelection,
    submitProvinceGroup,
  };
}
