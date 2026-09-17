"use client";

import { PROVINCE_BY_CODE } from "@/domain/geography/data/provinces";
import AnswerReviewPanel from "@/features/gauntlet/components/answer-review-panel";
import CityNeighborAnswer from "@/features/gauntlet/components/city-neighbor-answer";
import GauntletAnswerForm from "@/features/gauntlet/components/gauntlet-answer-form";
import ProvinceNeighborAnswer from "@/features/gauntlet/components/province-neighbor-answer";
import { STREAK_NOTE_LEVELS } from "@/features/gauntlet/config/gauntlet-config";
import { GAUNTLET_LEVEL_ID } from "@/domain/game/gauntlet-level-ids";
import type { GauntletActions } from "@/features/gauntlet/hooks/use-gauntlet-actions";
import { CITY_MAP_RECENT_QUESTION_LIMIT } from "@/domain/game/gauntlet-rules";
import { useGauntletDerived } from "@/features/gauntlet/model/gauntlet-derived-context";
import { useGauntletSession } from "@/features/gauntlet/model/gauntlet-session-context";

const LEVEL = GAUNTLET_LEVEL_ID;
const ANSWER_TITLE_CLASS = "mb-[30px] mt-0 font-serif text-[27px] font-bold leading-[1.35]";
const OPTION_GRID_CLASS = "gauntlet-option-grid grid grid-cols-2 gap-2 max-sm:grid-cols-1";
const OPTION_CLASS = "min-h-[76px] cursor-pointer rounded-xl border border-jade-500/25 bg-jade-200 px-3 text-[13px] font-black leading-[1.45] text-ink-700 transition hover:-translate-y-px hover:border-jade-500/50";
const SUMMARY_CLASS = "map-answer-summary mb-1 mt-0 min-h-[58px] text-xs leading-[1.8] text-ink-soft";
const PRIMARY_CLASS = "gauntlet-primary-action mt-[18px] min-h-[50px] w-full cursor-pointer rounded-[10px] border-0 bg-city-500 px-4 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40";

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
    if (s.level === LEVEL.CITY_UNDERCOVER) {
      return (
        <>
          <h2 className={ANSWER_TITLE_CLASS}>哪座城市不属于同一省？</h2>
          <div className={OPTION_GRID_CLASS}>
            {d.currentUndercoverQuestion?.options.map((item) => (
              <button
                key={item.id}
                className={OPTION_CLASS}
                type="button"
                onClick={() => actions.answerOptionQuestion(item.id)}
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
          <h2 className={ANSWER_TITLE_CLASS}>在左侧省内地图落点</h2>
          <p className={SUMMARY_CLASS}>
            地图不显示名称；市、自治州、地区、盟、区县等区块都会出题，点击后立即判题。
          </p>
          <p className={SUMMARY_CLASS}>
            当前范围共 {d.mapRegionPoolSize} 个地图区块，本轮需连续答对 {d.target} 题。系统会优先避开最近 {CITY_MAP_RECENT_QUESTION_LIMIT} 道题；答错后会重新打散下一轮。
          </p>
        </>
      );
    }
    if (s.level === LEVEL.TERRITORY_GROUPS) {
      return (
        <>
          <h2 className={ANSWER_TITLE_CLASS}>选出完整的省份集合</h2>
          <p className={SUMMARY_CLASS}>
            已选 {s.mapSelections.size} 个省级行政区。可以再次点击取消。
          </p>
          <button
            className={PRIMARY_CLASS}
            type="button"
            disabled={s.mapSelections.size === 0}
            onClick={actions.submitProvinceGroup}
          >
            确认选择
          </button>
        </>
      );
    }
    if (s.level === LEVEL.GEOGRAPHY_ELIMINATION) {
      return (
        <>
          <h2 className={ANSWER_TITLE_CLASS}>{d.currentDualIntruderQuestion?.instruction}</h2>
          <div className={OPTION_GRID_CLASS}>
            {d.currentDualIntruderQuestion?.options.map((item) => (
              <button
                key={item.id}
                className={OPTION_CLASS}
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
    if (s.level === LEVEL.PLATE_FAULT) {
      return (
        <>
          <h2 className={ANSWER_TITLE_CLASS}>点击对应错误的一组</h2>
          <div className={`${OPTION_GRID_CLASS} plate-fault-options`}>
            {d.currentPlateFaultQuestion?.options.map((item) => (
              <button
                key={item.id}
                className={`${OPTION_CLASS} min-h-[62px] border-navy-500/25 bg-navy-200 font-mono text-xs text-atlas-600`}
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
          <h2 className={ANSWER_TITLE_CLASS}>写出这所大学所在的城市</h2>
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
          <h2 className={ANSWER_TITLE_CLASS}>重新提交这道历史错题</h2>
          <GauntletAnswerForm
            actions={actions}
            id="gauntlet-mistake-answer"
            label="答案"
            placeholder="输入省份、城市、车牌或判断结果"
          />
        </>
      ) : (
        <>
          <h2 className={ANSWER_TITLE_CLASS}>错题库已经是空的</h2>
          <p className={SUMMARY_CLASS}>
            返回选关继续挑战；之后出现的新错题会自动加入本关。
          </p>
          <button
            type="button"
            className={PRIMARY_CLASS}
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
          <h2 className={ANSWER_TITLE_CLASS}>选择正确答案</h2>
          <div className={`${OPTION_GRID_CLASS} confusable-options`}>
            {d.currentConfusableQuestion?.options.map((item) => (
              <button
                key={item.id}
                className={`${OPTION_CLASS} min-h-[92px] border-scholar-500/25 bg-scholar-200 text-base text-scholar-700`}
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
    if (s.level === LEVEL.PROVINCE_CITY_COUNT) {
      return (
        <>
          <h2 className={ANSWER_TITLE_CLASS}>这里有多少座地级及以上城市？</h2>
          <GauntletAnswerForm
            actions={actions}
            id="gauntlet-city-count-answer"
            label="城市数量"
            placeholder="例如：13"
            inputMode="numeric"
            pattern="[0-9]*"
          />
          <p className={SUMMARY_CLASS}>
            只需填写数字；自治州、地区、盟和省直辖县级市不计入城市数。
          </p>
        </>
      );
    }
    if (s.level === LEVEL.CITY_NEIGHBORS) {
      return <CityNeighborAnswer actions={actions} />;
    }
    if (s.level === LEVEL.PLATE_CITY_MAP) {
      return (
        <>
          <h2 className={ANSWER_TITLE_CLASS}>
            {d.plateCityMapFocusedProvince
              ? "在放大地图中选择城市"
              : "直接选城市，或先放大省份"}
          </h2>
          <p className={SUMMARY_CLASS}>
            点击城市区块会立即判题；点击每张地图右上角的“放大”只会进入该省，不会判错。
          </p>
          {d.plateCityMapFocusedProvince ? (
            <p className={SUMMARY_CLASS}>
              如果省份没选对，可以返回地图墙重新选择，期间不会影响连胜。
            </p>
          ) : null}
          <p className={SUMMARY_CLASS}>
            当前范围共 {d.selectedCityMapProvinces.length} 个省份、{d.cityPoolSize} 个城市或地区，优先避开最近 {CITY_MAP_RECENT_QUESTION_LIMIT} 道题。
          </p>
        </>
      );
    }
    if (s.level === LEVEL.FINAL_BOSS) {
      const boss = d.currentBossQuestion;
      return (
        <>
          <h2 className={ANSWER_TITLE_CLASS}>
            {boss?.kind === "truth"
              ? "判断这句话的真伪"
              : boss?.kind === "map"
                ? "在左侧地图直接落点"
                : "提交本题答案"}
          </h2>
          {boss?.kind === "truth" ? (
            <div className="truth-actions grid grid-cols-2 gap-2.5">
              <button className="grid min-h-[108px] cursor-pointer place-content-center gap-[7px] rounded-[14px] border border-jade-500/30 bg-jade-200 text-[13px] font-black text-jade-700" type="button" onClick={() => actions.answerBossTruth(true)}>
                <span>✓</span> 正确
              </button>
              <button className="grid min-h-[108px] cursor-pointer place-content-center gap-[7px] rounded-[14px] border border-city-500/30 bg-city-300 text-[13px] font-black text-city-900" type="button" onClick={() => actions.answerBossTruth(false)}>
                <span>×</span> 错误
              </button>
            </div>
          ) : boss?.kind === "map" ? (
            <p className={SUMMARY_CLASS}>
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
      return <ProvinceNeighborAnswer actions={actions} />;
    }
    if (s.level === LEVEL.CITY_MAP) {
      return (
        <>
          <h2 className={ANSWER_TITLE_CLASS}>在左侧地图直接落点</h2>
          <p className={SUMMARY_CLASS}>
            地图不显示省份名称。点击一个省级行政区后会立即判题，并自动进入下一题。
          </p>
        </>
      );
    }
    if (s.level === LEVEL.TRUTH_FLASH) {
      return (
        <>
          <h2 className={ANSWER_TITLE_CLASS}>这句话是真的吗？</h2>
          <div className="truth-actions grid grid-cols-2 gap-2.5">
            <button className="grid min-h-[108px] cursor-pointer place-content-center gap-[7px] rounded-[14px] border border-jade-500/30 bg-jade-200 text-[13px] font-black text-jade-700" type="button" onClick={() => actions.answerTruthQuestion(true)}>
              <span aria-hidden="true">✓</span> 正确
            </button>
            <button className="grid min-h-[108px] cursor-pointer place-content-center gap-[7px] rounded-[14px] border border-city-500/30 bg-city-300 text-[13px] font-black text-city-900" type="button" onClick={() => actions.answerTruthQuestion(false)}>
              <span aria-hidden="true">×</span> 错误
            </button>
          </div>
        </>
      );
    }
    if (s.level === LEVEL.NEIGHBOR_CHAIN) {
      return (
        <>
          <h2 className={ANSWER_TITLE_CLASS}>选择下一个陆地邻省</h2>
          <p className={SUMMARY_CLASS}>
            走过的省份不能重复。选错或走进死路会随机重置起点。
          </p>
          <ol className="province-route m-0 mt-[18px] flex max-h-[230px] list-none flex-wrap gap-[7px] overflow-y-auto p-0" aria-label="当前邻省路线">
            {s.routeCodes.map((code, index) => (
              <li className="flex items-center gap-1.5 rounded-full border border-navy-500/25 bg-navy-200 px-2.5 py-[7px] text-[11px] font-extrabold text-navy-500" key={code}>
                <span className="grid size-[18px] place-items-center rounded-full bg-navy-400 font-numeric text-[9px] text-white">{index + 1}</span>
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
        <h2 className={ANSWER_TITLE_CLASS}>
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
    <aside className="gauntlet-answer-panel border-l border-black/[.13] bg-paper-100/65 px-[35px] pb-8 pt-12 max-lg:border-l-0 max-lg:border-t max-md:px-6 max-md:pb-6 max-md:pt-8 max-sm:px-4 max-sm:py-5">
      <p className="eyebrow m-0 text-xs font-black tracking-[0.18em] text-city-500">你的答案</p>
      {answerContent}
      {!s.answerReview ? (
        <>
          <p className={`gauntlet-feedback mb-0 mt-[22px] min-h-[43px] rounded-[9px] p-3 text-[11px] leading-[1.7] ${s.feedbackType === "right" ? "bg-jade-300 text-jade-700" : s.feedbackType === "wrong" ? "bg-city-300 font-bold text-city-900" : "bg-stone-200 text-stone-700"}`} aria-live="polite">
            {s.feedback}
          </p>
          {STREAK_NOTE_LEVELS.has(s.level) &&
          (s.level !== LEVEL.MISTAKE_REVENGE || Boolean(d.currentMistake)) ? (
            <p className="streak-note mb-0 mt-3 text-[10px] leading-[1.6] text-stone-500">
              {s.level === LEVEL.CITY_NEIGHBORS
                ? "首次答错会显示市界提示图；重答正确仍计入连胜。"
                : "答对后自动进入下一题；答错才会展示正确答案与知识解释。"}
            </p>
          ) : null}
        </>
      ) : null}
    </aside>
  );
}
