import type { Dispatch, SetStateAction } from "react";
import { PROVINCES, type Province } from "@/domain/geography/data/provinces";
import LoadingMap from "@/features/map/components/loading-map";
import MapCanvas from "@/features/map/components/map-canvas";
import type { MapData, MapFeature } from "@/features/map/model/map-data";

export default function ChallengeMapPanel({
  province,
  neighborMode,
  hardMode,
  challengeProvinces,
  hiddenProvinceCodes,
  provinceFillColors,
  showAllCityNames,
  showAllProvinceNames,
  mapError,
  activeMap,
  isChallengeComplete,
  hoveredFeature,
  completedRegionIds,
  completedProvinceCodes,
  wrongRegionId,
  outlineFeatures,
  answerCount,
  accuracy,
  message,
  onBack,
  onReset,
  onToggleProvinceVisibility,
  onMapRegion,
  setHoveredFeature,
  setShowAllCityNames,
  setShowAllProvinceNames,
}: {
  province: Province | null;
  neighborMode: boolean;
  hardMode: boolean;
  challengeProvinces: Province[];
  hiddenProvinceCodes: Set<string>;
  provinceFillColors: Record<string, string>;
  showAllCityNames: boolean;
  showAllProvinceNames: boolean;
  mapError: boolean;
  activeMap: MapData | null;
  isChallengeComplete: boolean;
  hoveredFeature: MapFeature | null;
  completedRegionIds: Set<string>;
  completedProvinceCodes: Set<string>;
  wrongRegionId: string | null;
  outlineFeatures: MapFeature[];
  answerCount: number;
  accuracy: number;
  message: string;
  onBack: () => void;
  onReset: () => void;
  onToggleProvinceVisibility: (province: Province) => void;
  onMapRegion: (feature: MapFeature, draggedAnswer?: string) => void;
  setHoveredFeature: Dispatch<SetStateAction<MapFeature | null>>;
  setShowAllCityNames: Dispatch<SetStateAction<boolean>>;
  setShowAllProvinceNames: Dispatch<SetStateAction<boolean>>;
}) {
  return (
    <section className="map-card min-w-0 overflow-hidden rounded-3xl border border-black/10 bg-card shadow-[0_20px_60px_rgba(43,48,43,0.1)]">
      <div className="map-toolbar flex min-h-16 items-center justify-between gap-3 border-b border-black/10 px-5 py-3 max-md:flex-wrap max-md:px-3">
        <div>
          {province ? (
            <button className="back-button inline-flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0 text-sm font-black text-ink" type="button" onClick={onBack}>
              <span aria-hidden="true">←</span> 返回全国地图
            </button>
          ) : (
            <span className="map-step text-xs font-black uppercase tracking-[0.12em] text-brand-red">
              {hardMode
                ? "第一步 · 辨认并解锁省份"
                : neighborMode
                  ? "第一步 · 选择联合区域的起点"
                  : "第一步 · 选择省级行政区"}
            </span>
          )}
        </div>
        <div className="map-status flex min-w-0 flex-1 items-center justify-center gap-2 text-center text-sm font-bold text-ink-soft max-md:order-3 max-md:w-full" aria-live="polite">
          <span className={`status-dot size-2 shrink-0 rounded-full ${isChallengeComplete ? "bg-brand-green" : "bg-brand-gold"}`} />
          {hoveredFeature && !province && !hardMode
            ? hoveredFeature.properties.name
            : hoveredFeature && completedRegionIds.has(String(hoveredFeature.properties.adcode))
              ? `已填入：${hoveredFeature.properties.name}`
              : message}
        </div>
        {province ? (
          <div className="map-actions flex items-center gap-2">
            <button
              className={`reveal-cities-button cursor-pointer rounded-full border border-black/10 px-3 py-2 text-xs font-black ${showAllCityNames ? "bg-brand-green text-white" : "bg-white/60"}`}
              type="button"
              aria-pressed={showAllCityNames}
              onClick={() => setShowAllCityNames((value) => !value)}
            >
              {showAllCityNames ? "隐藏全部城市" : "显示全部城市"}
            </button>
            <button className="reset-button cursor-pointer border-0 bg-transparent px-2 py-2 text-xs font-black text-brand-red" type="button" onClick={onReset}>
              重新挑战
            </button>
          </div>
        ) : (
          <div className="map-overview-actions flex items-center gap-3">
            {!hardMode ? (
              <button
                className={`reveal-cities-button province-label-toggle cursor-pointer rounded-full border border-black/10 px-3 py-2 text-xs font-black ${showAllProvinceNames ? "bg-brand-green text-white" : "bg-white/60"}`}
                type="button"
                aria-pressed={showAllProvinceNames}
                onClick={() => setShowAllProvinceNames((value) => !value)}
              >
                <span aria-hidden="true">名</span>
                {showAllProvinceNames ? "隐藏省名" : "省名标注"}
              </button>
            ) : null}
            <span className="map-total text-xs font-bold text-ink-soft">
              {neighborMode ? "选择一省 · 联动接壤省份" : `${PROVINCES.length} 个省级行政区`}
            </span>
          </div>
        )}
      </div>

      {province && neighborMode ? (
        <div className="joined-province-strip flex flex-wrap items-center gap-2 border-b border-black/10 bg-paper-deep/55 px-4 py-3" aria-label="本轮联合区域">
          <strong className="mr-1 text-xs text-ink-soft">本轮区域 · 点击名称可隐藏</strong>
          {challengeProvinces.map((item, index) => (
            <button
              key={item.code}
              type="button"
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border bg-white/70 px-2.5 py-1.5 text-xs font-bold ${index === 0 ? "border-brand-red/30 text-brand-red" : "border-black/10"} ${hiddenProvinceCodes.has(item.code) ? "opacity-45" : ""}`}
              aria-pressed={!hiddenProvinceCodes.has(item.code)}
              aria-label={`${hiddenProvinceCodes.has(item.code) ? "显示" : "隐藏"}${item.name}`}
              onClick={() => onToggleProvinceVisibility(item)}
            >
              <b className="province-visibility-mark text-[9px] text-brand-green-dark" aria-hidden="true">
                {hiddenProvinceCodes.has(item.code) ? "○" : "●"}
              </b>
              {showAllCityNames ? (
                <b
                  className="province-color-dot size-2.5 shrink-0 rounded-full border border-white/80 shadow-[0_0_0_1px_rgba(32,37,34,0.16)]"
                  style={{ backgroundColor: provinceFillColors[item.code] }}
                  aria-hidden="true"
                />
              ) : null}
              {item.shortName}{index === 0 ? <i className="ml-1 rounded-full bg-brand-red/10 px-1.5 text-[9px] not-italic">起点</i> : null}
            </button>
          ))}
        </div>
      ) : null}

      <div className="map-stage relative grid min-h-[520px] place-items-center overflow-hidden bg-[#f7f1e5] max-md:min-h-[56vh]">
        {mapError ? (
          <div className="map-error grid place-items-center gap-2 p-10 text-center" role="alert">
            <strong className="text-lg">地图没有成功展开</strong>
            <p className="m-0 text-sm text-ink-soft">请刷新页面后重试。</p>
          </div>
        ) : activeMap ? (
          <MapCanvas
            map={activeMap}
            mode={province ? "detail" : "national"}
            completedRegionIds={completedRegionIds}
            completedProvinceCodes={completedProvinceCodes}
            wrongRegionId={wrongRegionId}
            provinceOutlines={outlineFeatures}
            provinceFillColors={provinceFillColors}
            onRegion={onMapRegion}
            onHover={setHoveredFeature}
            hideProvinceNames={hardMode}
            showAllLabels={province ? showAllCityNames : showAllProvinceNames}
            joined={neighborMode && Boolean(province)}
            hardMode={hardMode}
            hiddenProvinceCodes={hiddenProvinceCodes}
          />
        ) : (
          <LoadingMap />
        )}
      </div>

      {province ? (
        <div className="round-stats grid grid-cols-3 border-t border-black/10 bg-paper-deep/35 text-center">
          <div className="px-4 py-3"><span className="block text-[10px] font-black uppercase tracking-[0.12em] text-ink-soft">已填入</span><strong className="text-xl">{completedRegionIds.size}<i className="text-xs not-italic text-ink-soft"> / {answerCount}</i></strong></div>
          <div className="border-l border-black/10 px-4 py-3"><span className="block text-[10px] font-black uppercase tracking-[0.12em] text-ink-soft">正确率</span><strong className="text-xl">{accuracy}<i className="text-xs not-italic text-ink-soft">%</i></strong></div>
          <div className="border-l border-black/10 px-4 py-3"><span className="block text-[10px] font-black uppercase tracking-[0.12em] text-ink-soft">待归位</span><strong className="text-xl">{Math.max(answerCount - completedRegionIds.size, 0)}</strong></div>
        </div>
      ) : null}
    </section>
  );
}
