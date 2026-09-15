"use client";

import { PROVINCE_BY_CODE, PROVINCES } from "@/domain/geography/data/provinces";
import AnswerReviewPanel from "@/features/gauntlet/components/answer-review-panel";
import GauntletAnswerForm from "@/features/gauntlet/components/gauntlet-answer-form";
import { STREAK_NOTE_LEVELS } from "@/features/gauntlet/config/gauntlet-config";
import { GAUNTLET_LEVEL_ID } from "@/domain/game/gauntlet-level-ids";
import type { GauntletActions } from "@/features/gauntlet/hooks/use-gauntlet-actions";
import { CITY_MAP_RECENT_QUESTION_LIMIT } from "@/domain/game/gauntlet-rules";
import { useGauntletDerived } from "@/features/gauntlet/model/gauntlet-derived-context";
import { useGauntletSession } from "@/features/gauntlet/model/gauntlet-session-context";
import { stripAdministrativeSuffix } from "@/shared/lib/place-name";

const LEVEL = GAUNTLET_LEVEL_ID;

export default function GauntletAnswerPanel({
  actions,
}: {
  actions: GauntletActions;
}) {
  const s = useGauntletSession();
  const d = useGauntletDerived();
  if (!s.level) return null;

  const answerContent = (() => {
    if (s.answerReview) {
      return (
        <AnswerReviewPanel
          review={s.answerReview}
          onContinue={actions.continueAfterReview}
        />
      );
    }
    if (s.level === LEVEL.PROVINCE_PUZZLE) {
      return (
        <>
          <h2>放回正确的省份位置</h2>
          <p className="map-answer-summary">
            把左侧上方的轮廓拖到地图；手机端或键盘操作可以直接点击目标省份。
          </p>
          <div
            className="puzzle-progress-dots"
            aria-label={`已完成 ${s.mapSelections.size} 块拼图`}
          >
            {Array.from({ length: d.target }, (_, index) => (
              <i key={index} className={index < s.mapSelections.size ? "is-done" : ""} />
            ))}
          </div>
        </>
      );
    }
    if (s.level === LEVEL.CITY_UNDERCOVER) {
      return (
        <>
          <h2>哪座城市不属于同一省？</h2>
          <div className="gauntlet-option-grid">
            {d.currentUndercoverQuestion?.options.map((item) => (
              <button
                key={item.city}
                type="button"
                onClick={() => actions.answerOptionQuestion(item.city)}
              >
                {item.city}
              </button>
            ))}
          </div>
        </>
      );
    }
    if (s.level === LEVEL.REGION_MAP) {
      return (
        <>
          <h2>在左侧省内地图落点</h2>
          <p className="map-answer-summary">
            地图不显示名称；市、自治州、地区、盟、区县等区块都会出题，点击后立即判题。
          </p>
          <p className="map-answer-summary">
            当前范围共 {d.mapRegionPoolSize} 个地图区块，本轮需连续答对 {d.target} 题。系统会优先避开最近 {CITY_MAP_RECENT_QUESTION_LIMIT} 道题；答错后会重新打散下一轮。
          </p>
        </>
      );
    }
    if (s.level === LEVEL.TERRITORY_GROUPS) {
      return (
        <>
          <h2>选出完整的省份集合</h2>
          <p className="map-answer-summary">
            已选 {s.mapSelections.size} 个省级行政区。可以再次点击取消。
          </p>
          <button
            className="gauntlet-primary-action"
            type="button"
            disabled={s.mapSelections.size === 0}
            onClick={actions.submitProvinceGroup}
          >
            确认选择
          </button>
        </>
      );
    }
    if (s.level === LEVEL.PROVINCE_SHORTEST_ROUTE) {
      return (
        <>
          <h2>沿陆地邻省走到终点</h2>
          <p className="map-answer-summary">
            路线不能重复省份。抵达终点后，系统会检查是否为最短路径。
          </p>
          <ol className="province-route" aria-label="当前最短路线尝试">
            {s.routeCodes.map((code, index) => (
              <li key={code}>
                <span>{index + 1}</span>
                {PROVINCE_BY_CODE.get(code)?.shortName}
              </li>
            ))}
          </ol>
        </>
      );
    }
    if (s.level === LEVEL.GEOGRAPHY_ELIMINATION) {
      return (
        <>
          <h2>{d.currentDualIntruderQuestion?.instruction}</h2>
          <div className="gauntlet-option-grid">
            {d.currentDualIntruderQuestion?.options.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => actions.answerOptionQuestion(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </>
      );
    }
    if (s.level === LEVEL.PLATE_FAULT) {
      return (
        <>
          <h2>点击对应错误的一组</h2>
          <div className="gauntlet-option-grid plate-fault-options">
            {d.currentPlateFaultQuestion?.options.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => actions.answerOptionQuestion(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      );
    }
    if (s.level === LEVEL.UNIVERSITY_CITY) {
      return (
        <>
          <h2>写出这所大学所在的城市</h2>
          <GauntletAnswerForm
            actions={actions}
            id="gauntlet-university-city-answer"
            label="城市名称"
            placeholder="例如：南京市"
          />
        </>
      );
    }
    if (s.level === LEVEL.MISTAKE_REVENGE) {
      return d.currentMistake ? (
        <>
          <h2>重新提交这道历史错题</h2>
          <GauntletAnswerForm
            actions={actions}
            id="gauntlet-mistake-answer"
            label="答案"
            placeholder="输入省份、城市、车牌或判断结果"
          />
        </>
      ) : (
        <>
          <h2>错题库已经是空的</h2>
          <p className="map-answer-summary">
            返回选关继续挑战；之后出现的新错题会自动加入本关。
          </p>
          <button
            type="button"
            className="gauntlet-primary-action"
            onClick={actions.returnToLevels}
          >
            返回选关
          </button>
        </>
      );
    }
    if (s.level === LEVEL.CONFUSABLE_CITIES) {
      return (
        <>
          <h2>选择正确答案</h2>
          <div className="gauntlet-option-grid confusable-options">
            {d.currentConfusableQuestion?.options.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => actions.answerOptionQuestion(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </>
      );
    }
    if (s.level === LEVEL.CITY_SHORTEST_ROUTE) {
      return (
        <>
          <h2>依次点击接壤的市级区块</h2>
          <p className="map-answer-summary">
            地图显示市级名称；路线不能重复，抵达终点后会检查是否为最短路径。
          </p>
          <ol className="province-route city-route-list" aria-label="当前省内路线">
            {d.cityRouteNames.map((name, index) => (
              <li key={name}>
                <span>{index + 1}</span>
                {stripAdministrativeSuffix(name)}
              </li>
            ))}
          </ol>
        </>
      );
    }
    if (s.level === LEVEL.PROVINCE_CITY_COUNT) {
      return (
        <>
          <h2>这里有多少座地级及以上城市？</h2>
          <GauntletAnswerForm
            actions={actions}
            id="gauntlet-city-count-answer"
            label="城市数量"
            placeholder="例如：13"
            inputMode="numeric"
            pattern="[0-9]*"
          />
          <p className="map-answer-summary">
            只需填写数字；自治州、地区、盟和省直辖县级市不计入城市数。
          </p>
        </>
      );
    }
    if (s.level === LEVEL.PLATE_CITY_MAP) {
      return (
        <>
          <h2>
            {d.plateCityMapFocusedProvince
              ? "在放大地图中选择城市"
              : "直接选城市，或先放大省份"}
          </h2>
          <p className="map-answer-summary">
            点击城市区块会立即判题；点击每张地图右上角的“放大”只会进入该省，不会判错。
          </p>
          {d.plateCityMapFocusedProvince ? (
            <p className="map-answer-summary">
              如果省份没选对，可以返回地图墙重新选择，期间不会影响连胜。
            </p>
          ) : null}
          <p className="map-answer-summary">
            当前范围共 {d.selectedCityMapProvinces.length} 个省份、{d.cityPoolSize} 个城市或地区，优先避开最近 {CITY_MAP_RECENT_QUESTION_LIMIT} 道题。
          </p>
        </>
      );
    }
    if (s.level === LEVEL.FINAL_BOSS) {
      const boss = d.currentBossQuestion;
      return (
        <>
          <h2>
            {boss?.kind === "truth"
              ? "判断这句话的真伪"
              : boss?.kind === "map"
                ? "在左侧地图直接落点"
                : "提交本题答案"}
          </h2>
          {boss?.kind === "truth" ? (
            <div className="truth-actions">
              <button type="button" onClick={() => actions.answerBossTruth(true)}>
                <span>✓</span> 正确
              </button>
              <button type="button" onClick={() => actions.answerBossTruth(false)}>
                <span>×</span> 错误
              </button>
            </div>
          ) : boss?.kind === "map" ? (
            <p className="map-answer-summary">
              点击一个省级行政区后立即判题。答错会失去一条生命。
            </p>
          ) : (
            <GauntletAnswerForm
              actions={actions}
              id="gauntlet-boss-answer"
              label="答案"
              placeholder="输入省份、城市或车牌前缀"
            />
          )}
        </>
      );
    }
    if (s.level === LEVEL.PROVINCE_NEIGHBORS) {
      return (
        <>
          <h2>选出全部陆地邻省</h2>
          <div className="gauntlet-option-grid neighbor-text-options">
            {PROVINCES.filter(
              (item) => item.code !== d.currentChallengeProvince?.code,
            ).map((item) => {
              const selected = s.mapSelections.has(item.code);
              return (
                <button
                  key={item.code}
                  className={selected ? "is-selected" : ""}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => actions.handleGauntletProvince(item)}
                >
                  {item.shortName}
                </button>
              );
            })}
          </div>
          <p className="map-answer-summary">
            已选 {s.mapSelections.size} 个：
            {Array.from(s.mapSelections)
              .map((code) => PROVINCE_BY_CODE.get(code)?.shortName)
              .filter(Boolean)
              .join("、") || "暂未选择"}
          </p>
          <button
            className="gauntlet-primary-action"
            type="button"
            disabled={s.mapSelections.size === 0}
            onClick={actions.submitNeighborSelection}
          >
            确认包围圈
          </button>
        </>
      );
    }
    if (s.level === LEVEL.CITY_MAP) {
      return (
        <>
          <h2>在左侧地图直接落点</h2>
          <p className="map-answer-summary">
            地图不显示省份名称。点击一个省级行政区后会立即判题，并自动进入下一题。
          </p>
        </>
      );
    }
    if (s.level === LEVEL.TRUTH_FLASH) {
      return (
        <>
          <h2>这句话是真的吗？</h2>
          <div className="truth-actions">
            <button type="button" onClick={() => actions.answerTruthQuestion(true)}>
              <span aria-hidden="true">✓</span> 正确
            </button>
            <button type="button" onClick={() => actions.answerTruthQuestion(false)}>
              <span aria-hidden="true">×</span> 错误
            </button>
          </div>
        </>
      );
    }
    if (s.level === LEVEL.NEIGHBOR_CHAIN) {
      return (
        <>
          <h2>选择下一个陆地邻省</h2>
          <p className="map-answer-summary">
            走过的省份不能重复。选错或走进死路会随机重置起点。
          </p>
          <ol className="province-route" aria-label="当前邻省路线">
            {s.routeCodes.map((code, index) => (
              <li key={code}>
                <span>{index + 1}</span>
                {PROVINCE_BY_CODE.get(code)?.shortName}
              </li>
            ))}
          </ol>
        </>
      );
    }
    const isPlateCompletion = s.level === LEVEL.PLATE_COMPLETION;
    const isPlatePlace = s.level === LEVEL.PLATE_PLACE;
    return (
      <>
        <h2>
          {s.level === LEVEL.PROVINCE_SHAPE
            ? "这是哪个省级行政区？"
            : isPlateCompletion
              ? "填入缺失的车牌字母"
              : isPlatePlace
                ? "写出对应省份和城市/地区"
                : "写出所属省份"}
        </h2>
        <GauntletAnswerForm
          actions={actions}
          id={isPlateCompletion ? "gauntlet-plate-answer" : "gauntlet-province-answer"}
          label={isPlateCompletion
            ? "全部车牌字母"
            : isPlatePlace
              ? "省份和城市/地区"
              : "省份名称"}
          placeholder={isPlateCompletion
            ? d.currentCity && d.currentCity.plates.length > 1
              ? "例如：A、S"
              : "例如：A"
            : isPlatePlace
              ? "例如：浙江宁波"
              : s.level === LEVEL.PROVINCE_SHAPE
                ? "例如：江苏省"
                : "例如：江苏"}
          valueSource={isPlateCompletion ? "plate" : "province"}
          maxLength={isPlateCompletion ? 32 : undefined}
        />
      </>
    );
  })();

  return (
    <aside className="gauntlet-answer-panel">
      <p className="eyebrow">你的答案</p>
      {answerContent}
      {!s.answerReview ? (
        <>
          <p className={`gauntlet-feedback is-${s.feedbackType}`} aria-live="polite">
            {s.feedback}
          </p>
          {STREAK_NOTE_LEVELS.has(s.level) &&
          (s.level !== LEVEL.MISTAKE_REVENGE || Boolean(d.currentMistake)) ? (
            <p className="streak-note">
              答对后自动进入下一题；答错才会展示正确答案与知识解释。
            </p>
          ) : null}
        </>
      ) : null}
    </aside>
  );
}
