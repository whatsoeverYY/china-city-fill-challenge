"use client";

import { PROVINCE_BY_CODE } from "@/domain/geography/data/provinces";
import {
  cityQuizKey,
  createCityMapQuestionQueue,
  type NamedRegionQuizItem,
} from "@/features/gauntlet/model/city-map-question-queue";
import { CITY_MAP_RECENT_QUESTION_LIMIT } from "@/domain/game/gauntlet-rules";
import {
  FINAL_BOSS_CHECKPOINT_SIZE,
  FINAL_BOSS_QUESTION_COUNT,
  GAUNTLET_OPENING_FEEDBACK,
  GAUNTLET_ROTATED_SILHOUETTE_FEEDBACK,
  writeRecentQuestionHistory,
} from "@/features/gauntlet/config/gauntlet-config";
import { GAUNTLET_LEVEL_ID } from "@/domain/game/gauntlet-level-ids";
import { useGauntletDerived } from "@/features/gauntlet/model/gauntlet-derived-context";
import { useGauntletSession } from "@/features/gauntlet/model/gauntlet-session-context";
import type {
  AnswerReview,
  GauntletLevel,
} from "@/features/gauntlet/model/gauntlet-types";
import { BOSS_SKILL_CATALOG } from "@/features/gauntlet/model/boss-stats";
import type { MistakeSeed } from "@/domain/game/mistakes";
import {
  GAUNTLET_PLATE_CITY_MAP_HISTORY_KEY,
  GAUNTLET_REGION_MAP_HISTORY_KEY,
} from "@/infrastructure/storage/progress-storage";
import { randomShuffle } from "@/shared/lib/random";
import type { GauntletRoundActions } from "./use-gauntlet-round-actions";

const LEVEL = GAUNTLET_LEVEL_ID;

