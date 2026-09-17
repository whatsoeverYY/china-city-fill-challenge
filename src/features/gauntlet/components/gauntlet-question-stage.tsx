"use client";

import { PROVINCE_BY_CODE } from "@/domain/geography/data/provinces";
import GauntletDetailMap from "@/features/gauntlet/components/maps/gauntlet-detail-map";
import GauntletNationalMap from "@/features/gauntlet/components/maps/gauntlet-national-map";
import GauntletProvinceMapWall from "@/features/gauntlet/components/maps/gauntlet-province-map-wall";
import ProvinceSilhouette from "@/features/gauntlet/components/maps/province-silhouette";
import CityNeighborHintMap from "@/features/gauntlet/components/maps/city-neighbor-hint-map";
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
        return <p className="map-error grid min-h-48 place-items-center p-8 text-center text-sm font-bold text-city-900">省内地图载入失败，请重试本关</p>;
      }
      return d.gauntletDetailMap && d.gauntletDetailReady && d.currentMapRegion ? (
        <div className="gauntlet-map-question relative grid size-full place-items-center">
          <div className="map-question-banner absolute left-4 top-4 z-[2] grid justify-items-center rounded-xl border border-city-500/20 bg-paper-100/95 px-[18px] py-[10px] text-ink shadow-[0_10px_25px_rgba(62,49,33,.12)]">
            <small className="block text-meta font-extrabold tracking-[.12em] text-stone-600">在{d.currentMapRegion.provinceShort}地图上找到</small>
            <strong className="font-serif text-[23px]">{d.currentMapRegion.city}</strong>
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
          <div className="map-question-banner absolute left-4 top-4 z-[2] grid justify-items-center rounded-xl border border-city-500/20 bg-paper-100/95 px-[18px] py-[10px] text-ink shadow-[0_10px_25px_rgba(62,49,33,.12)]">
            <small className="block text-meta font-extrabold tracking-[.12em] text-stone-600">{d.currentGroupQuestion.description}</small>
            <strong className="font-serif text-[23px]">{d.currentGroupQuestion.title}</strong>
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
        <ChoiceQuestion badge="双" badgeClassName="bg-clay-500" prompt={d.currentDualIntruderQuestion?.instruction} value={d.currentDualIntruderQuestion?.prompt ?? "载入中…"} hint="城市、省份与行政中心会交替出题" />
      );
    }
    if (s.level === LEVEL.PLATE_FAULT) {
      return (
        <ChoiceQuestion className="plate-fault-heading" badge="查" badgeClassName="bg-atlas-500" prompt="四组对应关系中有且仅有一组错误" value="找出车牌错误项" hint="城市名称与车牌前缀必须同时匹配" />
      );
    }
    if (s.level === LEVEL.UNIVERSITY_CITY) {
      return d.currentUniversity ? (
        <ChoiceQuestion className="university-question" badge="校" badgeClassName="bg-atlas-500" prompt={`原“${d.currentUniversity.tier}工程”高校`} value={d.currentUniversity.name} hint="写出学校主要办学地所在城市" />
      ) : <LoadingMap />;
    }
    if (s.level === LEVEL.MISTAKE_REVENGE) {
      return d.currentMistake ? (
        <ChoiceQuestion className="mistake-question" badge="错" badgeClassName="bg-city-600" prompt={`${d.currentMistake.category}错题 · 曾答错 ${d.currentMistake.wrongCount} 次`} value={d.currentMistake.prompt} hint="答对后，这道题会从本机错题库移除" />
      ) : (
        <div className="mistake-empty-state grid max-w-[560px] justify-items-center gap-3.5 text-center">
          <span className="grid size-[92px] place-items-center rounded-full bg-jade-500 text-[43px] font-black text-white shadow-[0_18px_35px_rgba(45,125,95,.2)]" aria-hidden="true">✓</span>
          <strong className="font-serif text-page max-sm:text-page-mobile">暂无历史错题</strong>
          <p className="m-0 text-compact text-ink-500">先去挑战其他关卡；答错的城市、省份、车牌、省会和高校题会自动收录到这里。</p>
        </div>
      );
    }
    if (s.level === LEVEL.CONFUSABLE_CITIES) {
      return d.currentConfusableQuestion ? (
        <ChoiceQuestion className="confusable-question" badge="辨" badgeClassName="bg-scholar-400" prompt={d.currentConfusableQuestion.instruction} value={d.currentConfusableQuestion.prompt} hint={d.currentConfusableQuestion.pair.join(" · ")} />
      ) : <LoadingMap />;
    }
    if (s.level === LEVEL.PROVINCE_CITY_COUNT) {
      return d.currentProvinceCityCount ? (
        <ChoiceQuestion className="city-count-question" badge="数" badgeClassName="bg-moss-500" prompt="地级及以上城市数量" value={d.currentProvinceCityCount.name} hint="内地按2024年《中国统计年鉴》口径；港澳台按当地现行行政层级说明" />
      ) : <LoadingMap />;
    }
    if (s.level === LEVEL.CITY_NEIGHBORS) {
      if (!s.cityNeighborHintVisible) {
        return d.currentMapRegion ? (
          <ChoiceQuestion
            className="city-neighbor-question"
            badge="邻"
            badgeClassName="bg-moss-500"
            prompt="写出同一省级行政区内与它陆地接壤的全部行政区"
            value={d.currentMapRegion.city}
            hint="答案不完整时会显示带名称和市界的省级提示地图"
          />
        ) : <LoadingMap />;
      }
      if (d.gauntletDetailError) {
        return <p className="map-error grid min-h-48 place-items-center p-8 text-center text-sm font-bold text-city-900">邻市提示地图载入失败，请重试本关</p>;
      }
      return d.gauntletDetailMap && d.gauntletDetailReady &&
        d.currentCityNeighborQuestion ? (
          <div className="gauntlet-map-question city-neighbor-map-question relative grid size-full place-items-center">
            <div className="map-question-banner absolute left-4 top-4 z-[2] grid justify-items-center rounded-xl border border-city-500/20 bg-paper-100/95 px-[18px] py-[10px] text-ink shadow-[0_10px_25px_rgba(62,49,33,.12)]">
              <small className="block text-meta font-extrabold tracking-[.12em] text-stone-600">观察哪些行政区与红色目标共享陆地边界</small>
              <strong className="font-serif text-[23px]">{d.currentCityNeighborQuestion.city}</strong>
            </div>
            <CityNeighborHintMap
              map={d.gauntletDetailMap}
              targetRegionId={d.currentCityNeighborQuestion.regionId}
            />
          </div>
        ) : <LoadingMap />;
    }
    if (s.level === LEVEL.PLATE_CITY_MAP) {
      if (d.gauntletDetailError) {
        return <p className="map-error grid min-h-48 place-items-center p-8 text-center text-sm font-bold text-city-900">所选省份地图载入失败，请重试本关</p>;
      }
      return d.gauntletDetailMap && d.gauntletDetailReady && d.currentCity ? (
        <div className="gauntlet-map-question plate-city-map-question relative grid size-full place-items-center">
          <div className="map-question-banner plate-city-map-banner absolute left-4 top-4 z-[2] grid justify-items-center rounded-xl border border-city-500/20 bg-paper-100/95 px-[18px] py-[10px] text-ink shadow-[0_10px_25px_rgba(62,49,33,.12)]">
            <small className="block text-meta font-extrabold tracking-[.12em] text-stone-600">
              {d.plateCityMapFocusedProvince
                ? "已放大一张省级地图，点击城市区块后才会判题"
                : "可以直接点击城市，也可以先选择一张省级地图放大"}
            </small>
            <strong className="font-serif text-[23px]">{d.currentCity.plate}</strong>
          </div>
          {d.plateCityMapFocusedProvince ? (
            <div className="gauntlet-focused-province-map grid size-full grid-rows-[auto_1fr] gap-3">
              <div className="gauntlet-focused-province-toolbar flex items-center justify-between gap-3 rounded-xl bg-card p-3 text-xs">
                <span className="text-ink-soft">省份选择不会判错，城市落点后才计算答案</span>
                <button
                  className="min-h-10 cursor-pointer rounded-full border border-black/15 bg-white px-3 py-2 text-compact font-black max-md:min-h-11"
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
            <div className="map-question-banner absolute left-4 top-4 z-[2] grid justify-items-center rounded-xl border border-city-500/20 bg-paper-100/95 px-[18px] py-[10px] text-ink shadow-[0_10px_25px_rgba(62,49,33,.12)]">
              <small className="block text-meta font-extrabold tracking-[.12em] text-stone-600">{boss.prompt}</small>
              <strong className="font-serif text-[23px]">{boss.value}</strong>
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
        <ChoiceQuestion className="boss-text-question" badge={boss.badge} badgeClassName="bg-gradient-to-br from-city-500 to-scholar-700" prompt={boss.prompt} value={boss.value} hint={
            boss.kind === "text" && boss.matchAllTargets && boss.targets.length > 1
              ? `多号牌城市：${boss.targets.length} 个前缀必须全部答出`
              : "终极混战题型会随时切换"
        } />
      ) : <LoadingMap />;
    }
    if (s.level === LEVEL.PROVINCE_NEIGHBORS) {
      return d.currentChallengeProvince ? (
        <ChoiceQuestion className="neighbor-text-question" badge="邻" badgeClassName="bg-moss-500" prompt="选出全部陆地接壤的省级行政区" value={d.currentChallengeProvince.name} hint="不再依赖地图，直接根据省份名称判断" />
      ) : <LoadingMap />;
    }
    if (s.level === LEVEL.CITY_MAP) {
      return s.nationalMap && d.currentCity ? (
        <div className="gauntlet-map-question relative grid size-full place-items-center">
          <div className="map-question-banner absolute left-4 top-4 z-[2] grid justify-items-center rounded-xl border border-city-500/20 bg-paper-100/95 px-[18px] py-[10px] text-ink shadow-[0_10px_25px_rgba(62,49,33,.12)]">
            <small className="block text-meta font-extrabold tracking-[.12em] text-stone-600">点击它所属的省级行政区</small>
            <strong className="font-serif text-[23px]">{d.currentCity.city}</strong>
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
          <div className="map-question-banner absolute left-4 top-4 z-[2] grid justify-items-center rounded-xl border border-city-500/20 bg-paper-100/95 px-[18px] py-[10px] text-ink shadow-[0_10px_25px_rgba(62,49,33,.12)]">
            <small className="block text-meta font-extrabold tracking-[.12em] text-stone-600">当前省份</small>
            <strong className="font-serif text-[23px]">
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
        <ChoiceQuestion className="truth-question" badge="判" badgeClassName="bg-scholar-600" badgeShapeClassName="rounded-full" prompt="下面这句话是正确还是错误？" value={d.currentTruthQuestion?.statement ?? "载入中…"} />
      );
    }
    if (s.level === LEVEL.PLATE_COMPLETION) {
      return (
        <ChoiceQuestion className="city-question plate-fill-question" badge="补" badgeClassName="bg-city-500" prompt="补出这个城市或地区的全部车牌字母" value={d.currentCity?.city ?? "载入中…"} hint={<>
          <span className="plate-blank inline-block min-w-[150px] rounded-[9px] border-[3px] border-white bg-navy-600 px-[22px] py-[10px] font-mono text-[34px] tracking-[.16em] text-white shadow-plate-field">
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
        badgeClassName={s.level === LEVEL.PLATE_PLACE ? "bg-navy-500" : "bg-city-500"}
        prompt={s.level === LEVEL.PLATE_PLACE ? "这组车牌属于哪里？" : "这个城市或地区属于哪里？"}
        value={(s.level === LEVEL.PLATE_PLACE ? d.currentCity?.plate : d.currentCity?.city) ?? "载入中…"}
        valueClassName={s.level === LEVEL.PLATE_PLACE ? "min-w-[230px] rounded-xl border-4 border-white bg-navy-600 px-[26px] py-3 font-mono tracking-[.12em] text-white shadow-plate-field-lg max-sm:min-w-0 max-sm:px-4" : ""}
        hint={s.level === LEVEL.PLATE_PLACE ? "请在一个输入框中连写省份和城市/地区" : undefined}
      />
    );
  })();

  return (
    <div className="gauntlet-question-stage relative grid min-h-[590px] min-w-0 place-items-center overflow-hidden border-r border-black/[.13] bg-paper-500 [background-image:radial-gradient(circle_at_50%_45%,rgba(255,255,255,.85),transparent_21rem),linear-gradient(rgba(53,66,56,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(53,66,56,.035)_1px,transparent_1px)] [background-size:auto,24px_24px,24px_24px] p-[45px] max-lg:border-r-0 max-lg:border-b max-md:min-h-[50vh] max-md:p-6 max-sm:min-h-[300px] max-sm:p-[38px_16px_16px]">
      <GauntletQuestionCount />
      {question}
    </div>
  );
}
