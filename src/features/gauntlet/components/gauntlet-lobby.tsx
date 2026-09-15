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
      <section className="gauntlet-intro">
        <p className="eyebrow">过关斩将 · 全关卡试炼</p>
        <h1>从轮廓到终极混战，<span>把中国地理练成直觉</span></h1>
        <p className="lede">
          共 {GAUNTLET_LEVEL_COUNT} 个关卡，均可直接选择。错题复仇会读取本机历史错题，其余连续答题关卡答错后连胜归零。
        </p>
        <div className="gauntlet-lobby-settings" aria-label="挑战设置">
          <button
            className={`timed-mode-toggle ${d.timedMode ? "is-active" : ""}`}
            type="button"
            role="switch"
            aria-checked={d.timedMode}
            onClick={() => s.setTimeLimit(nextGauntletTimeLimit)}
          >
            <span aria-hidden="true">
              {s.timeLimit === GAUNTLET_TIME_LIMITS.UNLIMITED
                ? "∞"
                : s.timeLimit === GAUNTLET_TIME_LIMITS.STANDARD
                  ? "计"
                  : "速"}
            </span>
            <b>
              {s.timeLimit === GAUNTLET_TIME_LIMITS.UNLIMITED
                ? "不限时模式"
                : s.timeLimit === GAUNTLET_TIME_LIMITS.STANDARD
                  ? `限时模式 · ${GAUNTLET_TIME_LIMITS.STANDARD} 秒`
                  : `极速模式 · ${GAUNTLET_TIME_LIMITS.FAST} 秒`}
            </b>
            <small>
              {s.timeLimit === GAUNTLET_TIME_LIMITS.UNLIMITED
                ? `点击切换到 ${GAUNTLET_TIME_LIMITS.STANDARD} 秒限时`
                : s.timeLimit === GAUNTLET_TIME_LIMITS.STANDARD
                  ? `点击切换到 ${GAUNTLET_TIME_LIMITS.FAST} 秒极速`
                  : "点击切回不限时模式"}
            </small>
          </button>
          <button
            className="province-picker-button gauntlet-scope-button"
            type="button"
            onClick={actions.openProvincePicker}
            disabled={!s.provinceScopeReady}
          >
            <span aria-hidden="true">域</span>
            <b>
              统一省份范围 · {s.selectedShapeProvinceCodes.size} / {PROVINCES.length}
            </b>
            <i>{s.provinceScopeReady ? d.provinceScopeSummary : "正在读取已保存范围…"}</i>
            <em>修改</em>
          </button>
        </div>
        <p
          className={`gauntlet-scope-message ${s.provinceScopeMessage ? "is-visible" : ""}`}
          role="status"
        >
          {s.provinceScopeMessage ||
            "选择一次后，支持自选范围的关卡会自动沿用；全国固定关卡不受影响。"}
        </p>
      </section>
      <section className="gauntlet-level-grid" aria-label="选择关卡">
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
              className="gauntlet-level-card"
              type="button"
              onClick={() => actions.startLevel(item.id)}
              disabled={mapUnavailable || Boolean(scopeIssue)}
              title={scopeIssue ?? undefined}
            >
              <span className="level-number">第 {index + 1} 关</span>
              <i>{item.badge}</i>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
              <b>
                {item.id === LEVEL.MISTAKE_REVENGE
                  ? s.mistakes.length
                    ? `当前 ${s.mistakes.length} 道历史错题`
                    : "暂无历史错题"
                  : levelTarget}
              </b>
              <span className={`level-state ${completed ? "is-complete" : ""}`}>
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
