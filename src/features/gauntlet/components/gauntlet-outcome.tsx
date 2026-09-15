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
    : s.passedLevel === LEVEL.PROVINCE_PUZZLE
      ? `已完成本轮所选的 ${d.target} 块省份拼图`
      : s.passedLevel === LEVEL.REGION_MAP &&
          d.target < GAUNTLET_REGION_MAP_MAX_TARGET
        ? `已连续答对当前范围完整一轮（${d.target} 题）`
        : activeConfig
          ? `已完成目标：${activeConfig.target}`
          : "已完成本关目标";

  if (d.hasTimedOut || d.hasLostBoss) {
    return (
      <section className="gauntlet-passed gauntlet-timeout" aria-live="polite">
        <span className="gauntlet-pass-seal" aria-hidden="true">
          {d.hasLostBoss ? "败" : "时"}
        </span>
        <p className="eyebrow">
          第 {displayNumber} 关 · {d.hasLostBoss ? "生命耗尽" : "时间耗尽"}
        </p>
        <h1>还差一点，再冲一次</h1>
        <p>
          {d.hasLostBoss
            ? "三条生命已经用完，本轮成绩不会计入通关记录。"
            : `${s.timeLimit} 秒倒计时已结束，本轮成绩不会计入通关记录。`}
        </p>
        {d.hasLostBoss ? <BossSkillSummary stats={s.bossStats} /> : null}
        <div>
          <button type="button" onClick={() => actions.startLevel(s.level!)}>
            重新挑战
          </button>
          <button type="button" className="is-text" onClick={actions.returnToLevels}>
            返回选关
          </button>
        </div>
      </section>
    );
  }

  if (!s.passedLevel) return null;
  return (
    <section className="gauntlet-passed" aria-live="polite">
      <span className="gauntlet-pass-seal" aria-hidden="true">胜</span>
      <p className="eyebrow">第 {displayNumber} 关 · 挑战达成</p>
      <h1>{activeConfig?.title}，过关！</h1>
      <p>{completedTarget}，这一关已留下通关印记。</p>
      {s.passedLevel === LEVEL.FINAL_BOSS
        ? <BossSkillSummary stats={s.bossStats} />
        : null}
      <div>
        {nextLevel ? (
          <button type="button" onClick={() => actions.startLevel(nextLevel.id)}>
            挑战下一关
          </button>
        ) : null}
        <button
          type="button"
          className="is-secondary"
          onClick={() => actions.startLevel(s.passedLevel!)}
        >
          再来一次
        </button>
        <button type="button" className="is-text" onClick={actions.returnToLevels}>
          返回选关
        </button>
      </div>
    </section>
  );
}
