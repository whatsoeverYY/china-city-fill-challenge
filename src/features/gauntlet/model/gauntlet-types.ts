import type { CityQuizItem } from "@/domain/geography/data/city-plates";
import type { GauntletLevelId } from "@/domain/game/gauntlet-level-ids";
import type { BossSkill } from "@/features/gauntlet/model/boss-stats";

export type GauntletLevel = GauntletLevelId;

export type UndercoverQuestion = {
  province: string;
  options: CityQuizItem[];
  answerCity: string;
  explanation: string;
};

export type DualIntruderQuestion = {
  prompt: string;
  instruction: string;
  options: string[];
  answer: string;
  explanation: string;
};

export type PlateFaultQuestion = {
  options: Array<{ id: string; label: string }>;
  answer: string;
  explanation: string;
};

export type RouteChallenge = {
  startCode: string;
  endCode: string;
  shortestPath: string[];
};

export type ConfusableCityQuestion = {
  id: string;
  pair: [string, string];
  prompt: string;
  instruction: string;
  options: string[];
  answer: string;
  explanation: string;
};

export type CityAdjacencyMap = Record<string, string[]>;

export type CityRouteChallenge = {
  provinceCode: string;
  startName: string;
  endName: string;
  shortestPath: string[];
};

export type BossQuestion = {
  skill: BossSkill;
} & (
  | {
      kind: "text";
      badge: string;
      prompt: string;
      value: string;
      targets: string[];
      explanation: string;
      matchAllTargets?: boolean;
    }
  | {
      kind: "truth";
      badge: string;
      prompt: string;
      value: string;
      isTrue: boolean;
      explanation: string;
    }
  | {
      kind: "map";
      badge: string;
      prompt: string;
      value: string;
      provinceCode: string;
      explanation: string;
    }
  | {
      kind: "shape";
      badge: string;
      prompt: string;
      provinceCode: string;
      targets: string[];
      explanation: string;
    }
);

export type AnswerReview = {
  correct: boolean;
  correctAnswer: string;
  explanation: string;
  level: GauntletLevel;
  nextAction: "next" | "finish" | "lose";
  highlightProvinceCodes?: string[];
  highlightRegionName?: string;
  selectedRegionName?: string;
  checkpoint?: string;
};

export type TruthQuestion = {
  statement: string;
  isTrue: boolean;
  explanation: string;
};
