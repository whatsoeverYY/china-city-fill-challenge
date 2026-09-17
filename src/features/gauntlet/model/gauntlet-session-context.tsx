"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Province } from "@/domain/geography/data/provinces";
import type { ProvinceGroup } from "@/domain/geography/data/geographic-groups";
import type { ProvinceCityCountItem } from "@/domain/geography/data/province-city-counts";
import type { UniversityQuizItem } from "@/domain/geography/data/universities";
import {
  createEmptyBossStats,
  type BossSkill,
  type BossSkillStat,
} from "@/features/gauntlet/model/boss-stats";
import {
  ALL_GAUNTLET_SHAPE_PROVINCE_CODES,
  FINAL_BOSS_LIFE_COUNT,
  GAUNTLET_TIME_LIMIT,
  GAUNTLET_TIME_LIMITS,
  type GauntletTimeLimit,
} from "@/features/gauntlet/config/gauntlet-config";
import type { CityQuizItem } from "@/domain/geography/data/city-plates";
import type { MapRegionQuizItem } from "@/features/gauntlet/data/map-region-quiz-data";
import type {
  AnswerReview,
  BossQuestion,
  ConfusableCityQuestion,
  DualIntruderQuestion,
  GauntletLevel,
  PlateFaultQuestion,
  TruthQuestion,
  UndercoverQuestion,
} from "@/features/gauntlet/model/gauntlet-types";
import type { MistakeQuestion } from "@/domain/game/mistakes";
import type { MapData, MapFeature } from "@/features/map/model/map-data";
import { usePlayerData } from "@/features/player/player-data-context";

