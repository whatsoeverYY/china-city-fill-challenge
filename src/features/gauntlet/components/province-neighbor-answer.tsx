"use client";

import { PROVINCE_BY_CODE, PROVINCES } from "@/domain/geography/data/provinces";
import type { GauntletActions } from "@/features/gauntlet/hooks/use-gauntlet-actions";
import { useGauntletDerived } from "@/features/gauntlet/model/gauntlet-derived-context";
import { useGauntletSession } from "@/features/gauntlet/model/gauntlet-session-context";

const OPTION_CLASS =
  "min-h-11 cursor-pointer rounded-xl border border-jade-500/25 bg-jade-200 px-2 py-2.5 text-sm font-black text-ink-700 hover:border-jade-500/50";

export default function ProvinceNeighborAnswer({
  actions,
}: {
  actions: GauntletActions;
}) {
  const s = useGauntletSession();
  const d = useGauntletDerived();

  return (
    <>
      <h2 className="mb-6 mt-0 font-serif text-section">选出全部陆地邻省</h2>
      <div className="neighbor-text-options gauntlet-option-grid grid max-h-[min(390px,48vh)] grid-cols-4 content-start gap-2.5 overflow-y-auto p-[3px] max-sm:grid-cols-2">
        {PROVINCES.filter(
          (item) => item.code !== d.currentChallengeProvince?.code,
        ).map((item) => {
          const selected = s.mapSelections.has(item.code);
          return (
            <button
              key={item.code}
              className={`${OPTION_CLASS} ${selected ? "border-jade-700 bg-jade-500 text-white shadow-[inset_0_0_0_2px_rgba(255,255,255,.18)]" : ""}`}
              type="button"
              aria-pressed={selected}
              onClick={() => actions.handleGauntletProvince(item)}
            >
              {item.shortName}
            </button>
          );
        })}
      </div>
      <p className="map-answer-summary mb-1 mt-3.5 min-h-0 text-xs leading-[1.65] text-ink-soft">
        已选 {s.mapSelections.size} 个：
        {Array.from(s.mapSelections)
          .map((code) => PROVINCE_BY_CODE.get(code)?.shortName)
          .filter(Boolean)
          .join("、") || "暂未选择"}
      </p>
      <button
        className="gauntlet-primary-action mt-4 min-h-11 w-full cursor-pointer rounded-[10px] border-0 bg-city-500 px-4 py-3 text-compact font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
        type="button"
        disabled={s.mapSelections.size === 0}
        onClick={actions.submitNeighborSelection}
      >
        确认包围圈
      </button>
    </>
  );
}
