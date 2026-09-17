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
    <section className="map-card min-w-0 overflow-hidden rounded-[22px] border border-black/15 bg-card/90 shadow-[0_30px_70px_rgba(57,46,31,.1)] max-sm:rounded-[14px]">
      <div className="map-toolbar grid min-h-[62px] grid-cols-[1fr_minmax(280px,1.4fr)_1fr] items-center border-b border-black/[.13] bg-paper-100/70 px-[23px] max-md:grid-cols-[1fr_auto] max-md:px-[15px]">
        <div>
          {province ? (
            <button className="back-button inline-flex min-h-11 cursor-pointer items-center gap-[5px] border-0 bg-transparent p-0 text-xs font-bold text-city-900" type="button" onClick={onBack}>
              <span aria-hidden="true">←</span> 返回全国地图
            </button>
          ) : (
            <span className="map-step text-[11px] font-bold uppercase tracking-[0.12em] text-ink-500">
              {hardMode
                ? "第一步 · 辨认并解锁省份"
                : neighborMode
                  ? "第一步 · 选择联合区域的起点"
                  : "第一步 · 选择省级行政区"}
            </span>
          )}
        </div>
        <div className="map-status flex min-w-0 items-center justify-center gap-2 text-center text-xs text-ink-600 max-md:col-span-2 max-md:row-start-2 max-md:min-h-9 max-md:border-t max-md:border-black/[.13]" aria-live="polite">
          <span className={`status-dot size-[7px] shrink-0 rounded-full ${isChallengeComplete ? "bg-jade-500 shadow-[0_0_0_4px_rgba(45,125,95,.14)]" : "bg-gold-500 shadow-[0_0_0_4px_rgba(213,169,69,.15)]"}`} />
          {hoveredFeature && !province && !hardMode
            ? hoveredFeature.properties.name
            : hoveredFeature && completedRegionIds.has(String(hoveredFeature.properties.adcode))
              ? `已填入：${hoveredFeature.properties.name}`
              : message}
        </div>
        {province ? (
          <div className="map-actions flex items-center justify-self-end gap-3 max-md:gap-[7px]">
            <button
              className={`reveal-cities-button min-h-8 cursor-pointer whitespace-nowrap rounded-full border px-2.5 py-1.5 text-compact font-extrabold max-md:min-h-11 ${showAllCityNames ? "border-jade-700 bg-jade-700 text-white" : "border-jade-500/30 bg-jade-100 text-jade-700"}`}
              type="button"
              aria-pressed={showAllCityNames}
              onClick={() => setShowAllCityNames((value) => !value)}
            >
              {showAllCityNames ? "隐藏全部城市" : "显示全部城市"}
            </button>
            <button className="reset-button min-h-11 cursor-pointer border-0 bg-transparent p-0 text-[11px] text-ink-500 underline decoration-stone-400 underline-offset-4" type="button" onClick={onReset}>
              重新挑战
            </button>
          </div>
        ) : (
          <div className="map-overview-actions flex items-center justify-self-end gap-3 max-md:gap-[7px]">
            {!hardMode ? (
              <button
                className={`reveal-cities-button province-label-toggle inline-flex min-h-8 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1.5 text-compact font-extrabold max-md:min-h-11 ${showAllProvinceNames ? "border-jade-700 bg-jade-700 text-white" : "border-jade-500/30 bg-jade-100 text-jade-700"}`}
                type="button"
                aria-pressed={showAllProvinceNames}
                onClick={() => setShowAllProvinceNames((value) => !value)}
              >
                <span className={`grid size-[18px] place-items-center rounded-full font-serif text-meta ${showAllProvinceNames ? "bg-white text-jade-700" : "bg-jade-500 text-white"}`} aria-hidden="true">名</span>
                {showAllProvinceNames ? "隐藏省名" : "省名标注"}
              </button>
            ) : null}
            <span className="map-total text-[11px] font-bold tracking-[0.12em] text-ink-500 max-sm:hidden">
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
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border bg-white/70 px-2.5 py-1.5 text-xs font-bold ${index === 0 ? "border-city-500/30 text-city-500" : "border-black/10"} ${hiddenProvinceCodes.has(item.code) ? "opacity-45" : ""}`}
              aria-pressed={!hiddenProvinceCodes.has(item.code)}
              aria-label={`${hiddenProvinceCodes.has(item.code) ? "显示" : "隐藏"}${item.name}`}
              onClick={() => onToggleProvinceVisibility(item)}
            >
              <b className="province-visibility-mark text-meta text-jade-700" aria-hidden="true">
                {hiddenProvinceCodes.has(item.code) ? "○" : "●"}
              </b>
              {showAllCityNames ? (
                <b
                  className="province-color-dot size-2.5 shrink-0 rounded-full border border-white/80 shadow-[0_0_0_1px_rgba(32,37,34,0.16)]"
                  style={{ backgroundColor: provinceFillColors[item.code] }}
                  aria-hidden="true"
                />
              ) : null}
              {item.shortName}{index === 0 ? <i className="ml-1 rounded-full bg-city-500/10 px-1.5 text-meta not-italic">起点</i> : null}
            </button>
          ))}
        </div>
      ) : null}

      <div className="map-stage relative grid min-h-[clamp(390px,58vw,720px)] place-items-center overflow-hidden bg-stone-100 [background-image:radial-gradient(circle_at_50%_50%,rgba(255,255,255,.95),transparent_58%),linear-gradient(135deg,rgba(212,199,170,.2),transparent_40%)] before:pointer-events-none before:absolute before:-left-[14%] before:-top-[40%] before:aspect-square before:w-[66%] before:rounded-full before:border before:border-clay-700/10 after:pointer-events-none after:absolute after:-bottom-[47%] after:-right-[8%] after:aspect-square after:w-[58%] after:rounded-full after:border after:border-clay-700/10 max-[1050px]:min-h-[500px] max-md:min-h-[390px] max-sm:min-h-[330px]">
        <div className="map-corner map-corner--top pointer-events-none absolute left-[19px] top-[19px] z-[2] size-[66px] border-l border-t border-city-500/35" aria-hidden="true" />
        <div className="map-corner map-corner--bottom pointer-events-none absolute bottom-[19px] right-[19px] z-[2] size-[66px] border-b border-r border-city-500/35" aria-hidden="true" />
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
