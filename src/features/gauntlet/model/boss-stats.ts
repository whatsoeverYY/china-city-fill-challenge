import type { MistakeQuestion } from "@/domain/game/mistakes";

export const BOSS_SKILL_ID = {
  CITY_PROVINCE: "city-province",
  PLATE: "plate",
  PROVINCE_NEIGHBORS: "province-neighbors",
  TRUTH: "truth",
  MAP: "map",
  SHAPE: "shape",
} as const;

export type BossSkill =
  (typeof BOSS_SKILL_ID)[keyof typeof BOSS_SKILL_ID];

export type BossSkillStat = {
  correct: number;
  total: number;
};

export const BOSS_SKILL_CATALOG: ReadonlyArray<{
  id: BossSkill;
  label: string;
  mistakeCategory: MistakeQuestion["category"];
}> = [
  { id: BOSS_SKILL_ID.CITY_PROVINCE, label: "城市归属", mistakeCategory: "城市" },
  { id: BOSS_SKILL_ID.PLATE, label: "车牌识别", mistakeCategory: "车牌" },
  { id: BOSS_SKILL_ID.PROVINCE_NEIGHBORS, label: "省际接壤", mistakeCategory: "邻省" },
  { id: BOSS_SKILL_ID.TRUTH, label: "真假判断", mistakeCategory: "判断" },
  { id: BOSS_SKILL_ID.MAP, label: "地图落点", mistakeCategory: "城市" },
  { id: BOSS_SKILL_ID.SHAPE, label: "轮廓辨认", mistakeCategory: "城市" },
];

export function createEmptyBossStats(): Record<BossSkill, BossSkillStat> {
  return Object.fromEntries(
    BOSS_SKILL_CATALOG.map(({ id }) => [id, { correct: 0, total: 0 }]),
  ) as Record<BossSkill, BossSkillStat>;
}
