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
      <section className="gauntlet-passed gauntlet-timeout mx-auto mt-[70px] grid min-h-[500px] max-w-[760px] content-center justify-items-center gap-4 rounded-[26px] border border-city-500/25 bg-[rgba(251,248,240,.94)] [background-image:radial-gradient(circle_at_50%_0%,rgba(213,169,69,.18),transparent_24rem)] p-[60px] text-center shadow-[0_30px_70px_rgba(57,46,31,.1)] max-sm:mt-9 max-sm:min-h-[440px] max-sm:p-[35px_20px]" aria-live="polite">
        <span className="gauntlet-pass-seal mb-[30px] grid size-[98px] -rotate-4 place-items-center rounded-full bg-city-500 font-serif text-[46px] font-black text-gold-100 shadow-[inset_0_0_0_5px_rgba(255,248,231,.24),0_18px_42px_rgba(114,48,40,.2)]" aria-hidden="true">
          {d.hasLostBoss ? "败" : "时"}
        </span>
        <p className="eyebrow m-0 text-xs font-black tracking-[0.18em] text-city-500">
          第 {displayNumber} 关 · {d.hasLostBoss ? "生命耗尽" : "时间耗尽"}
        </p>
        <h1 className="m-0 font-serif text-[clamp(34px,6vw,62px)] font-bold">还差一点，再冲一次</h1>
        <p className="m-0 text-sm text-ink-soft">
          {d.hasLostBoss
            ? "三条生命已经用完，本轮成绩不会计入通关记录。"
            : `${s.timeLimit} 秒倒计时已结束，本轮成绩不会计入通关记录。`}
        </p>
        {d.hasLostBoss ? <BossSkillSummary stats={s.bossStats} /> : null}
        <div className="flex flex-wrap justify-center gap-2">
          <button className="min-h-11 cursor-pointer rounded-full border-0 bg-city-500 px-5 font-black text-white" type="button" onClick={() => actions.startLevel(s.level!)}>
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
    <section className="gauntlet-passed mx-auto mt-[70px] grid min-h-[500px] max-w-[760px] content-center justify-items-center gap-4 rounded-[26px] border border-jade-500/25 bg-[rgba(251,248,240,.94)] [background-image:radial-gradient(circle_at_50%_0%,rgba(213,169,69,.18),transparent_24rem)] p-[60px] text-center shadow-[0_30px_70px_rgba(57,46,31,.1)] max-sm:mt-9 max-sm:min-h-[440px] max-sm:p-[35px_20px]" aria-live="polite">
      <span className="gauntlet-pass-seal mb-[30px] grid size-[98px] -rotate-4 place-items-center rounded-full bg-jade-500 font-serif text-[46px] font-black text-gold-100 shadow-[inset_0_0_0_5px_rgba(255,248,231,.24),0_18px_42px_rgba(29,87,64,.2)]" aria-hidden="true">胜</span>
      <p className="eyebrow m-0 text-xs font-black tracking-[0.18em] text-city-500">第 {displayNumber} 关 · 挑战达成</p>
      <h1 className="m-0 font-serif text-[clamp(34px,6vw,62px)] font-bold">{activeConfig?.title}，过关！</h1>
      <p className="m-0 text-sm text-ink-soft">{completedTarget}，这一关已留下通关印记。</p>
      {s.passedLevel === LEVEL.FINAL_BOSS
        ? <BossSkillSummary stats={s.bossStats} />
        : null}
      <div className="flex flex-wrap justify-center gap-2">
        {nextLevel ? (
          <button className="min-h-11 cursor-pointer rounded-full border-0 bg-city-500 px-5 font-black text-white" type="button" onClick={() => actions.startLevel(nextLevel.id)}>
            挑战下一关
          </button>
        ) : null}
        <button
          type="button"
          className="min-h-11 cursor-pointer rounded-full border-0 bg-jade-500 px-5 font-black text-white"
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
