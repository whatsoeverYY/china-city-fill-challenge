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

export default function GauntletRoundHeader() {
  const s = useGauntletSession();
  const d = useGauntletDerived();
  if (!s.level) return null;

  const activeConfig = GAUNTLET_LEVEL_BY_ID.get(s.level) ?? null;
  const displayNumber = gauntletLevelNumber(s.level);
  return (
    <section className="gauntlet-round-heading grid grid-cols-[1fr_auto] items-end gap-8 px-1 pb-5 pt-9 max-lg:grid-cols-1 max-lg:gap-2 max-md:pt-5">
      <div>
        <p className="eyebrow mb-2 mt-0 text-[11px] font-extrabold tracking-[0.24em] text-city-500">第 {displayNumber} 关 · {activeConfig?.title}</p>
        <h1 className="m-0 font-serif text-page font-bold max-md:text-page-mobile">{GAUNTLET_ROUND_HEADINGS[s.level]}</h1>
      </div>
      <div className="gauntlet-round-actions flex items-stretch gap-2.5 max-sm:grid max-sm:grid-cols-2">
        {s.level === LEVEL.FINAL_BOSS ? (
          <div className="boss-lives grid min-w-[116px] content-center rounded-[15px] border border-city-500/25 bg-city-300 px-[15px] py-3 text-center" aria-label={`剩余 ${s.bossLives} 条生命`}>
            <span className="text-meta font-extrabold tracking-[.12em] text-stone-600">生命</span>
            <strong>
              {Array.from({ length: FINAL_BOSS_LIFE_COUNT }, (_, index) => (
                <i key={index} className={`text-[21px] not-italic leading-[1.15] ${index < s.bossLives ? "text-city-500 drop-shadow-[0_3px_3px_rgba(180,59,50,.16)]" : "text-stone-400"}`}>
                  ♥
                </i>
              ))}
            </strong>
          </div>
        ) : null}
        {d.timedMode ? (
          <div className={`gauntlet-timer grid min-w-[116px] content-center rounded-[15px] border px-4 py-[13px] text-center ${
            s.timeLeft <= GAUNTLET_URGENT_TIME_SECONDS ? "animate-pulse border-city-500/40 bg-clay-300 text-city-900" : "border-jade-500/25 bg-jade-200 text-jade-700"
          }`}>
            <span className="text-meta font-extrabold tracking-[.1em]">剩余时间</span>
            <strong className="block font-numeric text-2xl leading-[1.1]">{s.timeLeft}<i className="[font-family:inherit] text-xs not-italic"> 秒</i></strong>
          </div>
        ) : null}
        <div className="gauntlet-progress-card grid w-[250px] grid-cols-[auto_auto] items-baseline rounded-[15px] border border-black/[.14] bg-card/80 px-5 py-[17px] max-sm:w-auto">
          <span className="text-[10px] font-extrabold tracking-[.12em] text-ink-soft">{progressLabel(s.level)}</span>
          <strong className="justify-self-end font-numeric text-2xl text-city-500">
            {s.level === LEVEL.MISTAKE_REVENGE && d.target === 0
              ? "暂无"
              : <>{d.progress}<i className="text-[13px] font-medium not-italic text-stone-600"> / {d.target}</i></>}
          </strong>
          <div className="col-span-full mt-[9px] h-[5px] overflow-hidden rounded-full bg-paper-800">
            <span
              className="block h-full rounded-[inherit] bg-gradient-to-r from-city-500 to-gold-500 transition-[width] duration-300"
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
