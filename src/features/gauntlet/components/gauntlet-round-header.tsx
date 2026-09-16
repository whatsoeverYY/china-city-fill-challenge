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
    <section className="gauntlet-round-heading mb-5 grid grid-cols-[1fr_auto] items-end gap-5 max-lg:grid-cols-1 max-md:mb-3 max-md:gap-2">
      <div>
        <button className="cursor-pointer border-0 bg-transparent p-0 text-xs font-black text-brand-red max-md:hidden" type="button" onClick={actions.returnToLevels}>← 返回选关</button>
        <p className="eyebrow m-0 text-xs font-black tracking-[0.18em] text-brand-red">第 {displayNumber} 关 · {activeConfig?.title}</p>
        <h1 className="mb-0 mt-2 text-[clamp(30px,5vw,58px)] font-black leading-none max-md:text-3xl">{GAUNTLET_ROUND_HEADINGS[s.level]}</h1>
      </div>
      <div className="gauntlet-round-actions flex gap-3 max-md:hidden max-sm:grid max-sm:grid-cols-2">
        {s.level === LEVEL.FINAL_BOSS ? (
          <div className="boss-lives rounded-2xl bg-[#3b243d] p-3 text-white" aria-label={`剩余 ${s.bossLives} 条生命`}>
            <span className="text-[9px] font-black text-white/60">生命</span>
            <strong>
              {Array.from({ length: FINAL_BOSS_LIFE_COUNT }, (_, index) => (
                <i key={index} className={`not-italic ${index < s.bossLives ? "text-brand-red" : "text-white/20"}`}>
                  ♥
                </i>
              ))}
            </strong>
          </div>
        ) : null}
        {d.timedMode ? (
          <div className={`gauntlet-timer min-w-32 rounded-2xl p-3 text-white ${
            s.timeLeft <= GAUNTLET_URGENT_TIME_SECONDS ? "animate-pulse bg-brand-red-dark" : "bg-ink"
          }`}>
            <span className="text-[9px] font-black text-white/60">剩余时间</span>
            <strong className="block text-2xl">{s.timeLeft}<i className="text-xs not-italic"> 秒</i></strong>
          </div>
        ) : null}
        <div className="gauntlet-progress-card min-w-44 rounded-2xl border border-black/10 bg-card p-3">
          <span className="text-[9px] font-black text-ink-soft">{progressLabel(s.level)}</span>
          <strong className="block text-2xl">
            {s.level === LEVEL.MISTAKE_REVENGE && d.target === 0
              ? "暂无"
              : <>{d.progress}<i className="text-xs not-italic text-ink-soft"> / {d.target}</i></>}
          </strong>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/10">
            <span
              className="block h-full bg-brand-green"
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
