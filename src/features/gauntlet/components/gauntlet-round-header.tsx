"use client";

import {
  FINAL_BOSS_LIFE_COUNT,
  GAUNTLET_ROUND_HEADINGS,
  GAUNTLET_URGENT_TIME_SECONDS,
} from "@/features/gauntlet/config/gauntlet-config";
import {
  GAUNTLET_LEVEL_BY_ID,
  gauntletLevelNumber,
} from "@/domain/game/gauntlet-levels";
import { GAUNTLET_LEVEL_ID } from "@/domain/game/gauntlet-level-ids";
import type { GauntletActions } from "@/features/gauntlet/hooks/use-gauntlet-actions";
import { useGauntletDerived } from "@/features/gauntlet/model/gauntlet-derived-context";
import { useGauntletSession } from "@/features/gauntlet/model/gauntlet-session-context";

const LEVEL = GAUNTLET_LEVEL_ID;

function progressLabel(level: NonNullable<ReturnType<typeof useGauntletSession>["level"]>) {
  if (level === LEVEL.PROVINCE_SHAPE) return "答题进度";
  if (level === LEVEL.NEIGHBOR_CHAIN) return "路线长度";
  if (level === LEVEL.MISTAKE_REVENGE) return "错题进度";
  if (level === LEVEL.FINAL_BOSS) return "题目进度";
  return "当前连胜";
}

export default function GauntletRoundHeader({
  actions,
}: {
  actions: GauntletActions;
}) {
  const s = useGauntletSession();
  const d = useGauntletDerived();
  if (!s.level) return null;

  const activeConfig = GAUNTLET_LEVEL_BY_ID.get(s.level) ?? null;
  const displayNumber = gauntletLevelNumber(s.level);
  return (
    <section className="gauntlet-round-heading">
      <div>
        <button type="button" onClick={actions.returnToLevels}>← 返回选关</button>
        <p className="eyebrow">第 {displayNumber} 关 · {activeConfig?.title}</p>
        <h1>{GAUNTLET_ROUND_HEADINGS[s.level]}</h1>
      </div>
      <div
        className={`gauntlet-round-actions ${
          !d.timedMode && s.level !== LEVEL.FINAL_BOSS ? "is-progress-only" : ""
        }`}
      >
        {s.level === LEVEL.FINAL_BOSS ? (
          <div className="boss-lives" aria-label={`剩余 ${s.bossLives} 条生命`}>
            <span>生命</span>
            <strong>
              {Array.from({ length: FINAL_BOSS_LIFE_COUNT }, (_, index) => (
                <i key={index} className={index < s.bossLives ? "is-alive" : ""}>
                  ♥
                </i>
              ))}
            </strong>
          </div>
        ) : null}
        {d.timedMode ? (
          <div className={`gauntlet-timer ${
            s.timeLeft <= GAUNTLET_URGENT_TIME_SECONDS ? "is-urgent" : ""
          }`}>
            <span>剩余时间</span>
            <strong>{s.timeLeft}<i> 秒</i></strong>
          </div>
        ) : null}
        <div className="gauntlet-progress-card">
          <span>{progressLabel(s.level)}</span>
          <strong>
            {s.level === LEVEL.MISTAKE_REVENGE && d.target === 0
              ? "暂无"
              : <>{d.progress}<i> / {d.target}</i></>}
          </strong>
          <div>
            <span
              style={{
                width: `${d.target ? (d.progress / d.target) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
