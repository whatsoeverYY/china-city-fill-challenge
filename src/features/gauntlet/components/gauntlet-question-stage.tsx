"use client";

import { PROVINCE_BY_CODE } from "@/domain/geography/data/provinces";
import {
  GauntletDetailMap,
  GauntletNationalMap,
  GauntletProvinceMapWall,
  ProvinceSilhouette,
} from "@/features/gauntlet/components/gauntlet-maps";
import GauntletQuestionCount from "@/features/gauntlet/components/gauntlet-question-count";
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
        <div className="choice-question">
          <span aria-hidden="true">卧</span>
          <p>其中三座城市属于同一个省份</p>
          <strong>找出唯一的城市卧底</strong>
          <small>需要自己判断另外三座城市的共同归属</small>
        </div>
      );
    }
    if (s.level === LEVEL.REGION_MAP) {
      if (d.gauntletDetailError) {
        return <p className="map-error">省内地图载入失败，请重试本关</p>;
      }
      return d.gauntletDetailMap && d.gauntletDetailReady && d.currentMapRegion ? (
        <div className="gauntlet-map-question">
          <div className="map-question-banner">
            <small>在{d.currentMapRegion.provinceShort}地图上找到</small>
            <strong>{d.currentMapRegion.city}</strong>
          </div>
          <GauntletDetailMap
            map={d.gauntletDetailMap}
            onRegion={actions.handleDetailRegion}
            correctRegionName={s.answerReview?.highlightRegionName}
            selectedRegionName={s.answerReview?.selectedRegionName}
            showLabels={Boolean(s.answerReview)}
            readOnly={Boolean(s.answerReview)}
          />
        </div>
      ) : <LoadingMap />;
    }
    if (s.level === LEVEL.TERRITORY_GROUPS) {
      return s.nationalMap && d.currentGroupQuestion ? (
        <div className="gauntlet-map-question">
          <div className="map-question-banner">
            <small>{d.currentGroupQuestion.description}</small>
            <strong>{d.currentGroupQuestion.title}</strong>
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
        <div className="choice-question is-dual">
          <span aria-hidden="true">双</span>
          <p>{d.currentDualIntruderQuestion?.instruction}</p>
          <strong>{d.currentDualIntruderQuestion?.prompt ?? "载入中…"}</strong>
          <small>城市、省份与行政中心会交替出题</small>
        </div>
      );
    }
    if (s.level === LEVEL.PLATE_FAULT) {
      return (
        <div className="choice-question plate-fault-heading">
          <span aria-hidden="true">查</span>
          <p>四组对应关系中有且仅有一组错误</p>
          <strong>找出车牌错误项</strong>
          <small>城市名称与车牌前缀必须同时匹配</small>
        </div>
      );
    }
    if (s.level === LEVEL.UNIVERSITY_CITY) {
      return d.currentUniversity ? (
        <div className="choice-question university-question">
          <span aria-hidden="true">校</span>
          <p>原“{d.currentUniversity.tier}工程”高校</p>
          <strong>{d.currentUniversity.name}</strong>
          <small>写出学校主要办学地所在城市</small>
        </div>
      ) : <LoadingMap />;
    }
    if (s.level === LEVEL.MISTAKE_REVENGE) {
      return d.currentMistake ? (
        <div className="choice-question mistake-question">
          <span aria-hidden="true">错</span>
          <p>{d.currentMistake.category}错题 · 曾答错 {d.currentMistake.wrongCount} 次</p>
          <strong>{d.currentMistake.prompt}</strong>
          <small>答对后，这道题会从本机错题库移除</small>
        </div>
      ) : (
        <div className="mistake-empty-state">
          <span aria-hidden="true">✓</span>
          <strong>暂无历史错题</strong>
          <p>先去挑战其他关卡；答错的城市、省份、车牌、省会和高校题会自动收录到这里。</p>
        </div>
      );
    }
    if (s.level === LEVEL.CONFUSABLE_CITIES) {
      return d.currentConfusableQuestion ? (
        <div className="choice-question confusable-question">
          <span aria-hidden="true">辨</span>
          <p>{d.currentConfusableQuestion.instruction}</p>
          <strong>{d.currentConfusableQuestion.prompt}</strong>
          <small>{d.currentConfusableQuestion.pair.join(" · ")}</small>
        </div>
      ) : <LoadingMap />;
    }
    if (s.level === LEVEL.PROVINCE_CITY_COUNT) {
      return d.currentProvinceCityCount ? (
        <div className="choice-question city-count-question">
          <span aria-hidden="true">数</span>
          <p>地级及以上城市数量</p>
          <strong>{d.currentProvinceCityCount.name}</strong>
          <small>内地按2024年《中国统计年鉴》口径；港澳台按当地现行行政层级说明</small>
        </div>
      ) : <LoadingMap />;
    }
    if (s.level === LEVEL.PLATE_CITY_MAP) {
      if (d.gauntletDetailError) {
        return <p className="map-error">所选省份地图载入失败，请重试本关</p>;
      }
      return d.gauntletDetailMap && d.gauntletDetailReady && d.currentCity ? (
        <div className="gauntlet-map-question plate-city-map-question">
          <div className="map-question-banner plate-city-map-banner">
            <small>
              {d.plateCityMapFocusedProvince
                ? "已放大一张省级地图，点击城市区块后才会判题"
                : "可以直接点击城市，也可以先选择一张省级地图放大"}
            </small>
            <strong>{d.currentCity.plate}</strong>
          </div>
          {d.plateCityMapFocusedProvince ? (
            <div className="gauntlet-focused-province-map">
              <div className="gauntlet-focused-province-toolbar">
                <span>省份选择不会判错，城市落点后才计算答案</span>
                <button
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
                correctRegionName={s.answerReview?.highlightRegionName}
                readOnly={Boolean(s.answerReview)}
              />
            </div>
          ) : (
            <GauntletProvinceMapWall
              map={d.gauntletDetailMap}
              provinces={d.selectedCityMapProvinces}
              onRegion={actions.handleDetailRegion}
              onProvinceFocus={s.setPlateCityMapFocusedProvinceCode}
              correctRegionName={s.answerReview?.highlightRegionName}
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
          <div className="gauntlet-map-question boss-question-stage">
            <div className="map-question-banner">
              <small>{boss.prompt}</small>
              <strong>{boss.value}</strong>
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
          <div className="boss-shape-question">
            <p>{boss.prompt}</p>
            <ProvinceSilhouette
              feature={d.bossShapeFeature}
              rotation={(s.questionIndex * 149 + 31) % 360}
            />
          </div>
        );
      }
      return boss && boss.kind !== "shape" ? (
        <div className="choice-question boss-text-question">
          <span aria-hidden="true">{boss.badge}</span>
          <p>{boss.prompt}</p>
          <strong>{boss.value}</strong>
          <small>
            {boss.kind === "text" && boss.matchAllTargets && boss.targets.length > 1
              ? `多号牌城市：${boss.targets.length} 个前缀必须全部答出`
              : "终极混战题型会随时切换"}
          </small>
        </div>
      ) : <LoadingMap />;
    }
    if (s.level === LEVEL.PROVINCE_NEIGHBORS) {
      return d.currentChallengeProvince ? (
        <div className="choice-question neighbor-text-question">
          <span aria-hidden="true">邻</span>
          <p>选出全部陆地接壤的省级行政区</p>
          <strong>{d.currentChallengeProvince.name}</strong>
          <small>不再依赖地图，直接根据省份名称判断</small>
        </div>
      ) : <LoadingMap />;
    }
    if (s.level === LEVEL.CITY_MAP) {
      return s.nationalMap && d.currentCity ? (
        <div className="gauntlet-map-question">
          <div className="map-question-banner">
            <small>点击它所属的省级行政区</small>
            <strong>{d.currentCity.city}</strong>
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
        <div className="gauntlet-map-question">
          <div className="map-question-banner">
            <small>当前省份</small>
            <strong>
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
        <div className="truth-question">
          <span aria-hidden="true">判</span>
          <p>下面这句话是正确还是错误？</p>
          <strong>{d.currentTruthQuestion?.statement ?? "载入中…"}</strong>
        </div>
      );
    }
    if (s.level === LEVEL.PLATE_COMPLETION) {
      return (
        <div className="city-question plate-fill-question">
          <span aria-hidden="true">补</span>
          <p>补出这个城市或地区的全部车牌字母</p>
          <strong>{d.currentCity?.city ?? "载入中…"}</strong>
          <small className="plate-blank">
            {d.currentCity
              ? `${d.currentCity.plate.slice(0, 1)} ${d.currentCity.plates.map(
                  (plate) => "？".repeat(Math.max(
                    1,
                    plate.replace(/^\p{Script=Han}/u, "").length,
                  )),
                ).join(" / ")}`
              : "？"}
          </small>
          {d.currentCity && d.currentCity.plates.length > 1 ? (
            <small>多号牌区域：用顿号或空格分隔，必须全部答出</small>
          ) : null}
        </div>
      );
    }
    return (
      <div className={`city-question ${s.level === LEVEL.PLATE_PLACE ? "is-plate-question" : ""}`}>
        <span aria-hidden="true">{s.level === LEVEL.PLATE_PLACE ? "牌" : "城"}</span>
        <p>{s.level === LEVEL.PLATE_PLACE ? "这组车牌属于哪里？" : "这个城市或地区属于哪里？"}</p>
        <strong>
          {(s.level === LEVEL.PLATE_PLACE ? d.currentCity?.plate : d.currentCity?.city) ?? "载入中…"}
        </strong>
        {s.level === LEVEL.PLATE_PLACE
          ? <small>请在一个输入框中连写省份和城市/地区</small>
          : null}
      </div>
    );
  })();

  return (
    <div className="gauntlet-question-stage">
      <GauntletQuestionCount />
      {question}
    </div>
  );
}
