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
import type { GauntletActions } from "@/features/gauntlet/hooks/use-gauntlet-actions";
import { useGauntletDerived } from "@/features/gauntlet/model/gauntlet-derived-context";
import { useGauntletSession } from "@/features/gauntlet/model/gauntlet-session-context";

const LEVEL = GAUNTLET_LEVEL_ID;

export default function GauntletLobby({ actions }: { actions: GauntletActions }) {
  const s = useGauntletSession();
  const d = useGauntletDerived();

  return (
    <>
      <section className="gauntlet-intro mb-7 rounded-[30px_30px_30px_9px] bg-gradient-to-br from-ink to-[#3b243d] p-[clamp(24px,5vw,58px)] text-white shadow-xl">
        <p className="eyebrow m-0 text-xs font-black tracking-[0.18em] text-brand-gold">过关斩将 · 全关卡试炼</p>
        <h1 className="my-4 max-w-5xl text-[clamp(36px,6vw,72px)] font-black leading-none">从轮廓到终极混战，<span className="text-brand-gold">把中国地理练成直觉</span></h1>
        <p className="lede m-0 max-w-3xl text-[15px] leading-7 text-white/70">
          共 {GAUNTLET_LEVEL_COUNT} 个关卡，均可直接选择。错题复仇会读取本机历史错题，其余连续答题关卡答错后连胜归零。
        </p>
        <div className="gauntlet-lobby-settings mt-7 grid grid-cols-2 gap-3 max-md:grid-cols-1" aria-label="挑战设置">
          <button
            className={`timed-mode-toggle grid cursor-pointer grid-cols-[44px_1fr] items-center gap-x-3 rounded-2xl border p-3 text-left text-white ${d.timedMode ? "is-active border-brand-gold/50 bg-brand-gold/15" : "border-white/20 bg-white/10"}`}
            type="button"
            role="switch"
            aria-checked={d.timedMode}
            onClick={() => s.setTimeLimit(nextGauntletTimeLimit)}
          >
            <span className="row-span-2 grid size-11 place-items-center rounded-full bg-white/10 font-black" aria-hidden="true">
              {s.timeLimit === GAUNTLET_TIME_LIMITS.UNLIMITED
                ? "∞"
                : s.timeLimit === GAUNTLET_TIME_LIMITS.STANDARD
                  ? "计"
                  : "速"}
            </span>
            <b className="text-sm">
              {s.timeLimit === GAUNTLET_TIME_LIMITS.UNLIMITED
                ? "不限时模式"
                : s.timeLimit === GAUNTLET_TIME_LIMITS.STANDARD
                  ? `限时模式 · ${GAUNTLET_TIME_LIMITS.STANDARD} 秒`
                  : `极速模式 · ${GAUNTLET_TIME_LIMITS.FAST} 秒`}
            </b>
            <small className="text-[10px] text-white/60">
              {s.timeLimit === GAUNTLET_TIME_LIMITS.UNLIMITED
                ? `点击切换到 ${GAUNTLET_TIME_LIMITS.STANDARD} 秒限时`
                : s.timeLimit === GAUNTLET_TIME_LIMITS.STANDARD
                  ? `点击切换到 ${GAUNTLET_TIME_LIMITS.FAST} 秒极速`
                  : "点击切回不限时模式"}
            </small>
          </button>
          <button
            className="province-picker-button gauntlet-scope-button grid cursor-pointer grid-cols-[44px_1fr_auto] items-center gap-x-3 rounded-2xl border border-white/20 bg-white/10 p-3 text-left text-white disabled:cursor-wait disabled:opacity-50"
            type="button"
            onClick={actions.openProvincePicker}
            disabled={!s.provinceScopeReady}
          >
            <span className="row-span-2 grid size-11 place-items-center rounded-full bg-brand-red font-black" aria-hidden="true">域</span>
            <b className="text-sm">
              统一省份范围 · {s.selectedShapeProvinceCodes.size} / {PROVINCES.length}
            </b>
            <i className="text-[10px] not-italic text-white/60">{s.provinceScopeReady ? d.provinceScopeSummary : "正在读取已保存范围…"}</i>
            <em className="row-span-2 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black not-italic">修改</em>
          </button>
        </div>
        <p
          className={`gauntlet-scope-message mb-0 mt-3 min-h-5 text-xs ${s.provinceScopeMessage ? "is-visible text-brand-gold" : "text-white/60"}`}
          role="status"
        >
          {s.provinceScopeMessage ||
            "选择一次后，支持自选范围的关卡会自动沿用；全国固定关卡不受影响。"}
        </p>
      </section>
      <section className="gauntlet-level-grid grid grid-cols-4 gap-3 max-xl:grid-cols-3 max-lg:grid-cols-2 max-sm:grid-cols-1" aria-label="选择关卡">
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
          return (
            <button
              key={item.id}
              className="gauntlet-level-card relative grid min-h-60 cursor-pointer grid-rows-[auto_auto_auto_1fr_auto_auto] gap-2 overflow-hidden rounded-[20px_20px_20px_6px] border border-black/10 bg-card p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              onClick={() => actions.startLevel(item.id)}
              disabled={mapUnavailable || Boolean(scopeIssue)}
              title={scopeIssue ?? undefined}
            >
              <span className="level-number text-[10px] font-black tracking-widest text-brand-red">第 {index + 1} 关</span>
              <i className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-red to-[#72558a] text-xl not-italic text-white">{item.badge}</i>
              <strong className="text-xl">{item.title}</strong>
              <p className="m-0 text-xs leading-5 text-ink-soft">{item.description}</p>
              <b className="text-[10px] text-brand-green-dark">
                {item.id === LEVEL.MISTAKE_REVENGE
                  ? s.mistakes.length
                    ? `当前 ${s.mistakes.length} 道历史错题`
                    : "暂无历史错题"
                  : levelTarget}
              </b>
              <span className={`level-state text-xs font-black ${completed ? "is-complete text-brand-green" : "text-brand-red"}`}>
                {mapUnavailable
                  ? "地图载入中…"
                  : scopeIssue
                    ? scopeIssue
                    : completed
                      ? "✓ 已过关"
                      : "开始挑战 →"}
              </span>
            </button>
          );
        })}
      </section>
    </>
  );
}
