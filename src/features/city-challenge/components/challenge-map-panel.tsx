import type { Dispatch, SetStateAction } from "react";
import type { Province } from "@/domain/geography/data/provinces";
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
  hoveredName,
  completedNames,
  completedProvinceCodes,
  selectedAnswer,
  wrongRegion,
  outlineFeatures,
  answerCount,
  accuracy,
  message,
  onBack,
  onReset,
  onToggleProvinceVisibility,
  onMapRegion,
  setHoveredName,
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
  hoveredName: string | null;
  completedNames: Set<string>;
  completedProvinceCodes: Set<string>;
  selectedAnswer: string | null;
  wrongRegion: string | null;
  outlineFeatures: MapFeature[];
  answerCount: number;
  accuracy: number;
  message: string;
  onBack: () => void;
  onReset: () => void;
  onToggleProvinceVisibility: (province: Province) => void;
  onMapRegion: (feature: MapFeature, draggedAnswer?: string) => void;
  setHoveredName: Dispatch<SetStateAction<string | null>>;
  setShowAllCityNames: Dispatch<SetStateAction<boolean>>;
  setShowAllProvinceNames: Dispatch<SetStateAction<boolean>>;
}) {
  return (
    <section className="map-card">
      <div className="map-toolbar">
        <div>
          {province ? (
            <button className="back-button" type="button" onClick={onBack}>
              <span aria-hidden="true">←</span> 返回全国地图
            </button>
          ) : (
            <span className="map-step">
              {hardMode
                ? "第一步 · 辨认并解锁省份"
                : neighborMode
                  ? "第一步 · 选择联合区域的起点"
                  : "第一步 · 选择省级行政区"}
            </span>
          )}
        </div>
        <div className="map-status" aria-live="polite">
          <span className={`status-dot ${isChallengeComplete ? "is-complete" : ""}`} />
          {hoveredName && !province && !hardMode
            ? hoveredName
            : hoveredName && completedNames.has(hoveredName)
              ? `已填入：${hoveredName}`
              : message}
        </div>
        {province ? (
          <div className="map-actions">
            <button
              className={`reveal-cities-button ${showAllCityNames ? "is-active" : ""}`}
              type="button"
              aria-pressed={showAllCityNames}
              onClick={() => setShowAllCityNames((value) => !value)}
            >
              {showAllCityNames ? "隐藏全部城市" : "显示全部城市"}
            </button>
            <button className="reset-button" type="button" onClick={onReset}>
              重新挑战
            </button>
          </div>
        ) : (
          <div className="map-overview-actions">
            {!hardMode ? (
              <button
                className={`reveal-cities-button province-label-toggle ${showAllProvinceNames ? "is-active" : ""}`}
                type="button"
                aria-pressed={showAllProvinceNames}
                onClick={() => setShowAllProvinceNames((value) => !value)}
              >
                <span aria-hidden="true">名</span>
                {showAllProvinceNames ? "隐藏省名" : "省名标注"}
              </button>
            ) : null}
            <span className="map-total">
              {neighborMode ? "选择一省 · 联动接壤省份" : "34 个省级行政区"}
            </span>
          </div>
        )}
      </div>

      {province && neighborMode ? (
        <div className="joined-province-strip" aria-label="本轮联合区域">
          <strong>本轮区域 · 点击名称可隐藏</strong>
          {challengeProvinces.map((item, index) => (
            <button
              key={item.code}
              type="button"
              className={`${index === 0 ? "is-origin" : ""} ${hiddenProvinceCodes.has(item.code) ? "is-hidden" : ""}`}
              aria-pressed={!hiddenProvinceCodes.has(item.code)}
              aria-label={`${hiddenProvinceCodes.has(item.code) ? "显示" : "隐藏"}${item.name}`}
              onClick={() => onToggleProvinceVisibility(item)}
            >
              <b className="province-visibility-mark" aria-hidden="true">
                {hiddenProvinceCodes.has(item.code) ? "○" : "●"}
              </b>
              {showAllCityNames ? (
                <b
                  className="province-color-dot"
                  style={{ backgroundColor: provinceFillColors[item.code] }}
                  aria-hidden="true"
                />
              ) : null}
              {item.shortName}{index === 0 ? <i>起点</i> : null}
            </button>
          ))}
        </div>
      ) : null}

      <div className="map-stage">
        <div className="map-corner map-corner--top" aria-hidden="true" />
        <div className="map-corner map-corner--bottom" aria-hidden="true" />
        {mapError ? (
          <div className="map-error" role="alert">
            <strong>地图没有成功展开</strong>
            <p>请刷新页面后重试。</p>
          </div>
        ) : activeMap ? (
          <MapCanvas
            map={activeMap}
            mode={province ? "detail" : "national"}
            completedNames={completedNames}
            completedProvinceCodes={completedProvinceCodes}
            selectedAnswer={selectedAnswer}
            wrongRegion={wrongRegion}
            provinceOutlines={outlineFeatures}
            provinceFillColors={provinceFillColors}
            onRegion={onMapRegion}
            onHover={setHoveredName}
            hideProvinceNames={hardMode}
            showAllLabels={province ? showAllCityNames : showAllProvinceNames}
            joined={neighborMode && Boolean(province)}
            hiddenProvinceCodes={hiddenProvinceCodes}
          />
        ) : (
          <LoadingMap />
        )}
      </div>

      {province ? (
        <div className="round-stats">
          <div><span>已填入</span><strong>{completedNames.size}<i> / {answerCount}</i></strong></div>
          <div><span>正确率</span><strong>{accuracy}<i>%</i></strong></div>
          <div><span>待归位</span><strong>{Math.max(answerCount - completedNames.size, 0)}</strong></div>
        </div>
      ) : null}
    </section>
  );
}
