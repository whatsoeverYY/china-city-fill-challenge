"use client";

import type { FormEvent } from "react";
import { PROVINCE_BY_CODE } from "@/domain/geography/data/provinces";
import {
  plateAnswerMatches,
  provinceCityAnswerMatches,
} from "@/domain/geography/lib/city-plate-answer";
import { GAUNTLET_LEVEL_ID } from "@/domain/game/gauntlet-level-ids";
import {
  GAUNTLET_ROTATED_SILHOUETTE_FEEDBACK,
  GAUNTLET_TIME_LIMIT,
  ROTATED_SILHOUETTE_STREAK_TARGET,
} from "@/features/gauntlet/config/gauntlet-config";
import { useGauntletDerived } from "@/features/gauntlet/model/gauntlet-derived-context";
import { useGauntletSession } from "@/features/gauntlet/model/gauntlet-session-context";
import { normalizePlate } from "@/features/gauntlet/model/question-generators";
import {
  normalizePlaceName,
  placeNameMatches,
  stripAdministrativeSuffix,
} from "@/shared/lib/place-name";
import { randomShuffle } from "@/shared/lib/random";
import type { GauntletAdvanceActions } from "./use-gauntlet-advance-actions";
import type { GauntletRoundActions } from "./use-gauntlet-round-actions";

const LEVEL = GAUNTLET_LEVEL_ID;

