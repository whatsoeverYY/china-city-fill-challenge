import { MAX_MISTAKE_QUESTIONS } from "./progress-config.ts";

export type MistakeQuestion = {
  id: string;
  category: "省份" | "城市" | "城市数量" | "车牌" | "省会" | "高校" | "判断";
  prompt: string;
  answers: string[];
  correctAnswer: string;
  explanation: string;
  wrongCount: number;
  answerMode?: "all-plates" | "all-plate-letters";
};

export type MistakeSeed = Omit<MistakeQuestion, "wrongCount">;

export function isMistakeQuestion(value: unknown): value is MistakeQuestion {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<MistakeQuestion>;
  return (
    typeof item.id === "string" &&
    typeof item.category === "string" &&
    typeof item.prompt === "string" &&
    Array.isArray(item.answers) &&
    item.answers.every((answer) => typeof answer === "string") &&
    typeof item.correctAnswer === "string" &&
    typeof item.explanation === "string" &&
    typeof item.wrongCount === "number" &&
    Number.isFinite(item.wrongCount) &&
    item.wrongCount >= 0 &&
    (item.answerMode === undefined ||
      item.answerMode === "all-plates" ||
      item.answerMode === "all-plate-letters")
  );
}

export function upsertMistake(
  current: MistakeQuestion[],
  seed: MistakeSeed,
) {
  const existing = current.find((item) => item.id === seed.id);
  const next = [
    ...current.filter((item) => item.id !== seed.id),
    { ...seed, wrongCount: (existing?.wrongCount ?? 0) + 1 },
  ];
  return next.slice(-MAX_MISTAKE_QUESTIONS);
}

export function normalizeMistakeList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isMistakeQuestion)
    .slice(-MAX_MISTAKE_QUESTIONS);
}
