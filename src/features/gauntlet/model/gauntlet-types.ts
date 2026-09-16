import type { CityQuizItem } from "@/domain/geography/data/city-plates";
import type { GauntletLevelId } from "@/domain/game/gauntlet-level-ids";
import type { BossSkill } from "@/features/gauntlet/model/boss-stats";

export type GauntletLevel = GauntletLevelId;

export type GauntletChoiceOption = {
  id: string;
  label: string;
};

export type UndercoverQuestion = {
  id: string;
  province: string;
  options: CityQuizItem[];
  answerId: string;
  explanation: string;
};

export type DualIntruderQuestion = {
  id: string;
  prompt: string;
  instruction: string;
  options: GauntletChoiceOption[];
  answerId: string;
  explanation: string;
};

export type PlateFaultQuestion = {
  id: string;
  options: GauntletChoiceOption[];
  answerId: string;
  explanation: string;
};

export type ConfusableCityQuestion = {
  id: string;
  pair: [string, string];
  prompt: string;
  instruction: string;
  options: GauntletChoiceOption[];
  answerId: string;
  explanation: string;
};

export type BossQuestion = {
  id: string;
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
  highlightRegionId?: string;
  selectedRegionId?: string;
  checkpoint?: string;
};

export type TruthQuestion = {
  id: string;
  statement: string;
  isTrue: boolean;
  explanation: string;
};