export function useGauntletTextActions(
  round: GauntletRoundActions,
  advance: GauntletAdvanceActions,
) {
  const s = useGauntletSession();
  const d = useGauntletDerived();

  const submitAnswer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!s.level || s.answerReview) return;

    const bossQuestion = d.currentBossQuestion;
    if (
      s.level === LEVEL.FINAL_BOSS && bossQuestion &&
      (bossQuestion.kind === "text" || bossQuestion.kind === "shape")
    ) {
      const correct = bossQuestion.kind === "text" && bossQuestion.matchAllTargets
        ? plateAnswerMatches(s.provinceAnswer, bossQuestion.targets)
        : bossQuestion.targets.some(
            (answer) =>
              placeNameMatches(s.provinceAnswer, [answer]) ||
              normalizePlate(s.provinceAnswer) === normalizePlate(answer),
          );
      advance.advanceBossQuestion(
        correct,
        bossQuestion.targets.join(" / "),
        bossQuestion.explanation,
      );
      return;
    }

    if (s.level === LEVEL.PROVINCE_CITY_COUNT) {
      const item = d.currentProvinceCityCount;
      if (!item) return;
      const normalized = normalizePlaceName(s.provinceAnswer).replace(/[个座市]$/u, "");
      const correct = /^\d+$/.test(normalized) && Number(normalized) === item.cityCount;
      const correctAnswer = `${item.cityCount} 座`;
      advance.advanceStreakChallenge(
        LEVEL.PROVINCE_CITY_COUNT,
        correct,
        d.target,
        correctAnswer,
        item.explanation,
        undefined,
        {
          id: `province-city-count-${item.code}`,
          category: "城市数量",
          prompt: `${item.name}有多少座地级及以上城市？`,
          answers: [
            String(item.cityCount),
            `${item.cityCount}个`,
            `${item.cityCount}座`,
          ],
          correctAnswer,
          explanation: item.explanation,
        },
      );
      return;
    }

    if (s.level === LEVEL.MISTAKE_REVENGE) {
      const mistake = d.currentMistake;
      if (!mistake) return;
      const correct = mistake.answerMode
        ? plateAnswerMatches(
            s.provinceAnswer,
            mistake.answers,
            mistake.answerMode === "all-plate-letters",
          )
        : mistake.answers.some(
            (answer) =>
              placeNameMatches(s.provinceAnswer, [answer]) ||
              normalizePlate(s.provinceAnswer) === normalizePlate(answer),
          );
      if (correct) {
        round.masterMistake(mistake.id);
        s.setMistakeOrder((current) => current.slice(1));
        s.setFeedbackType("right");
        if (s.mistakeOrder.length === 1) {
          round.finishLevel(LEVEL.MISTAKE_REVENGE);
          return;
        }
        s.setProvinceAnswer("");
        s.setFeedback("复仇成功，已自动进入下一道错题");
        round.focusProvinceInput();
        return;
      }
      round.recordMistake({
        id: mistake.id,
        category: mistake.category,
        prompt: mistake.prompt,
        answers: mistake.answers,
        correctAnswer: mistake.correctAnswer,
        explanation: mistake.explanation,
        answerMode: mistake.answerMode,
      });
      s.setMistakeOrder((current) => [...current.slice(1), current[0]]);
      s.setFeedbackType("wrong");
      s.setFeedback("还没攻克，这道题稍后会再次出现");
      s.setAnswerReview({
        correct: false,
        correctAnswer: mistake.correctAnswer,
        explanation: mistake.explanation,
        level: LEVEL.MISTAKE_REVENGE,
        nextAction: "next",
        checkpoint: `本题将回到队尾，本轮仍有 ${s.mistakeOrder.length} 题待攻克`,
      });
      return;
    }

    if (s.level === LEVEL.UNIVERSITY_CITY) {
      const item = d.currentUniversity;
      if (!item) return;
      const correct = placeNameMatches(s.provinceAnswer, item.answers);
      const locations = item.answers.join(" / ");
      const provinceKind = PROVINCE_BY_CODE.get(item.provinceCode)?.kind;
      const primaryLocation =
        provinceKind === "直辖市" || provinceKind === "特别行政区"
        ? item.city
        : `${item.province}${item.city}`;
      const explanation = item.note
        ? `${item.name}是原“${item.tier}工程”高校。${item.note}`
        : `${item.name}是原“${item.tier}工程”高校，主要办学地在${primaryLocation}`;
      advance.advanceStreakChallenge(
        LEVEL.UNIVERSITY_CITY,
        correct,
        d.target,
        locations,
        explanation,
        undefined,
        {
          id: `university-city-${item.id}`,
          category: "高校",
          prompt: `${item.name}主要位于哪座城市？`,
          answers: item.answers,
          correctAnswer: locations,
          explanation,
        },
      );
      return;
    }

    if (s.level === LEVEL.PROVINCE_SHAPE) {
      const province = d.currentProvince;
      if (!province) return;
      const correct = placeNameMatches(s.provinceAnswer, [
        province.name,
        province.shortName,
      ]);
      if (d.isRotatedProvinceShapeStage) {
        advance.advanceStreakChallenge(
          LEVEL.PROVINCE_SHAPE,
          correct,
          ROTATED_SILHOUETTE_STREAK_TARGET,
          province.name,
          `这个旋转轮廓是${province.name}`,
        );
        return;
      }
      if (!correct) {
        s.setFeedbackType("wrong");
        s.setFeedback("名称不对，再观察一下轮廓");
        round.focusProvinceInput();
        return;
      }
      const nextIndex = s.questionIndex + 1;
      if (nextIndex === s.provinceOrder.length) {
        s.setProvinceOrder((current) => randomShuffle(current));
        s.setQuestionIndex(nextIndex);
        s.setStreak(0);
        s.setProvinceAnswer("");
        s.setTimeLeft(s.timeLimit || GAUNTLET_TIME_LIMIT);
        s.setFeedbackType("right");
        s.setFeedback(`普通轮廓已全部完成，${GAUNTLET_ROTATED_SILHOUETTE_FEEDBACK}`);
        round.focusProvinceInput();
        return;
      }
      s.setQuestionIndex(nextIndex);
      s.setProvinceAnswer("");
      s.setFeedbackType("right");
      s.setFeedback(`回答正确：${province.name}。继续下一题`);
      round.focusProvinceInput();
      return;
    }

    if (s.level === LEVEL.PLATE_COMPLETION) {
      const city = d.currentCity;
      if (!city) return;
      const correct = plateAnswerMatches(s.plateAnswer, city.plates, true);
      advance.advanceStreakChallenge(
        LEVEL.PLATE_COMPLETION,
        correct,
        d.target,
        city.plate,
        `${city.city}的车牌前缀是 ${city.plate}`,
        undefined,
        {
          id: `plate-${city.id}`,
          category: "车牌",
          prompt: `${city.city}的车牌前缀是什么？`,
          answers: city.plates,
          correctAnswer: city.plate,
          explanation: `${city.city}的车牌前缀是 ${city.plate}`,
          answerMode: "all-plate-letters",
        },
      );
      return;
    }

    if (s.level !== LEVEL.CITY_PROVINCE && s.level !== LEVEL.PLATE_PLACE) return;
    const city = d.currentCity;
    if (!city) return;
    const isCityProvince = s.level === LEVEL.CITY_PROVINCE;
    const correct = isCityProvince
      ? placeNameMatches(s.provinceAnswer, [city.province, city.provinceShort])
      : provinceCityAnswerMatches(s.provinceAnswer, city);
    const correctAnswer = isCityProvince
      ? city.province
      : `${city.provinceShort}${stripAdministrativeSuffix(city.city)}`;
    const explanation = isCityProvince
      ? `${city.city}属于${city.province}`
      : `${city.plate}对应${city.province}的${city.city}`;
    if (!isCityProvince && !correct) {
      const cityShort = stripAdministrativeSuffix(city.city);
      round.recordMistake({
        id: `plate-place-${city.id}`,
        category: "车牌",
        prompt: `${city.plate}对应哪个省份和城市或地区？`,
        answers: [
          `${city.provinceShort}${cityShort}`,
          `${city.provinceShort}${city.city}`,
          `${city.province}${cityShort}`,
          `${city.province}${city.city}`,
        ],
        correctAnswer,
        explanation,
      });
    }
    advance.advanceStreakChallenge(
      s.level,
      correct,
      d.target,
      correctAnswer,
      explanation,
      undefined,
      isCityProvince
        ? {
            id: `city-province-${city.id}`,
            category: "城市",
            prompt: `${city.city}属于哪个省级行政区？`,
            answers: [city.province, city.provinceShort],
            correctAnswer: city.province,
            explanation,
          }
        : undefined,
    );
  };

  return { submitAnswer };
}
