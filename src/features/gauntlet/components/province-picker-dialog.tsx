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
    <div className="province-picker-overlay fixed inset-0 z-[1600] grid place-items-center bg-[rgba(24,31,27,.5)] p-6 backdrop-blur-[7px] max-sm:p-3" role="presentation">
      <section
        className="province-picker-dialog relative max-h-[min(760px,calc(100dvh-48px))] w-[min(860px,100%)] overflow-auto rounded-[22px] border border-jade-500/25 bg-card [background-image:radial-gradient(circle_at_100%_0%,rgba(45,125,95,.11),transparent_22rem)] p-[34px] shadow-[0_30px_90px_rgba(23,29,25,.32)] max-sm:max-h-[calc(100dvh-24px)] max-sm:p-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="province-picker-title"
      >
        <button
          className="province-picker-close absolute right-4 top-4 grid size-[34px] cursor-pointer place-items-center rounded-full border border-stone-300 bg-paper-100 p-0 text-[21px] text-stone-700"
          type="button"
          aria-label="关闭省份选择"
          onClick={() => s.setProvincePickerOpen(false)}
        >
          ×
        </button>
        <p className="eyebrow m-0 text-xs font-black tracking-[0.18em] text-city-500">过关斩将 · 全局设置</p>
        <h2 className="mb-[9px] mt-0 font-serif text-3xl" id="province-picker-title">统一选择省份范围（可多选）</h2>
        <p className="province-picker-hint mb-[22px] text-xs leading-[1.7] text-ink-soft">
          保存后，辨轮廓、城市、车牌、大学与地图落点等关卡都会自动使用这套范围，下次进入无需重选。邻省连锁、疆域集合、错题复仇、易混城市和终极混战仍使用各自的全国固定题库。
        </p>
        <div className="province-picker-tools mb-[13px] flex items-center gap-2">
          <button className="cursor-pointer rounded-full border border-jade-500/25 bg-jade-200 px-[11px] py-1.5 text-[10px] font-extrabold text-jade-700" type="button" onClick={actions.selectAllPickerProvinces}>全选</button>
          <button className="cursor-pointer rounded-full border border-jade-500/25 bg-jade-200 px-[11px] py-1.5 text-[10px] font-extrabold text-jade-700" type="button" onClick={actions.clearPickerProvinces}>清空</button>
          <span className="ml-auto text-[10px] font-extrabold tracking-[.06em] text-ink-500">
            已选 {s.draftShapeProvinceCodes.size} / {d.provincePickerOptions.length}
          </span>
        </div>
        <div className="province-picker-grid grid max-h-[390px] grid-cols-5 gap-2 overflow-y-auto p-0.5 max-md:grid-cols-3 max-sm:grid-cols-2">
          {d.provincePickerOptions.map((item) => {
            const selected = s.draftShapeProvinceCodes.has(item.key);
            return (
              <button
                key={item.key}
                className={`grid min-h-[58px] cursor-pointer grid-cols-[20px_1fr] items-center gap-2 rounded-[10px] border px-[9px] py-2 text-left ${selected ? "border-jade-500 bg-jade-300" : "border-stone-300 bg-paper-100/80"}`}
                type="button"
                aria-pressed={selected}
                onClick={() => actions.toggleDraftProvince(item.key)}
              >
                <span className={`grid size-5 place-items-center rounded-full ${selected ? "bg-jade-500 text-white" : "border border-stone-400 bg-white"}`}>{selected ? "✓" : ""}</span>
                <strong className="text-xs">{item.shortName}</strong>
                <small className="col-start-2 text-[8px] leading-[1.45] text-ink-soft">
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
        <div className="province-picker-footer mt-5 flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-stretch">
          <p className="m-0 text-[10px] text-ink-soft">
            {s.draftShapeProvinceCodes.size === 0
              ? "请至少选择一个省份"
              : s.identity
                ? "保存后会写入当前玩家存档并同步到云端"
                : "试玩状态仅本次有效，登录后可长期保存"}
          </p>
          <button
            className="min-h-11 cursor-pointer rounded-full border-0 bg-jade-500 px-5 text-[11px] font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
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