function useGauntletSessionValue({
  nationalMap,
  nationalError,
}: {
  nationalMap: MapData | null;
  nationalError: boolean;
}) {
  const { identity, progressStorage } = usePlayerData();
  const [level, setLevel] = useState<GauntletLevel | null>(null);
  const [passedLevel, setPassedLevel] = useState<GauntletLevel | null>(null);
  const [completedLevels, setCompletedLevels] = useState<Set<string>>(new Set());
  const [provinceOrder, setProvinceOrder] = useState<MapFeature[]>([]);
  const [provinceChallengeOrder, setProvinceChallengeOrder] = useState<Province[]>([]);
  const [cityOrder, setCityOrder] = useState<CityQuizItem[]>([]);
  const [mapRegionOrder, setMapRegionOrder] = useState<MapRegionQuizItem[]>([]);
  const [universityOrder, setUniversityOrder] = useState<UniversityQuizItem[]>([]);
  const [mistakes, setMistakes] = useState<MistakeQuestion[]>([]);
  const [mistakeOrder, setMistakeOrder] = useState<MistakeQuestion[]>([]);
  const [mistakeSessionTotal, setMistakeSessionTotal] = useState(0);
  const [confusableOrder, setConfusableOrder] = useState<ConfusableCityQuestion[]>([]);
  const [provinceCityCountOrder, setProvinceCityCountOrder] =
    useState<ProvinceCityCountItem[]>([]);
  const [truthOrder, setTruthOrder] = useState<TruthQuestion[]>([]);
  const [undercoverOrder, setUndercoverOrder] = useState<UndercoverQuestion[]>([]);
  const [dualIntruderOrder, setDualIntruderOrder] =
    useState<DualIntruderQuestion[]>([]);
  const [plateFaultOrder, setPlateFaultOrder] = useState<PlateFaultQuestion[]>([]);
  const [groupOrder, setGroupOrder] = useState<ProvinceGroup[]>([]);
  const [bossOrder, setBossOrder] = useState<BossQuestion[]>([]);
  const [bossLives, setBossLives] = useState(FINAL_BOSS_LIFE_COUNT);
  const [bossStats, setBossStats] = useState<Record<BossSkill, BossSkillStat>>(
    createEmptyBossStats,
  );
  const [answerReview, setAnswerReview] = useState<AnswerReview | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [provinceAnswer, setProvinceAnswer] = useState("");
  const [plateAnswer, setPlateAnswer] = useState("");
  const [mapSelections, setMapSelections] = useState<Set<string>>(new Set());
  const [cityNeighborHintVisible, setCityNeighborHintVisible] = useState(false);
  const [cityNeighborRetry, setCityNeighborRetry] = useState(false);
  const [plateCityMapFocusedProvinceCode, setPlateCityMapFocusedProvinceCode] =
    useState<string | null>(null);
  const [routeCodes, setRouteCodes] = useState<string[]>([]);
  const [timeLimit, setTimeLimit] = useState<GauntletTimeLimit>(
    GAUNTLET_TIME_LIMITS.UNLIMITED,
  );
  const [timeLeft, setTimeLeft] = useState<number>(GAUNTLET_TIME_LIMIT);
  const [feedback, setFeedback] = useState("准备好后提交答案");
  const [feedbackType, setFeedbackType] =
    useState<"idle" | "right" | "wrong">("idle");
  const [selectedShapeProvinceCodes, setSelectedShapeProvinceCodes] = useState(
    () => new Set(ALL_GAUNTLET_SHAPE_PROVINCE_CODES),
  );
  const [draftShapeProvinceCodes, setDraftShapeProvinceCodes] = useState(
    () => new Set(ALL_GAUNTLET_SHAPE_PROVINCE_CODES),
  );
  const [provinceScopeReady, setProvinceScopeReady] = useState(false);
  const [provinceScopeMessage, setProvinceScopeMessage] = useState("");
  const [provincePickerOpen, setProvincePickerOpen] = useState(false);
  const provinceInputRef = useRef<HTMLInputElement>(null);
  const regionMapHistoryRef = useRef<string[]>([]);
  const plateCityMapHistoryRef = useRef<string[]>([]);
  const setRecentQuestionHistory = (
    channel: "region-map" | "plate-city-map",
    history: string[],
  ) => {
    const target = channel === "region-map"
      ? regionMapHistoryRef
      : plateCityMapHistoryRef;
    target.current = history;
  };

  return {
    answerReview, bossLives, bossOrder, bossStats, cityNeighborHintVisible,
    cityNeighborRetry, cityOrder, completedLevels,
    confusableOrder, draftShapeProvinceCodes,
    dualIntruderOrder, feedback, feedbackType, groupOrder, identity, level,
    mapRegionOrder, mapSelections, mistakeOrder, mistakes, mistakeSessionTotal,
    nationalError, nationalMap, passedLevel, plateAnswer,
    plateCityMapFocusedProvinceCode, plateCityMapHistoryRef, plateFaultOrder,
    progressStorage, provinceAnswer, provinceChallengeOrder, provinceCityCountOrder,
    provinceInputRef, provinceOrder, provincePickerOpen, provinceScopeMessage,
    provinceScopeReady, questionIndex, regionMapHistoryRef, routeCodes,
    selectedShapeProvinceCodes, streak, timeLeft, timeLimit, truthOrder,
    undercoverOrder, universityOrder,
    setAnswerReview, setBossLives, setBossOrder, setBossStats,
    setCityNeighborHintVisible, setCityNeighborRetry, setCityOrder,
    setCompletedLevels, setConfusableOrder, setDraftShapeProvinceCodes,
    setDualIntruderOrder,
    setFeedback, setFeedbackType, setGroupOrder, setLevel, setMapRegionOrder,
    setMapSelections, setMistakeOrder, setMistakes, setMistakeSessionTotal,
    setPassedLevel, setPlateAnswer, setPlateCityMapFocusedProvinceCode,
    setPlateFaultOrder, setProvinceAnswer, setProvinceChallengeOrder,
    setProvinceCityCountOrder, setProvinceOrder, setProvincePickerOpen,
    setProvinceScopeMessage, setProvinceScopeReady, setQuestionIndex,
    setRouteCodes, setSelectedShapeProvinceCodes, setStreak,
    setTimeLeft, setTimeLimit, setTruthOrder, setUndercoverOrder,
    setUniversityOrder, setRecentQuestionHistory,
  };
}

export type GauntletSession = ReturnType<typeof useGauntletSessionValue>;

const GauntletSessionContext = createContext<GauntletSession | null>(null);

export function GauntletSessionProvider({
  children,
  ...props
}: {
  children: ReactNode;
  nationalMap: MapData | null;
  nationalError: boolean;
}) {
  return (
    <GauntletSessionContext.Provider value={useGauntletSessionValue(props)}>
      {children}
    </GauntletSessionContext.Provider>
  );
}

export function useGauntletSession() {
  const session = useContext(GauntletSessionContext);
  if (!session) throw new Error("GauntletSessionProvider is missing");
  return session;
}
