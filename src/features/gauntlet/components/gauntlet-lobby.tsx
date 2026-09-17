"use client";

import { PROVINCES } from "@/domain/geography/data/provinces";
import {
  GAUNTLET_REGION_MAP_MAX_TARGET,
  GAUNTLET_TIME_LIMITS,
  MAP_REQUIRED_LEVELS,
  nextGauntletTimeLimit,
  ROTATED_SILHOUETTE_STREAK_TARGET,
} from "@/features/gauntlet/config/gauntlet-config";
import {
  GAUNTLET_LEVEL_COUNT,
  GAUNTLET_LEVELS,
} from "@/domain/game/gauntlet-levels";
import { GAUNTLET_LEVEL_ID } from "@/domain/game/gauntlet-level-ids";
import { GAUNTLET_LEVEL_BADGE_CLASS } from "@/features/gauntlet/config/gauntlet-level-style";
import type { GauntletActions } from "@/features/gauntlet/hooks/use-gauntlet-actions";
import { useGauntletDerived } from "@/features/gauntlet/model/gauntlet-derived-context";
import { useGauntletSession } from "@/features/gauntlet/model/gauntlet-session-context";
import { gauntletLevelPath } from "@/features/gauntlet/config/gauntlet-routes";

const LEVEL = GAUNTLET_LEVEL_ID;

