"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { CONFUSABLE_CITY_PAIRS } from "@/domain/geography/data/confusable-cities";
import {
  RIVER_KNOWLEDGE,
  YELLOW_RIVER_PROVINCE_GROUP,
} from "@/domain/geography/data/geographic-groups";
import {
  CITY_QUIZ_DATA,
  PLATE_QUIZ_DATA,
} from "@/domain/geography/data/city-plates";
import {
  KNOWLEDGE_CATEGORIES,
  MAP_READING_TIPS,
  type KnowledgeCategoryId,
} from "@/features/knowledge/data/knowledge-data";
import { gauntletLevelNumber } from "@/domain/game/gauntlet-levels";
import { getProvinceAdministrativeProfile } from "@/domain/geography/data/province-administrative-profiles";
import { PROVINCE_CITY_COUNT_DATA } from "@/domain/geography/data/province-city-counts";
import { UNIVERSITY_QUIZ_DATA } from "@/domain/geography/data/universities";
import CityPlatePanel from "@/features/knowledge/components/city-plate-panel";
import KnowledgeCatalog from "@/features/knowledge/components/knowledge-catalog";
import KnowledgeSearchEmpty from "@/features/knowledge/components/knowledge-search-empty";
import ProvinceProfilePanel, { PROFILE_BATCH_SIZE } from "@/features/knowledge/components/province-profile-panel";
import UniversityPanel from "@/features/knowledge/components/university-panel";
import {
  compactSearch,
  matchesSearch,
  plainPlaceName,
} from "@/features/knowledge/model/knowledge-format";
import type {
  KnowledgeBaseProps,
} from "@/features/knowledge/model/knowledge-types";
import {
  CATEGORY_TOTAL_LABELS,
  SEARCHABLE_CATEGORIES,
} from "@/features/knowledge/config/knowledge-catalog-config";