export function useGauntletAdvanceActions(round: GauntletRoundActions) {
  const s = useGauntletSession();
  const d = useGauntletDerived();
  const { plateCityMapHistoryRef, regionMapHistoryRef } = s;

  const rememberCityMapQuestion = (
    challengeLevel: GauntletLevel,
    item: NamedRegionQuizItem,
  ) => {
    const key = cityQuizKey(item);
    const historyRef = challengeLevel === LEVEL.REGION_MAP
      ? regionMapHistoryRef
      : plateCityMapHistoryRef;
    const nextHistory = [
      ...historyRef.current.filter((savedKey) => savedKey !== key),
      key,
    ].slice(-CITY_MAP_RECENT_QUESTION_LIMIT);
    s.setRecentQuestionHistory(
      challengeLevel === LEVEL.REGION_MAP ? "region-map" : "plate-city-map",
      nextHistory,
    );
    writeRecentQuestionHistory(
      s.progressStorage,
      challengeLevel === LEVEL.REGION_MAP
        ? GAUNTLET_REGION_MAP_HISTORY_KEY
        : GAUNTLET_PLATE_CITY_MAP_HISTORY_KEY,
      nextHistory,
    );
  };

  const advanceStreakChallenge = (
    challengeLevel: GauntletLevel,
    correct: boolean,
    winTarget: number,
    correctAnswer: string,
    explanation: string,
    highlight?: Pick<
      AnswerReview,
      "highlightProvinceCodes" | "highlightRegionId" | "selectedRegionId"
    >,
    mistake?: MistakeSeed,
  ) => {
    if (!correct && mistake) round.recordMistake(mistake);
    const nextStreak = correct ? s.streak + 1 : 0;
    s.setStreak(nextStreak);
    if (correct) {
      s.setFeedbackType("right");
      if (nextStreak === winTarget) {
        round.finishLevel(challengeLevel);
        return;
      }
      s.setAnswerReview(null);
      s.setProvinceAnswer("");
      s.setPlateAnswer("");
      s.setMapSelections(new Set());
      s.setQuestionIndex((value) => value + 1);
      s.setFeedback(
        challengeLevel === LEVEL.PROVINCE_SHAPE
          ? GAUNTLET_ROTATED_SILHOUETTE_FEEDBACK
          : GAUNTLET_OPENING_FEEDBACK[challengeLevel],
      );
      round.focusProvinceInput();
      return;
    }
    s.setFeedbackType("wrong");
    s.setFeedback("回答错误，请查看正确答案");
    s.setAnswerReview({
      correct: false,
      correctAnswer,
      explanation,
      level: challengeLevel,
      nextAction: "next",
      ...highlight,
    });
  };

  const advanceBossQuestion = (
    correct: boolean,
    correctAnswer: string,
    explanation: string,
  ) => {
    const question = d.currentBossQuestion;
    if (!question) return;
    if (!correct && question.kind !== "shape") {
      const correctProvince = question.kind === "map"
        ? PROVINCE_BY_CODE.get(question.provinceCode)
        : null;
      const targets = question.kind === "text"
        ? question.targets
        : question.kind === "truth"
          ? question.isTrue
            ? ["正确", "对"]
            : ["错误", "错", "不正确"]
          : correctProvince
            ? [correctProvince.name, correctProvince.shortName]
            : [correctAnswer];
      round.recordMistake({
        id: question.id,
        category: BOSS_SKILL_CATALOG.find(({ id }) => id === question.skill)
          ?.mistakeCategory ?? "城市",
        prompt: `${question.prompt}${"value" in question ? `：${question.value}` : ""}`,
        answers: targets,
        correctAnswer,
        explanation,
        answerMode:
          question.kind === "text" && question.matchAllTargets
            ? "all-plates"
            : undefined,
      });
    }
    const nextLives = correct ? s.bossLives : s.bossLives - 1;
    if (nextLives > 0) s.setBossLives(nextLives);
    s.setBossStats((current) => ({
      ...current,
      [question.skill]: {
        correct: current[question.skill].correct + (correct ? 1 : 0),
        total: current[question.skill].total + 1,
      },
    }));
    const nextIndex = s.questionIndex + 1;
    if (correct) {
      s.setFeedbackType("right");
      if (nextIndex === FINAL_BOSS_QUESTION_COUNT) {
        round.finishLevel(LEVEL.FINAL_BOSS);
        return;
      }
      s.setAnswerReview(null);
      s.setProvinceAnswer("");
      s.setPlateAnswer("");
      s.setMapSelections(new Set());
      s.setQuestionIndex(nextIndex);
      s.setFeedback(
        nextIndex % FINAL_BOSS_CHECKPOINT_SIZE === 0
          ? `已通过第 ${nextIndex / FINAL_BOSS_CHECKPOINT_SIZE} 个检查点 · ${nextIndex} / ${FINAL_BOSS_QUESTION_COUNT}`
          : GAUNTLET_OPENING_FEEDBACK[LEVEL.FINAL_BOSS],
      );
      round.focusProvinceInput();
      return;
    }
    s.setFeedbackType("wrong");
    s.setFeedback("回答错误，请查看正确答案");
    s.setAnswerReview({
      correct: false,
      correctAnswer,
      explanation,
      level: LEVEL.FINAL_BOSS,
      nextAction:
        nextLives <= 0
          ? "lose"
          : nextIndex === FINAL_BOSS_QUESTION_COUNT
            ? "finish"
            : "next",
      checkpoint: nextLives <= 0
        ? "本题答错，最后一条生命耗尽"
        : `本题答错，失去一条生命 · 剩余 ${nextLives} 条`,
      highlightProvinceCodes:
        question.kind === "map" ? [question.provinceCode] : undefined,
    });
  };

  const continueAfterReview = () => {
    if (!s.answerReview) return;
    const { level: reviewedLevel, nextAction } = s.answerReview;
    s.setAnswerReview(null);
    s.setProvinceAnswer("");
    s.setPlateAnswer("");
    s.setMapSelections(new Set());
    if (reviewedLevel === LEVEL.CITY_NEIGHBORS) {
      s.setCityNeighborHintVisible(false);
      s.setCityNeighborRetry(false);
    }
    if (reviewedLevel === LEVEL.PLATE_CITY_MAP) {
      s.setPlateCityMapFocusedProvinceCode(null);
    }
    if (nextAction === "finish") {
      round.finishLevel(reviewedLevel);
      return;
    }
    if (nextAction === "lose") {
      s.setBossLives(0);
      return;
    }
    if (reviewedLevel === LEVEL.MISTAKE_REVENGE) {
      s.setFeedbackType("idle");
      s.setFeedback(GAUNTLET_OPENING_FEEDBACK[reviewedLevel]);
      round.focusProvinceInput();
      return;
    }
    if (reviewedLevel === LEVEL.REGION_MAP) {
      s.setMapRegionOrder(createCityMapQuestionQueue(
        d.selectedMapRegionItems,
        regionMapHistoryRef.current,
        randomShuffle,
      ));
      s.setQuestionIndex(0);
    } else {
      s.setQuestionIndex((value) => value + 1);
    }
    s.setFeedbackType("idle");
    s.setFeedback(
      reviewedLevel === LEVEL.PROVINCE_SHAPE
        ? GAUNTLET_ROTATED_SILHOUETTE_FEEDBACK
        : GAUNTLET_OPENING_FEEDBACK[reviewedLevel],
    );
    round.focusProvinceInput();
  };

  return {
    advanceBossQuestion,
    advanceStreakChallenge,
    continueAfterReview,
    rememberCityMapQuestion,
  };
}

export type GauntletAdvanceActions = ReturnType<typeof useGauntletAdvanceActions>;
