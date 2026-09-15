"use client";

import type { GauntletActions } from "@/features/gauntlet/hooks/use-gauntlet-actions";
import { useGauntletDerived } from "@/features/gauntlet/model/gauntlet-derived-context";
import { useGauntletSession } from "@/features/gauntlet/model/gauntlet-session-context";

export default function ProvincePickerDialog({
  actions,
}: {
  actions: GauntletActions;
}) {
  const s = useGauntletSession();
  const d = useGauntletDerived();
  if (!s.provincePickerOpen) return null;

  return (
    <div className="province-picker-overlay fixed inset-0 z-[1600] grid place-items-center bg-black/55 p-5 backdrop-blur-md" role="presentation">
      <section
        className="province-picker-dialog relative max-h-[calc(100dvh_-_40px)] w-full max-w-3xl overflow-auto rounded-[24px_24px_24px_7px] bg-card p-7 shadow-2xl max-sm:p-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="province-picker-title"
      >
        <button
          className="province-picker-close absolute right-4 top-4 grid size-9 cursor-pointer place-items-center rounded-full border-0 bg-black/5 text-xl"
          type="button"
          aria-label="关闭省份选择"
          onClick={() => s.setProvincePickerOpen(false)}
        >
          ×
        </button>
        <p className="eyebrow m-0 text-xs font-black tracking-[0.18em] text-brand-red">过关斩将 · 全局设置</p>
        <h2 className="mb-2 mt-0 text-3xl font-black" id="province-picker-title">统一选择省份范围（可多选）</h2>
        <p className="province-picker-hint text-xs leading-5 text-ink-soft">
          保存后，辨轮廓、城市、车牌、大学与地图落点等关卡都会自动使用这套范围，下次进入无需重选。邻省连锁、疆域集合、错题复仇、易混城市和终极混战仍使用各自的全国固定题库。
        </p>
        <div className="province-picker-tools my-4 flex items-center gap-2">
          <button className="cursor-pointer rounded-full border border-black/15 bg-white px-3 py-2 text-[10px] font-black" type="button" onClick={actions.selectAllPickerProvinces}>全选</button>
          <button className="cursor-pointer rounded-full border border-black/15 bg-white px-3 py-2 text-[10px] font-black" type="button" onClick={actions.clearPickerProvinces}>清空</button>
          <span className="ml-auto text-xs font-black">
            已选 {s.draftShapeProvinceCodes.size} / {d.provincePickerOptions.length}
          </span>
        </div>
        <div className="province-picker-grid grid grid-cols-4 gap-2 max-md:grid-cols-3 max-sm:grid-cols-2">
          {d.provincePickerOptions.map((item) => {
            const selected = s.draftShapeProvinceCodes.has(item.key);
            return (
              <button
                key={item.key}
                className={`grid cursor-pointer grid-cols-[auto_1fr] items-center gap-2 rounded-xl border p-3 text-left ${selected ? "is-selected border-brand-green bg-brand-green/10" : "border-black/10 bg-white"}`}
                type="button"
                aria-pressed={selected}
                onClick={() => actions.toggleDraftProvince(item.key)}
              >
                <span className={`grid size-6 place-items-center rounded-full ${selected ? "bg-brand-green text-white" : "bg-black/10"}`}>{selected ? "✓" : ""}</span>
                <strong className="text-sm">{item.shortName}</strong>
                <small className="col-start-2 text-[9px] text-ink-soft">
                  {item.cityCount > 0
                    ? item.cityCount === item.plateCount &&
                        item.cityCount === item.mapRegionCount
                      ? `${item.cityCount} 个城市题`
                      : `${item.cityCount} 城 · ${item.plateCount} 车牌 · ${item.mapRegionCount} 区块`
                    : `${item.kind} · ${item.mapRegionCount} 区块`}
                </small>
              </button>
            );
          })}
        </div>
        <div className="province-picker-footer mt-5 flex items-center justify-between gap-4 max-sm:flex-col">
          <p className="m-0 text-xs text-ink-soft">
            {s.draftShapeProvinceCodes.size === 0
              ? "请至少选择一个省份"
              : s.identity
                ? "保存后会写入当前玩家存档并同步到云端"
                : "试玩状态仅本次有效，登录后可长期保存"}
          </p>
          <button
            className="min-h-11 cursor-pointer rounded-full border-0 bg-brand-green px-5 font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            disabled={!d.draftSelectionValid}
            onClick={actions.applyProvinceSelection}
          >
            保存范围
          </button>
        </div>
      </section>
    </div>
  );
}
