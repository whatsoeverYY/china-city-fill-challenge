"use client";

import BossSkillSummary from "@/features/gauntlet/components/boss-skill-summary";
import {
  GAUNTLET_REGION_MAP_MAX_TARGET,
  ROTATED_SILHOUETTE_STREAK_TARGET,
} from "@/features/gauntlet/config/gauntlet-config";
import {
  GAUNTLET_LEVEL_BY_ID,
  GAUNTLET_LEVELS,
  gauntletLevelNumber,
} from "@/domain/game/gauntlet-levels";
import { GAUNTLET_LEVEL_ID } from "@/domain/game/gauntlet-level-ids";
import type { GauntletActions } from "@/features/gauntlet/hooks/use-gauntlet-actions";
import { useGauntletDerived } from "@/features/gauntlet/model/gauntlet-derived-context";
import { useGauntletSession } from "@/features/gauntlet/model/gauntlet-session-context";

const LEVEL = GAUNTLET_LEVEL_ID;

export default function GauntletOutcome({ actions }: { actions: GauntletActions }) {
  const s = useGauntletSession();
  const d = useGauntletDerived();
  if (!s.level) return null;

  const displayNumber = gauntletLevelNumber(s.level);
  const activeConfig = GAUNTLET_LEVEL_BY_ID.get(s.level) ?? null;
  const activeIndex = GAUNTLET_LEVELS.findIndex((item) => item.id === s.level);
  const nextLevel = GAUNTLET_LEVELS[activeIndex + 1] ?? null;
  const completedTarget = s.passedLevel === LEVEL.PROVINCE_SHAPE
    ? `已完成 ${d.provinceShapeNormalTarget} 道普通轮廓，并连续答对 ${ROTATED_SILHOUETTE_STREAK_TARGET} 道旋转轮廓`
    : s.passedLevel === LEVEL.REGION_MAP &&
        d.target < GAUNTLET_REGION_MAP_MAX_TARGET
      ? `已连续答对当前范围完整一轮（${d.target} 题）`
      : activeConfig
        ? `已完成目标：${activeConfig.target}`
        : "已完成本关目标";

  if (d.hasTimedOut || d.hasLostBoss) {
    return (
      <section className="gauntlet-passed gauntlet-timeout mx-auto grid max-w-3xl justify-items-center gap-4 rounded-[28px_28px_28px_8px] bg-card p-[clamp(28px,6vw,64px)] text-center shadow-xl" aria-live="polite">
        <span className="gauntlet-pass-seal grid size-24 place-items-center rounded-[30px_30px_30px_8px] bg-brand-red text-4xl font-black text-white max-md:text-3xl" aria-hidden="true">
          {d.hasLostBoss ? "败" : "时"}
        </span>
        <p className="eyebrow m-0 text-xs font-black tracking-[0.18em] text-brand-red">
          第 {displayNumber} 关 · {d.hasLostBoss ? "生命耗尽" : "时间耗尽"}
        </p>
        <h1 className="m-0 text-[clamp(34px,6vw,62px)] font-black max-md:text-3xl">还差一点，再冲一次</h1>
        <p className="m-0 text-sm text-ink-soft">
          {d.hasLostBoss
            ? "三条生命已经用完，本轮成绩不会计入通关记录。"
            : `${s.timeLimit} 秒倒计时已结束，本轮成绩不会计入通关记录。`}
        </p>
        {d.hasLostBoss ? <BossSkillSummary stats={s.bossStats} /> : null}
        <div className="flex flex-wrap justify-center gap-2">
          <button className="min-h-11 cursor-pointer rounded-full border-0 bg-brand-red px-5 font-black text-white" type="button" onClick={() => actions.startLevel(s.level!)}>
            重新挑战
          </button>
          <button type="button" className="min-h-11 cursor-pointer rounded-full border-0 bg-ink/10 px-5 font-black text-ink" onClick={actions.returnToLevels}>
            返回选关
          </button>
        </div>
      </section>
    );
  }

  if (!s.passedLevel) return null;
  return (
    <section className="gauntlet-passed mx-auto grid max-w-3xl justify-items-center gap-4 rounded-[28px_28px_28px_8px] bg-card p-[clamp(28px,6vw,64px)] text-center shadow-xl" aria-live="polite">
      <span className="gauntlet-pass-seal grid size-24 place-items-center rounded-[30px_30px_30px_8px] bg-brand-green text-4xl font-black text-white max-md:text-3xl" aria-hidden="true">胜</span>
      <p className="eyebrow m-0 text-xs font-black tracking-[0.18em] text-brand-red">第 {displayNumber} 关 · 挑战达成</p>
      <h1 className="m-0 text-[clamp(34px,6vw,62px)] font-black max-md:text-3xl">{activeConfig?.title}，过关！</h1>
      <p className="m-0 text-sm text-ink-soft">{completedTarget}，这一关已留下通关印记。</p>
      {s.passedLevel === LEVEL.FINAL_BOSS
        ? <BossSkillSummary stats={s.bossStats} />
        : null}
      <div className="flex flex-wrap justify-center gap-2">
        {nextLevel ? (
          <button className="min-h-11 cursor-pointer rounded-full border-0 bg-brand-red px-5 font-black text-white" type="button" onClick={() => actions.startLevel(nextLevel.id)}>
            挑战下一关
          </button>
        ) : null}
        <button
          type="button"
          className="min-h-11 cursor-pointer rounded-full border-0 bg-brand-green px-5 font-black text-white"
          onClick={() => actions.startLevel(s.passedLevel!)}
        >
          再来一次
        </button>
        <button type="button" className="min-h-11 cursor-pointer rounded-full border-0 bg-ink/10 px-5 font-black text-ink" onClick={actions.returnToLevels}>
          返回选关
        </button>
      </div>
    </section>
  );
}
