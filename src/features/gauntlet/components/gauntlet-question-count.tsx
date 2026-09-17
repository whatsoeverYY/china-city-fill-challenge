"use client";

import { PROVINCE_GROUPS } from "@/domain/geography/data/geographic-groups";
import { PLATE_QUESTION_LEVELS, ROTATED_SILHOUETTE_STREAK_TARGET } from "@/features/gauntlet/config/gauntlet-config";
import { GAUNTLET_LEVEL_ID } from "@/domain/game/gauntlet-level-ids";
import { useGauntletDerived } from "@/features/gauntlet/model/gauntlet-derived-context";
import { useGauntletSession } from "@/features/gauntlet/model/gauntlet-session-context";

const LEVEL = GAUNTLET_LEVEL_ID;

export default function GauntletQuestionCount() {
  const s = useGauntletSession();
  const d = useGauntletDerived();
  if (!s.level) return null;

  let label: string;
  if (s.level === LEVEL.PROVINCE_SHAPE) {
    label = d.isRotatedProvinceShapeStage
      ? `旋转阶段 · 当前连胜 ${s.streak} / ${ROTATED_SILHOUETTE_STREAK_TARGET}`
      : `普通阶段 · 第 ${s.questionIndex + 1} / ${d.provinceShapeNormalTarget} 题`;
  } else if (s.level === LEVEL.PROVINCE_NEIGHBORS) {
    label = `${s.selectedShapeProvinceCodes.size} 省 · 第 ${s.questionIndex + 1} 题`;
  } else if (s.level === LEVEL.NEIGHBOR_CHAIN) {
    label = `全国路线 · 已走 ${s.routeCodes.length} / ${d.target}`;
  } else if (s.level === LEVEL.TERRITORY_GROUPS) {
    label = `疆域集合 · 第 ${(s.questionIndex % PROVINCE_GROUPS.length) + 1} / ${PROVINCE_GROUPS.length} 组`;
  } else if (s.level === LEVEL.MISTAKE_REVENGE) {
    label = `历史错题 · 剩余 ${s.mistakeOrder.length} 题`;
  } else if (s.level === LEVEL.CONFUSABLE_CITIES) {
    label = `易混城市 · 第 ${s.questionIndex + 1} 题`;
  } else if (s.level === LEVEL.PROVINCE_CITY_COUNT) {
    label = `${s.selectedShapeProvinceCodes.size} 省 · 第 ${s.questionIndex + 1} 题`;
  } else if (s.level === LEVEL.CITY_NEIGHBORS) {
    label = `${s.selectedShapeProvinceCodes.size} 省 · ${s.mapRegionOrder.length} 行政区 · 第 ${s.questionIndex + 1} 题`;
  } else if (s.level === LEVEL.FINAL_BOSS) {
    label = `终极混战 · 第 ${s.questionIndex + 1} / ${d.target} 题`;
  } else if (s.level === LEVEL.UNIVERSITY_CITY) {
    label = `${d.selectedUniversityProvinces.size} 省 · ${s.universityOrder.length} 校 · 第 ${s.questionIndex + 1} 题`;
  } else if (s.level === LEVEL.REGION_MAP) {
    label = `${s.selectedShapeProvinceCodes.size} 省 · ${d.mapRegionPoolSize} 区块 · 第 ${s.streak + 1} / ${d.target} 题`;
  } else if (s.level === LEVEL.PLATE_CITY_MAP) {
    label = `${d.selectedQuizProvinces.size} 省 · ${d.cityPoolSize} 城市/地区 · 第 ${s.questionIndex + 1} 题`;
  } else {
    const noun = PLATE_QUESTION_LEVELS.has(s.level) ? "城市/地区" : "城";
    label = `${d.selectedQuizProvinces.size} 省 · ${s.cityOrder.length} ${noun} · 第 ${s.questionIndex + 1} 题`;
  }
  return <span className="question-count absolute left-[25px] top-[22px] z-[3] rounded-full border border-black/[.13] bg-paper-100/75 px-2.5 py-1.5 text-[10px] font-extrabold tracking-[.08em] text-stone-700 max-sm:left-3 max-sm:top-3 max-sm:text-[9px]">{label}</span>;
}
