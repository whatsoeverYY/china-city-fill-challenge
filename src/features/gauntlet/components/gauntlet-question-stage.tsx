"use client";

import { PROVINCE_BY_CODE } from "@/domain/geography/data/provinces";
import GauntletDetailMap from "@/features/gauntlet/components/maps/gauntlet-detail-map";
import GauntletNationalMap from "@/features/gauntlet/components/maps/gauntlet-national-map";
import GauntletProvinceMapWall from "@/features/gauntlet/components/maps/gauntlet-province-map-wall";
import ProvinceSilhouette from "@/features/gauntlet/components/maps/province-silhouette";
import GauntletQuestionCount from "@/features/gauntlet/components/gauntlet-question-count";
import ChoiceQuestion from "@/features/gauntlet/components/choice-question";
import { GAUNTLET_LEVEL_ID } from "@/domain/game/gauntlet-level-ids";
import type { GauntletActions } from "@/features/gauntlet/hooks/use-gauntlet-actions";
import { useGauntletDerived } from "@/features/gauntlet/model/gauntlet-derived-context";
import { useGauntletSession } from "@/features/gauntlet/model/gauntlet-session-context";
import LoadingMap from "@/features/map/components/loading-map";

const LEVEL = GAUNTLET_LEVEL_ID;

export default function GauntletQuestionStage({
  actions,
}: {
  actions: GauntletActions;
}) {
  const s = useGauntletSession();
  const d = useGauntletDerived();
  if (!s.level) return null;

  const question = (() => {
    if (s.level === LEVEL.PROVINCE_SHAPE) {
      return d.currentProvinceFeature ? (
        <ProvinceSilhouette
          feature={d.currentProvinceFeature}
          rotation={d.isRotatedProvinceShapeStage
            ? ((s.questionIndex - d.provinceShapeNormalTarget) * 137 + 47) % 360
            : 0}
        />
      ) : <LoadingMap />;
    }
    if (s.level === LEVEL.CITY_UNDERCOVER) {
      return (
        <ChoiceQuestion badge="卧" prompt="其中三座城市属于同一个省份" value="找出唯一的城市卧底" hint="需要自己判断另外三座城市的共同归属" />
      );
    }
    if (s.level === LEVEL.REGION_MAP) {
      if (d.gauntletDetailError) {
        return <p className="map-error grid min-h-48 place-items-center p-8 text-center text-sm font-bold text-brand-red-dark">省内地图载入失败，请重试本关</p>;
      }
      return d.gauntletDetailMap && d.gauntletDetailReady && d.currentMapRegion ? (
        <div className="gauntlet-map-question relative grid size-full place-items-center">
          <div className="map-question-banner absolute left-4 top-4 z-[2] rounded-xl bg-ink/90 px-4 py-3 text-white shadow-lg">
            <small className="block text-[10px] text-white/60">在{d.currentMapRegion.provinceShort}地图上找到</small>
            <strong className="text-xl">{d.currentMapRegion.city}</strong>
          </div>
          <GauntletDetailMap
            map={d.gauntletDetailMap}
            onRegion={actions.handleDetailRegion}
            correctRegionId={s.answerReview?.highlightRegionId}
            selectedRegionId={s.answerReview?.selectedRegionId}
            showLabels={Boolean(s.answerReview)}
            readOnly={Boolean(s.answerReview)}
          />
        </div>
      ) : <LoadingMap />;
    }
    if (s.level === LEVEL.TERRITORY_GROUPS) {
      return s.nationalMap && d.currentGroupQuestion ? (
        <div className="gauntlet-map-question relative grid size-full place-items-center">
          <div className="map-question-banner absolute left-4 top-4 z-[2] rounded-xl bg-ink/90 px-4 py-3 text-white shadow-lg">
            <small className="block text-[10px] text-white/60">{d.currentGroupQuestion.description}</small>
            <strong className="text-xl">{d.currentGroupQuestion.title}</strong>
          </div>
          <GauntletNationalMap
            map={s.nationalMap}
            selectedCodes={s.mapSelections}
            correctCodes={d.reviewProvinceCodes}
            routeCodes={[]}
            originCode={null}
            showLabels
            onProvince={actions.handleGauntletProvince}
          />
        </div>
      ) : <LoadingMap />;
    }
    if (s.level === LEVEL.GEOGRAPHY_ELIMINATION) {
      return (
        <ChoiceQuestion badge="双" prompt={d.currentDualIntruderQuestion?.instruction} value={d.currentDualIntruderQuestion?.prompt ?? "载入中…"} hint="城市、省份与行政中心会交替出题" />
      );
    }
    if (s.level === LEVEL.PLATE_FAULT) {
      return (
        <ChoiceQuestion className="plate-fault-heading" badge="查" prompt="四组对应关系中有且仅有一组错误" value="找出车牌错误项" hint="城市名称与车牌前缀必须同时匹配" />
      );
    }
    if (s.level === LEVEL.UNIVERSITY_CITY) {
      return d.currentUniversity ? (
        <ChoiceQuestion className="university-question" badge="校" prompt={`原“${d.currentUniversity.tier}工程”高校`} value={d.currentUniversity.name} hint="写出学校主要办学地所在城市" />
      ) : <LoadingMap />;
    }
    if (s.level === LEVEL.MISTAKE_REVENGE) {
      return d.currentMistake ? (
        <ChoiceQuestion className="mistake-question" badge="错" prompt={`${d.currentMistake.category}错题 · 曾答错 ${d.currentMistake.wrongCount} 次`} value={d.currentMistake.prompt} hint="答对后，这道题会从本机错题库移除" />
      ) : (
        <div className="mistake-empty-state grid justify-items-center gap-3 text-center">
          <span className="text-5xl" aria-hidden="true">✓</span>
          <strong className="text-2xl">暂无历史错题</strong>
          <p className="m-0 text-sm text-ink-soft">先去挑战其他关卡；答错的城市、省份、车牌、省会和高校题会自动收录到这里。</p>
        </div>
      );
    }
    if (s.level === LEVEL.CONFUSABLE_CITIES) {
      return d.currentConfusableQuestion ? (
        <ChoiceQuestion className="confusable-question" badge="辨" prompt={d.currentConfusableQuestion.instruction} value={d.currentConfusableQuestion.prompt} hint={d.currentConfusableQuestion.pair.join(" · ")} />
      ) : <LoadingMap />;
    }
    if (s.level === LEVEL.PROVINCE_CITY_COUNT) {
      return d.currentProvinceCityCount ? (
        <ChoiceQuestion className="city-count-question" badge="数" prompt="地级及以上城市数量" value={d.currentProvinceCityCount.name} hint="内地按2024年《中国统计年鉴》口径；港澳台按当地现行行政层级说明" />
      ) : <LoadingMap />;
    }
    if (s.level === LEVEL.PLATE_CITY_MAP) {
      if (d.gauntletDetailError) {
        return <p className="map-error grid min-h-48 place-items-center p-8 text-center text-sm font-bold text-brand-red-dark">所选省份地图载入失败，请重试本关</p>;
      }
      return d.gauntletDetailMap && d.gauntletDetailReady && d.currentCity ? (
        <div className="gauntlet-map-question plate-city-map-question relative grid size-full place-items-center">
          <div className="map-question-banner plate-city-map-banner absolute left-4 top-4 z-[2] rounded-xl bg-ink/90 px-4 py-3 text-white shadow-lg">
            <small className="block text-[10px] text-white/60">
              {d.plateCityMapFocusedProvince
                ? "已放大一张省级地图，点击城市区块后才会判题"
                : "可以直接点击城市，也可以先选择一张省级地图放大"}
            </small>
            <strong className="text-xl">{d.currentCity.plate}</strong>
          </div>
          {d.plateCityMapFocusedProvince ? (
            <div className="gauntlet-focused-province-map grid size-full grid-rows-[auto_1fr] gap-3">
              <div className="gauntlet-focused-province-toolbar flex items-center justify-between gap-3 rounded-xl bg-card p-3 text-xs">
                <span className="text-ink-soft">省份选择不会判错，城市落点后才计算答案</span>
                <button
                  className="cursor-pointer rounded-full border border-black/15 bg-white px-3 py-2 text-[10px] font-black"
                  type="button"
                  onClick={() => s.setPlateCityMapFocusedProvinceCode(null)}
                >
                  ← 返回重新选省
                </button>
              </div>
              <GauntletProvinceMapWall
                map={d.gauntletDetailMap}
                provinces={[d.plateCityMapFocusedProvince]}
                onRegion={actions.handleDetailRegion}
                correctRegionId={s.answerReview?.highlightRegionId}
                readOnly={Boolean(s.answerReview)}
              />
            </div>
          ) : (
            <GauntletProvinceMapWall
              map={d.gauntletDetailMap}
              provinces={d.selectedCityMapProvinces}
              onRegion={actions.handleDetailRegion}
              onProvinceFocus={s.setPlateCityMapFocusedProvinceCode}
              correctRegionId={s.answerReview?.highlightRegionId}
              readOnly={Boolean(s.answerReview)}
            />
          )}
        </div>
      ) : <LoadingMap />;
    }
    if (s.level === LEVEL.FINAL_BOSS) {
      const boss = d.currentBossQuestion;
      if (boss?.kind === "map" && s.nationalMap) {
        return (
          <div className="gauntlet-map-question boss-question-stage relative grid size-full place-items-center">
            <div className="map-question-banner absolute left-4 top-4 z-[2] rounded-xl bg-ink/90 px-4 py-3 text-white shadow-lg">
              <small className="block text-[10px] text-white/60">{boss.prompt}</small>
              <strong className="text-xl">{boss.value}</strong>
            </div>
            <GauntletNationalMap
              map={s.nationalMap}
              selectedCodes={new Set<string>()}
              correctCodes={d.reviewProvinceCodes}
              routeCodes={[]}
              originCode={null}
              showLabels={false}
              onProvince={actions.handleGauntletProvince}
            />
          </div>
        );
      }
      if (boss?.kind === "shape" && d.bossShapeFeature) {
        return (
          <div className="boss-shape-question grid justify-items-center gap-4">
            <p className="m-0 text-sm font-black">{boss.prompt}</p>
            <ProvinceSilhouette
              feature={d.bossShapeFeature}
              rotation={(s.questionIndex * 149 + 31) % 360}
            />
          </div>
        );
      }
      return boss && boss.kind !== "shape" ? (
        <ChoiceQuestion className="boss-text-question" badge={boss.badge} prompt={boss.prompt} value={boss.value} hint={
            boss.kind === "text" && boss.matchAllTargets && boss.targets.length > 1
              ? `多号牌城市：${boss.targets.length} 个前缀必须全部答出`
              : "终极混战题型会随时切换"
        } />
      ) : <LoadingMap />;
    }
    if (s.level === LEVEL.PROVINCE_NEIGHBORS) {
      return d.currentChallengeProvince ? (
        <ChoiceQuestion className="neighbor-text-question" badge="邻" prompt="选出全部陆地接壤的省级行政区" value={d.currentChallengeProvince.name} hint="不再依赖地图，直接根据省份名称判断" />
      ) : <LoadingMap />;
    }
    if (s.level === LEVEL.CITY_MAP) {
      return s.nationalMap && d.currentCity ? (
        <div className="gauntlet-map-question relative grid size-full place-items-center">
          <div className="map-question-banner absolute left-4 top-4 z-[2] rounded-xl bg-ink/90 px-4 py-3 text-white shadow-lg">
            <small className="block text-[10px] text-white/60">点击它所属的省级行政区</small>
            <strong className="text-xl">{d.currentCity.city}</strong>
          </div>
          <GauntletNationalMap
            map={s.nationalMap}
            selectedCodes={new Set<string>()}
            correctCodes={d.reviewProvinceCodes}
            routeCodes={[]}
            originCode={null}
            showLabels={false}
            onProvince={actions.handleGauntletProvince}
          />
        </div>
      ) : <LoadingMap />;
    }
    if (s.level === LEVEL.NEIGHBOR_CHAIN) {
      return s.nationalMap ? (
        <div className="gauntlet-map-question relative grid size-full place-items-center">
          <div className="map-question-banner absolute left-4 top-4 z-[2] rounded-xl bg-ink/90 px-4 py-3 text-white shadow-lg">
            <small className="block text-[10px] text-white/60">当前省份</small>
            <strong className="text-xl">
              {PROVINCE_BY_CODE.get(s.routeCodes.at(-1) ?? "")?.name ?? "载入中…"}
            </strong>
          </div>
          <GauntletNationalMap
            map={s.nationalMap}
            selectedCodes={new Set<string>()}
            routeCodes={s.routeCodes}
            originCode={s.routeCodes[0] ?? null}
            showLabels
            onProvince={actions.handleGauntletProvince}
          />
        </div>
      ) : <LoadingMap />;
    }
    if (s.level === LEVEL.TRUTH_FLASH) {
      return (
        <ChoiceQuestion className="truth-question" badge="判" prompt="下面这句话是正确还是错误？" value={d.currentTruthQuestion?.statement ?? "载入中…"} />
      );
    }
    if (s.level === LEVEL.PLATE_COMPLETION) {
      return (
        <ChoiceQuestion className="city-question plate-fill-question" badge="补" prompt="补出这个城市或地区的全部车牌字母" value={d.currentCity?.city ?? "载入中…"} hint={<>
          <span className="plate-blank inline-block min-w-14 border-b-4 border-brand-red text-brand-red">
            {d.currentCity
              ? `${d.currentCity.plate.slice(0, 1)} ${d.currentCity.plates.map(
                  (plate) => "？".repeat(Math.max(
                    1,
                    plate.replace(/^\p{Script=Han}/u, "").length,
                  )),
                ).join(" / ")}`
              : "？"}
          </span>
          {d.currentCity && d.currentCity.plates.length > 1 ? (
            <span className="mt-3 block">多号牌区域：用顿号或空格分隔，必须全部答出</span>
          ) : null}
        </>} />
      );
    }
    return (
      <ChoiceQuestion
        className="city-question"
        badge={s.level === LEVEL.PLATE_PLACE ? "牌" : "城"}
        prompt={s.level === LEVEL.PLATE_PLACE ? "这组车牌属于哪里？" : "这个城市或地区属于哪里？"}
        value={(s.level === LEVEL.PLATE_PLACE ? d.currentCity?.plate : d.currentCity?.city) ?? "载入中…"}
        hint={s.level === LEVEL.PLATE_PLACE ? "请在一个输入框中连写省份和城市/地区" : undefined}
      />
    );
  })();

  return (
    <div className="gauntlet-question-stage relative grid min-h-[560px] place-items-center bg-[#f7f1e5] p-[clamp(18px,4vw,48px)] max-md:min-h-[50vh]">
      <GauntletQuestionCount />
      {question}
    </div>
  );
}
