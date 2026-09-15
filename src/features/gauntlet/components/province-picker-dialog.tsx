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
    <div className="province-picker-overlay" role="presentation">
      <section
        className="province-picker-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="province-picker-title"
      >
        <button
          className="province-picker-close"
          type="button"
          aria-label="关闭省份选择"
          onClick={() => s.setProvincePickerOpen(false)}
        >
          ×
        </button>
        <p className="eyebrow">过关斩将 · 全局设置</p>
        <h2 id="province-picker-title">统一选择省份范围（可多选）</h2>
        <p className="province-picker-hint">
          保存后，辨轮廓、城市、车牌、大学与地图落点等关卡都会自动使用这套范围，下次进入无需重选。邻省连锁、疆域集合、错题复仇、易混城市和终极混战仍使用各自的全国固定题库。
        </p>
        <div className="province-picker-tools">
          <button type="button" onClick={actions.selectAllPickerProvinces}>全选</button>
          <button type="button" onClick={actions.clearPickerProvinces}>清空</button>
          <span>
            已选 {s.draftShapeProvinceCodes.size} / {d.provincePickerOptions.length}
          </span>
        </div>
        <div className="province-picker-grid">
          {d.provincePickerOptions.map((item) => {
            const selected = s.draftShapeProvinceCodes.has(item.key);
            return (
              <button
                key={item.key}
                className={selected ? "is-selected" : ""}
                type="button"
                aria-pressed={selected}
                onClick={() => actions.toggleDraftProvince(item.key)}
              >
                <span>{selected ? "✓" : ""}</span>
                <strong>{item.shortName}</strong>
                <small>
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
        <div className="province-picker-footer">
          <p>
            {s.draftShapeProvinceCodes.size === 0
              ? "请至少选择一个省份"
              : s.identity
                ? "保存后会写入当前玩家存档并同步到云端"
                : "试玩状态仅本次有效，登录后可长期保存"}
          </p>
          <button
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