export default function GauntletLobby({ actions }: { actions: GauntletActions }) {
  const s = useGauntletSession();
  const d = useGauntletDerived();

  return (
    <>
      <section className="gauntlet-intro px-1 pb-7 pt-[52px] max-sm:pb-5 max-sm:pt-5">
        <p className="eyebrow mb-3 mt-0 text-[11px] font-extrabold tracking-[0.24em] text-city-500 max-sm:text-[10px]">过关斩将 · 全关卡试炼</p>
        <h1 className="mb-3 mt-0 max-w-[850px] font-serif text-page font-bold tracking-[-0.025em] max-sm:text-page-mobile">从轮廓到终极混战，<span className="text-city-500">把中国地理练成直觉</span></h1>
        <p className="lede m-0 max-w-[850px] text-body text-ink-soft max-sm:text-body-mobile">
          共 {GAUNTLET_LEVEL_COUNT} 个关卡，均可直接选择。错题复仇会读取本机历史错题，其余连续答题关卡答错后连胜归零。
        </p>
        <div className="gauntlet-lobby-settings mt-6 flex flex-wrap items-stretch gap-3 max-sm:grid max-sm:grid-cols-2 max-sm:gap-2" aria-label="挑战设置">
          <button
            className={`timed-mode-toggle grid w-[min(360px,100%)] cursor-pointer grid-cols-[auto_1fr] items-center gap-x-3 rounded-[15px] border px-4 py-[13px] text-left transition hover:-translate-y-px hover:border-city-500/45 max-sm:w-full max-sm:grid-cols-[34px_1fr] max-sm:gap-x-2 max-sm:px-2 max-sm:py-2.5 ${d.timedMode ? "border-city-500/35 bg-city-300 text-city-900" : "border-black/20 bg-card/80 text-ink-600"}`}
            type="button"
            role="switch"
            aria-checked={d.timedMode}
            onClick={() => s.setTimeLimit(nextGauntletTimeLimit)}
          >
            <span className={`row-span-2 grid size-[38px] place-items-center rounded-full font-serif text-[17px] font-black text-white max-sm:size-8 ${d.timedMode ? "bg-city-500" : "bg-ink-500"}`} aria-hidden="true">
              {s.timeLimit === GAUNTLET_TIME_LIMITS.UNLIMITED
                ? "∞"
                : s.timeLimit === GAUNTLET_TIME_LIMITS.STANDARD
                  ? "计"
                  : "速"}
            </span>
            <b className="self-end text-xs max-sm:text-[11px]">
              {s.timeLimit === GAUNTLET_TIME_LIMITS.UNLIMITED
                ? "不限时模式"
                : s.timeLimit === GAUNTLET_TIME_LIMITS.STANDARD
                  ? `限时模式 · ${GAUNTLET_TIME_LIMITS.STANDARD} 秒`
                  : `极速模式 · ${GAUNTLET_TIME_LIMITS.FAST} 秒`}
            </b>
            <small className="self-start text-meta text-stone-600 max-sm:hidden">
              {s.timeLimit === GAUNTLET_TIME_LIMITS.UNLIMITED
                ? `点击切换到 ${GAUNTLET_TIME_LIMITS.STANDARD} 秒限时`
                : s.timeLimit === GAUNTLET_TIME_LIMITS.STANDARD
                  ? `点击切换到 ${GAUNTLET_TIME_LIMITS.FAST} 秒极速`
                  : "点击切回不限时模式"}
            </small>
          </button>
          <button
            className="province-picker-button gauntlet-scope-button grid w-[min(480px,100%)] cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 rounded-[15px] border border-jade-500/25 bg-jade-200 px-3.5 py-[11px] text-left text-jade-700 transition hover:-translate-y-px hover:border-jade-500 disabled:cursor-wait disabled:opacity-50 max-sm:w-full max-sm:grid-cols-[34px_1fr] max-sm:px-2 max-sm:py-2.5"
            type="button"
            onClick={actions.openProvincePicker}
            disabled={!s.provinceScopeReady}
          >
            <span className="row-span-2 grid size-[29px] place-items-center rounded-full bg-jade-500 font-serif text-[13px] font-black text-white max-sm:size-8" aria-hidden="true">域</span>
            <b className="col-start-2 self-end truncate text-[11px] max-sm:text-[10px]">
              统一省份范围 · {s.selectedShapeProvinceCodes.size} / {PROVINCES.length}
            </b>
            <i className="col-start-2 self-start truncate text-meta font-bold not-italic text-ink-500 max-sm:hidden">{s.provinceScopeReady ? d.provinceScopeSummary : "正在读取已保存范围…"}</i>
            <em className="col-start-3 row-span-2 row-start-1 self-center text-[10px] font-black not-italic text-jade-700 max-sm:hidden">修改</em>
          </button>
        </div>
        <p
          className={`gauntlet-scope-message mx-0 mb-0 mt-2.5 min-h-[1.5em] text-meta ${s.provinceScopeMessage ? "font-extrabold text-jade-700" : "text-ink-500"}`}
          role="status"
        >
          {s.provinceScopeMessage ||
            "选择一次后，支持自选范围的关卡会自动沿用；全国固定关卡不受影响。"}
        </p>
      </section>
      <section className="gauntlet-level-grid grid grid-cols-4 gap-5 max-[1200px]:grid-cols-2 max-[900px]:grid-cols-1 max-sm:grid-cols-2 max-sm:gap-2" aria-label="选择关卡">
        {GAUNTLET_LEVELS.map((item, index) => {
          const completed = s.completedLevels.has(item.id);
          const scopeIssue = d.provinceScopeIssue(item.id);
          const levelTarget = item.id === LEVEL.PROVINCE_SHAPE
            ? `普通 ${s.selectedShapeProvinceCodes.size} 题＋旋转 ${ROTATED_SILHOUETTE_STREAK_TARGET} 连胜`
            : item.id === LEVEL.REGION_MAP &&
                d.selectedMapRegionItems.length < GAUNTLET_REGION_MAP_MAX_TARGET
              ? `连续答对 ${d.selectedMapRegionItems.length} 题（完整一轮）`
              : item.target;
          const mapUnavailable = MAP_REQUIRED_LEVELS.has(item.id) &&
            (!s.nationalMap || s.nationalError);
          const unavailable = mapUnavailable || Boolean(scopeIssue);
          return (
            <a
              key={item.id}
              className={`gauntlet-level-card relative grid min-h-[360px] content-start overflow-hidden rounded-[22px] border border-black/15 bg-[rgba(251,248,240,.94)] [background-image:radial-gradient(circle_at_100%_0%,rgba(213,169,69,.18),transparent_16rem)] p-6 text-left text-ink no-underline shadow-[0_24px_60px_rgba(57,46,31,.08)] transition after:absolute after:-bottom-[50px] after:-right-11 after:size-[180px] after:rounded-full after:border after:border-city-500/10 max-[900px]:grid-cols-[auto_1fr] max-[900px]:gap-x-6 max-[900px]:min-h-0 max-sm:grid-cols-1 max-sm:gap-1.5 max-sm:min-h-48 max-sm:rounded-[16px_16px_16px_5px] max-sm:p-3 ${unavailable ? "cursor-wait opacity-60" : "cursor-pointer hover:-translate-y-[5px] hover:border-city-500/40 hover:shadow-[0_30px_70px_rgba(57,46,31,.13)]"}`}
              href={gauntletLevelPath(item.id)}
              title={scopeIssue ?? undefined}
            >
              <span className="level-number text-[10px] font-black tracking-[0.18em] text-city-500 max-[900px]:col-start-1 max-sm:col-auto">第 {index + 1} 关</span>
              <i className={`mb-[22px] mt-8 grid size-[74px] -rotate-2 place-items-center rounded-[24px_24px_24px_8px] font-serif text-[19px] font-extrabold not-italic text-gold-100 shadow-[inset_0_0_0_3px_rgba(255,248,231,.2)] max-[900px]:col-start-1 max-[900px]:row-[2/6] max-[900px]:my-2.5 max-sm:col-auto max-sm:row-auto max-sm:my-2 max-sm:size-12 max-sm:rounded-[16px_16px_16px_6px] max-sm:text-base ${GAUNTLET_LEVEL_BADGE_CLASS[item.id]}`}>{item.badge}</i>
              <strong className="font-serif text-card-title max-[900px]:col-start-2 max-[900px]:row-start-1 max-[900px]:self-end max-sm:col-auto max-sm:row-auto max-sm:text-card-title-mobile">{item.title}</strong>
              <p className="my-3 min-h-[66px] text-compact text-ink-soft max-[900px]:col-start-2 max-[900px]:min-h-0 max-sm:hidden">{item.description}</p>
              <b className="text-compact tracking-[0.08em] text-gold-800 max-[900px]:col-start-2 max-sm:col-auto max-sm:text-meta max-sm:tracking-normal">
                {item.id === LEVEL.MISTAKE_REVENGE
                  ? s.mistakes.length
                    ? `当前 ${s.mistakes.length} 道历史错题`
                    : "暂无历史错题"
                  : levelTarget}
              </b>
              <span className={`level-state z-[1] mt-5 self-end justify-self-end text-xs font-black max-[900px]:col-start-2 max-sm:col-auto max-sm:mt-2 max-sm:text-meta ${completed ? "text-jade-700" : "text-city-900"}`}>
                {mapUnavailable
                  ? "地图载入中…"
                  : scopeIssue
                    ? scopeIssue
                    : completed
                      ? "✓ 已过关"
                      : "开始挑战 →"}
              </span>
            </a>
          );
        })}
      </section>
    </>
  );
}
