"use client";

import { PROVINCE_BY_CODE, PROVINCES } from "@/domain/geography/data/provinces";
import type { GauntletActions } from "@/features/gauntlet/hooks/use-gauntlet-actions";
import { useGauntletDerived } from "@/features/gauntlet/model/gauntlet-derived-context";
import { useGauntletSession } from "@/features/gauntlet/model/gauntlet-session-context";

const OPTION_CLASS =
  "min-h-12 cursor-pointer rounded-xl border border-black/15 bg-white px-3 text-sm font-bold hover:border-brand-red/40";

export default function ProvinceNeighborAnswer({
  actions,
}: {
  actions: GauntletActions;
}) {
  const s = useGauntletSession();
  const d = useGauntletDerived();

  return (
    <>
      <h2 className="mb-4 mt-0 text-2xl font-black">选出全部陆地邻省</h2>
      <div className="neighbor-text-options gauntlet-option-grid grid grid-cols-2 gap-2 max-sm:grid-cols-1">
        {PROVINCES.filter(
          (item) => item.code !== d.currentChallengeProvince?.code,
        ).map((item) => {
          const selected = s.mapSelections.has(item.code);
          return (
            <button
              key={item.code}
              className={`${OPTION_CLASS} ${selected ? "border-brand-red bg-brand-red/10" : ""}`}
              type="button"
              aria-pressed={selected}
              onClick={() => actions.handleGauntletProvince(item)}
            >
              {item.shortName}
            </button>
          );
        })}
      </div>
      <p className="map-answer-summary rounded-xl bg-paper p-3 text-xs leading-5 text-ink-soft">
        已选 {s.mapSelections.size} 个：
        {Array.from(s.mapSelections)
          .map((code) => PROVINCE_BY_CODE.get(code)?.shortName)
          .filter(Boolean)
          .join("、") || "暂未选择"}
      </p>
      <button
        className="gauntlet-primary-action min-h-12 cursor-pointer rounded-xl border-0 bg-brand-red px-4 font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
        type="button"
        disabled={s.mapSelections.size === 0}
        onClick={actions.submitNeighborSelection}
      >
        确认包围圈
      </button>
    </>
  );
}