export default function KnowledgeBase({
  provinces,
  provinceCapitals,
  provinceNeighbors,
  provincePlatePrefixes,
  provinceGroups,
  onExit,
  onOpenAtlas,
}: KnowledgeBaseProps) {
  const [activeCategoryId, setActiveCategoryId] =
    useState<KnowledgeCategoryId | null>(null);
  const [query, setQuery] = useState("");
  const [selectedProvinceCodes, setSelectedProvinceCodes] = useState<Set<string>>(
    () => new Set(),
  );
  const [visibleProfileCount, setVisibleProfileCount] = useState(PROFILE_BATCH_SIZE);
  const [selectedNeighborCode, setSelectedNeighborCode] = useState("410000");
  const provinceByCode = useMemo(
    () => new Map(provinces.map((province) => [province.code, province])),
    [provinces],
  );
  const cityCountByCode = useMemo(
    () => new Map(PROVINCE_CITY_COUNT_DATA.map((item) => [item.code, item])),
    [],
  );
  const administrativeProfileByCode = useMemo(
    () => new Map(
      PROVINCE_CITY_COUNT_DATA.map((item) => [
        item.code,
        getProvinceAdministrativeProfile(item.code, item.cityCount),
      ]),
    ),
    [],
  );
  const quizCityCountByProvince = useMemo(() => {
    const result = new Map<string, number>();
    CITY_QUIZ_DATA.forEach((item) => {
      result.set(item.provinceCode, (result.get(item.provinceCode) ?? 0) + 1);
    });
    return result;
  }, []);
  const universityCountByProvince = useMemo(() => {
    const result = new Map<string, number>();
    UNIVERSITY_QUIZ_DATA.forEach((item) => {
      result.set(item.provinceCode, (result.get(item.provinceCode) ?? 0) + 1);
    });
    return result;
  }, []);

  const activeCategory = KNOWLEDGE_CATEGORIES.find(
    (category) => category.id === activeCategoryId,
  );
  const normalizedQuery = compactSearch(query);

  const clearProvinceFilters = () => {
    setQuery("");
    setSelectedProvinceCodes(new Set());
    setVisibleProfileCount(PROFILE_BATCH_SIZE);
  };

  const openCategory = (categoryId: KnowledgeCategoryId) => {
    setActiveCategoryId(categoryId);
    clearProvinceFilters();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const backToCatalog = () => {
    setActiveCategoryId(null);
    clearProvinceFilters();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredProvinces = provinces.filter(
    (province) =>
      matchesSearch(normalizedQuery, province.name, province.shortName) &&
      (selectedProvinceCodes.size === 0 || selectedProvinceCodes.has(province.code)),
  );
  const hasActiveProvinceFilter = Boolean(
    normalizedQuery || selectedProvinceCodes.size > 0,
  );
  const visibleProfileProvinces = hasActiveProvinceFilter
    ? filteredProvinces
    : filteredProvinces.slice(0, visibleProfileCount);

  const toggleProvince = (provinceCode: string) => {
    setVisibleProfileCount(PROFILE_BATCH_SIZE);
    setSelectedProvinceCodes((current) => {
      const next = new Set(current);
      if (next.has(provinceCode)) {
        next.delete(provinceCode);
      } else {
        next.add(provinceCode);
      }
      return next;
    });
  };

  const filteredCities = PLATE_QUIZ_DATA.filter((item) =>
    matchesSearch(
      normalizedQuery,
      item.city,
      item.plate,
      item.plateNote,
      item.province,
      item.provinceShort,
    ),
  );
  const cityGroups = provinces
    .map((province) => ({
      province,
      items: filteredCities.filter((item) => item.provinceCode === province.code),
    }))
    .filter((group) => group.items.length > 0);

  const filteredUniversities = UNIVERSITY_QUIZ_DATA.filter((item) =>
    matchesSearch(
      normalizedQuery,
      item.name,
      item.tier,
      item.city,
      item.province,
      item.provinceShort,
    ),
  );
  const universityGroups = provinces
    .map((province) => ({
      province,
      items: filteredUniversities.filter((item) => item.provinceCode === province.code),
    }))
    .filter((group) => group.items.length > 0);

  const selectedNeighborProvince =
    provinceByCode.get(selectedNeighborCode) ?? provinces[0];
  const selectedNeighborCodes = selectedNeighborProvince
    ? provinceNeighbors[selectedNeighborProvince.code] ?? []
    : [];

  const renderDetailContent = () => {
    if (!activeCategoryId) return null;

    if (activeCategoryId === "province-profile") {
      return (
        <ProvinceProfilePanel
          provinces={provinces}
          filteredProvinces={filteredProvinces}
          visibleProvinces={visibleProfileProvinces}
          query={query}
          setQuery={setQuery}
          selectedProvinceCodes={selectedProvinceCodes}
          toggleProvince={toggleProvince}
          clearFilters={clearProvinceFilters}
          hasActiveFilter={hasActiveProvinceFilter}
          setVisibleCount={setVisibleProfileCount}
          cityCountByCode={cityCountByCode}
          administrativeProfileByCode={administrativeProfileByCode}
          quizCityCountByProvince={quizCityCountByProvince}
          universityCountByProvince={universityCountByProvince}
          provinceCapitals={provinceCapitals}
          provinceNeighbors={provinceNeighbors}
          provincePlatePrefixes={provincePlatePrefixes}
        />
      );
    }

    if (activeCategoryId === "city-plate") {
      return (
        <CityPlatePanel
          groups={cityGroups}
          query={query}
          provinceCapitals={provinceCapitals}
          provincePlatePrefixes={provincePlatePrefixes}
          onOpenAtlas={onOpenAtlas}
        />
      );
    }

    if (activeCategoryId === "universities") {
      return <UniversityPanel groups={universityGroups} query={query} />;
    }

    if (activeCategoryId === "neighbors") {
      return (
        <div className="knowledge-neighbor-layout">
          <aside>
            <p>选择中心省份</p>
            <div className="knowledge-province-selector">
              {provinces.map((province) => (
                <button
                  key={province.code}
                  type="button"
                  className={province.code === selectedNeighborProvince?.code ? "is-active" : ""}
                  onClick={() => setSelectedNeighborCode(province.code)}
                >
                  {province.shortName}
                </button>
              ))}
            </div>
          </aside>
          <section className="knowledge-neighbor-stage">
            <div className="neighbor-orbit" aria-label={`${selectedNeighborProvince?.name}的陆地邻省`}>
              <article className="neighbor-center">
                <span>{provincePlatePrefixes[selectedNeighborProvince?.code]}</span>
                <h3>{selectedNeighborProvince?.shortName}</h3>
                <p>{plainPlaceName(provinceCapitals[selectedNeighborProvince?.code])}</p>
              </article>
              <div className="neighbor-satellites">
                {selectedNeighborCodes.length > 0 ? selectedNeighborCodes.map((code, index) => {
                  const neighbor = provinceByCode.get(code);
                  if (!neighbor) return null;
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setSelectedNeighborCode(code)}
                    >
                      <span>{index + 1}</span>
                      <strong>{neighbor.shortName}</strong>
                      <small>{plainPlaceName(provinceCapitals[code])}</small>
                    </button>
                  );
                }) : (
                  <p className="knowledge-empty-note">没有陆地相邻的省级行政区</p>
                )}
              </div>
            </div>
            <div className="knowledge-neighbor-mnemonic">
              <span>围</span>
              <p>
                <strong>{selectedNeighborProvince?.shortName}有 {selectedNeighborCodes.length} 个陆地邻省</strong>
                {selectedNeighborCodes.map((code) => provinceByCode.get(code)?.shortName).filter(Boolean).join("、") || "孤悬海上，记作零邻省"}
              </p>
            </div>
          </section>
        </div>
      );
    }

    if (activeCategoryId === "city-counts") {
      const sortedCounts = [...PROVINCE_CITY_COUNT_DATA].sort(
        (left, right) => right.cityCount - left.cityCount || left.code.localeCompare(right.code),
      );
      const maxCount = Math.max(...sortedCounts.map((item) => item.cityCount));
      return (
        <div className="knowledge-count-layout">
          <div className="knowledge-memory-banner is-gold">
            <span>数</span>
            <div>
              <strong>先记两端，再记密集区</strong>
              <p>广东 21 居首；港澳按现行行政区划口径计 0。相同数量的省份可以成组记。</p>
            </div>
          </div>
          <ol className="knowledge-count-ranking">
            {sortedCounts.map((item, index) => (
              <li key={item.code}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{item.shortName}</strong>
                <div aria-hidden="true"><i style={{ width: `${Math.max((item.cityCount / maxCount) * 100, 2)}%` }} /></div>
                <b>{item.cityCount}<small>座</small></b>
                <p>{item.explanation}</p>
              </li>
            ))}
          </ol>
        </div>
      );
    }

    if (activeCategoryId === "rivers") {
      return (
        <div className="knowledge-river-list">
          {RIVER_KNOWLEDGE.map((river) => (
            <article className={`knowledge-river-card is-${river.id}`} key={river.id}>
              <header>
                <div>
                  <p>{river.label}</p>
                  <h3>{river.name}</h3>
                </div>
                <dl>
                  <div><dt>源头</dt><dd>{river.source}</dd></div>
                  <div><dt>入海</dt><dd>{river.mouth}</dd></div>
                  <div><dt>长度</dt><dd>{river.length}</dd></div>
                </dl>
              </header>
              <section className="river-mnemonic">
                <span>口诀</span>
                <strong>{river.mnemonic}</strong>
              </section>
              <div
                className="river-route"
                aria-label={`${river.name}干流流经省级行政区顺序`}
                style={{ "--river-stop-count": river.provinceCodes.length } as CSSProperties}
              >
                {river.provinceCodes.map((code, index) => (
                  <div key={code}>
                    <span>{index + 1}</span>
                    <strong>{provinceByCode.get(code)?.shortName}</strong>
                  </div>
                ))}
              </div>
              <div className="river-cities">
                <span>代表城市节点（非完整名录）</span>
                <p>{river.representativeCities.join(" · ")}</p>
              </div>
              <a href={river.sourceUrl} target="_blank" rel="noreferrer">资料来源：{river.sourceLabel} ↗</a>
            </article>
          ))}
        </div>
      );
    }

    if (activeCategoryId === "territory") {
      const groups = [...provinceGroups, YELLOW_RIVER_PROVINCE_GROUP];
      const memoryTips = [
        "海岸线从辽宁一路向南串到海南，再补上津冀沪、台港澳",
        "东北四省区 + 西北三省区 + 西南两省区",
        "青藏川滇渝，鄂湘赣皖苏沪",
        "青川甘宁内蒙古，陕晋豫鲁",
      ];
      return (
        <div className="knowledge-territory-grid">
          {groups.map((group, groupIndex) => (
            <article key={group.title}>
              <header>
                <span>{String(groupIndex + 1).padStart(2, "0")}</span>
                <div><h3>{group.title}</h3><p>{group.description}</p></div>
              </header>
              <div className="territory-province-cloud">
                {group.codes.map((code) => (
                  <span key={code}>
                    {provinceByCode.get(code)?.shortName}
                  </span>
                ))}
              </div>
              <p className="territory-memory-tip"><b>记忆抓手</b>{memoryTips[groupIndex]}</p>
            </article>
          ))}
        </div>
      );
    }

    if (activeCategoryId === "confusable") {
      const filteredPairs = CONFUSABLE_CITY_PAIRS.filter((pair) =>
        matchesSearch(
          normalizedQuery,
          pair.left.city,
          pair.left.province,
          pair.right.city,
          pair.right.province,
          pair.memoryTip,
        ),
      );
      if (filteredPairs.length === 0) {
        return <KnowledgeSearchEmpty query={query} />;
      }
      return (
        <div className="knowledge-confusable-grid">
          {filteredPairs.map((pair, index) => (
            <article key={`${pair.left.city}-${pair.right.city}`}>
              <header><span>辨析 {String(index + 1).padStart(2, "0")}</span><b>VS</b></header>
              <div>
                {[pair.left, pair.right].map((city) => (
                  <section key={`${city.province}-${city.city}`}>
                    <span>{plainPlaceName(city.city).slice(0, 1)}</span>
                    <h3>{plainPlaceName(city.city)}</h3>
                    <p>{city.provinceShort}</p>
                  </section>
                ))}
              </div>
              <p><b>记忆钩子</b>{pair.memoryTip}</p>
            </article>
          ))}
        </div>
      );
    }

    return (
      <div className="knowledge-reading-layout">
        <section className="knowledge-reading-intro">
          <span>读图五步法</span>
          <h3>大范围 → 小范围<br />位置 → 边界 → 路线</h3>
          <p>地图题不是只靠死记轮廓。把观察顺序固定下来，陌生题也能用排除法解决。</p>
          <button type="button" onClick={onOpenAtlas}>打开全国车牌图鉴练读图</button>
        </section>
        <ol className="knowledge-tip-list">
          {MAP_READING_TIPS.map((tip, index) => (
            <li key={tip.mark}>
              <span>{tip.mark}</span>
              <div>
                <small>第 {index + 1} 步</small>
                <h3>{tip.title}</h3>
                <p>{tip.detail}</p>
                <strong>{tip.mnemonic}</strong>
              </div>
            </li>
          ))}
        </ol>
      </div>
    );
  };

  return (
    <main className="knowledge-shell">
      <header className="knowledge-header">
        <button className="knowledge-brand" type="button" onClick={backToCatalog}>
          <span aria-hidden="true">知</span>
          <div>
            <p>CHINA GEO KNOWLEDGE</p>
            <h1>中国地理知识馆</h1>
          </div>
        </button>
        <div className="knowledge-header-actions">
          {activeCategory ? (
            <button type="button" onClick={backToCatalog}>← 返回分类</button>
          ) : null}
          <button className="knowledge-exit" type="button" onClick={onExit}>返回游戏</button>
        </div>
      </header>

      {!activeCategory ? (
        <KnowledgeCatalog onOpenCategory={openCategory} />
      ) : (
        <>
          <section className={`knowledge-detail-hero is-${activeCategory.tone}`}>
            <span aria-hidden="true">{activeCategory.icon}</span>
            <div>
              <p>{activeCategory.memoryStyle} · {CATEGORY_TOTAL_LABELS[activeCategory.id]}</p>
              <h2>{activeCategory.title}</h2>
              <strong>{activeCategory.subtitle}</strong>
              <div>{activeCategory.levelRefs.map((levelId) => {
                const levelNumber = gauntletLevelNumber(levelId);
                return levelNumber > 0
                  ? <i key={levelId}>关联第 {levelNumber} 关</i>
                  : null;
              })}</div>
            </div>
            {SEARCHABLE_CATEGORIES.has(activeCategory.id) ? (
              <label className="knowledge-search">
                <span>搜索本专题</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="输入省份、城市、车牌或学校"
                  type="search"
                />
              </label>
            ) : null}
          </section>
          <section className="knowledge-detail-content">{renderDetailContent()}</section>
          <footer className="knowledge-page-footer">
            <button type="button" onClick={backToCatalog}>← 继续浏览其他知识专题</button>
            <span>知识来自当前关卡题库及注明的权威公开资料</span>
          </footer>
        </>
      )}
    </main>
  );
}
