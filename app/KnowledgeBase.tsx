"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { CONFUSABLE_CITY_PAIRS } from "./confusable-city-data";
import {
  CITY_PLATE_PREFIX_COUNT,
  CITY_QUIZ_DATA,
  MULTI_PLATE_CITY_COUNT,
} from "./gauntlet-data";
import {
  KNOWLEDGE_CATEGORIES,
  MAP_READING_TIPS,
  RIVER_KNOWLEDGE,
  type KnowledgeCategoryId,
} from "./knowledge-data";
import { getProvinceAdministrativeProfile } from "./province-administrative-profile-data";
import { PROVINCE_CITY_COUNT_DATA } from "./province-city-count-data";
import { UNIVERSITY_QUIZ_DATA } from "./university-data";

type KnowledgeProvince = {
  code: string;
  name: string;
  shortName: string;
  kind: "省" | "自治区" | "直辖市" | "特别行政区";
};

type ProvinceGroup = {
  title: string;
  description: string;
  codes: string[];
};

type KnowledgeBaseProps = {
  provinces: KnowledgeProvince[];
  provinceCapitals: Record<string, string>;
  provinceNeighbors: Record<string, string[]>;
  provincePlatePrefixes: Record<string, string>;
  provinceGroups: ProvinceGroup[];
  onExit: () => void;
  onOpenAtlas: () => void;
};

const SEARCHABLE_CATEGORIES = new Set<KnowledgeCategoryId>([
  "city-plate",
  "universities",
  "confusable",
]);

const CATEGORY_TOTAL_LABELS: Partial<Record<KnowledgeCategoryId, string>> = {
  "province-profile": "34 张名片",
  "city-plate": `${CITY_PLATE_PREFIX_COUNT} 个前缀`,
  universities: `${UNIVERSITY_QUIZ_DATA.length} 所名校`,
  neighbors: "34 省关系",
  "city-counts": "34 项数据",
  rivers: "2 条大河",
  territory: "4 组集合",
  confusable: `${CONFUSABLE_CITY_PAIRS.length} 组辨析`,
  "map-reading": `${MAP_READING_TIPS.length} 个诀窍`,
};

function compactSearch(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "").replace(/臺/g, "台");
}

function matchesSearch(query: string, ...values: Array<string | number | undefined>) {
  if (!query) return true;
  return values.some((value) => compactSearch(String(value ?? "")).includes(query));
}

function plainPlaceName(value: string) {
  return value.replace(/(壮族自治区|回族自治区|维吾尔自治区|特别行政区|自治区|省|市)$/u, "");
}

function KnowledgeSearchEmpty({ query }: { query: string }) {
  return (
    <div className="knowledge-search-empty" role="status">
      <span aria-hidden="true">寻</span>
      <strong>没有找到“{query}”</strong>
      <p>可以试试省份简称、完整城市名、车牌前缀或学校名称。</p>
    </div>
  );
}

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
      result.set(item.province, (result.get(item.province) ?? 0) + 1);
    });
    return result;
  }, []);
  const universityCountByProvince = useMemo(() => {
    const result = new Map<string, number>();
    UNIVERSITY_QUIZ_DATA.forEach((item) => {
      result.set(item.province, (result.get(item.province) ?? 0) + 1);
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

  const toggleProvince = (provinceCode: string) => {
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

  const filteredCities = CITY_QUIZ_DATA.filter((item) =>
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
      items: filteredCities.filter((item) => item.province === province.name),
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
      items: filteredUniversities.filter((item) => item.province === province.name),
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
        <div className="knowledge-stack">
          <section className="knowledge-province-filter" aria-label="筛选省份名片">
            <header>
              <label>
                <span>按名称检索</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="输入省份全称或简称"
                  type="search"
                />
              </label>
              <div>
                <strong aria-live="polite">显示 {filteredProvinces.length} / {provinces.length}</strong>
                {query || selectedProvinceCodes.size > 0 ? (
                  <button type="button" onClick={clearProvinceFilters}>清除筛选</button>
                ) : null}
              </div>
            </header>
            <p className="knowledge-province-filter-hint">点击省份可多选，未选择时显示全部</p>
            <div className="knowledge-province-tags" role="group" aria-label="按省份多选">
              {provinces.map((province) => {
                const isSelected = selectedProvinceCodes.has(province.code);
                return (
                  <button
                    key={province.code}
                    type="button"
                    className={isSelected ? "is-selected" : undefined}
                    aria-pressed={isSelected}
                    title={province.name}
                    onClick={() => toggleProvince(province.code)}
                  >
                    {province.shortName}
                  </button>
                );
              })}
            </div>
          </section>
          <div className="knowledge-profile-guide">
            <span aria-hidden="true">总</span>
            <div>
              <strong>城市数和综合总量要分开记</strong>
              <p>综合总量加入州、地区、盟、省直辖单位等；新区、示范区按独立号牌学习单元纳入，不改变统计年鉴的城市数。</p>
            </div>
          </div>
          {filteredProvinces.length === 0 ? (
            <KnowledgeSearchEmpty query={query} />
          ) : (
            <div className="knowledge-profile-grid">
              {filteredProvinces.map((province, index) => {
                const cityCount = cityCountByCode.get(province.code);
                const cityTotal = cityCount?.cityCount ?? 0;
                const administrativeProfile = administrativeProfileByCode.get(province.code)
                  ?? getProvinceAdministrativeProfile(province.code, cityTotal);
                const specialUnitCount = administrativeProfile.categories.reduce(
                  (total, item) => total + item.count,
                  0,
                );
                const quizCount = quizCityCountByProvince.get(province.name) ?? 0;
                const universityCount = universityCountByProvince.get(province.name) ?? 0;
                return (
                  <article className="knowledge-profile-card" key={province.code}>
                    <div className="knowledge-profile-head">
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <div>
                        <h3>{province.name}</h3>
                        <p>{province.kind}</p>
                      </div>
                      <b>{provincePlatePrefixes[province.code]}</b>
                    </div>
                    <dl>
                      <div><dt>行政中心</dt><dd>{plainPlaceName(provinceCapitals[province.code])}</dd></div>
                      <div><dt>城市数量</dt><dd>{cityCount?.cityCount ?? "—"}</dd></div>
                      <div><dt>特殊单位</dt><dd>{specialUnitCount || 0}</dd></div>
                      <div className="is-total"><dt>综合总量</dt><dd>{administrativeProfile.totalUnitCount}</dd></div>
                      <div><dt>陆地邻省</dt><dd>{provinceNeighbors[province.code]?.length ?? 0}</dd></div>
                      <div><dt>独立号牌</dt><dd>{administrativeProfile.plateRegions.length || "—"}</dd></div>
                    </dl>
                    <div className="knowledge-region-categories" aria-label={`${province.name}行政区域分类`}>
                      <span><b>{cityTotal}</b> 地级及以上城市</span>
                      {administrativeProfile.categories.map((item) => (
                        <span key={`${province.code}-${item.label}`}><b>{item.count}</b> {item.label}</span>
                      ))}
                    </div>
                    {administrativeProfile.plateRegions.length > 0 ? (
                      <section className="knowledge-special-regions">
                        <header>
                          <strong>特殊车牌辖区</strong>
                          <small>{administrativeProfile.plateRegions.length} 组</small>
                        </header>
                        <div>
                          {administrativeProfile.plateRegions.map((item) => (
                            <article key={`${province.code}-${item.plate}-${item.name}`}>
                              <span>
                                <strong>{item.name}</strong>
                                <small>{item.type}</small>
                                {item.note ? <em>{item.note}</em> : null}
                              </span>
                              <b>{item.plate}</b>
                            </article>
                          ))}
                        </div>
                      </section>
                    ) : (
                      <p className="knowledge-no-special-region">
                        {administrativeProfile.note ?? "无城市口径外的独立车牌辖区"}
                      </p>
                    )}
                    {administrativeProfile.plateRegions.length > 0 && administrativeProfile.note ? (
                      <p className="knowledge-profile-note">{administrativeProfile.note}</p>
                    ) : null}
                    <p className="knowledge-card-note">
                      {universityCount > 0
                        ? `名校专题收录 ${universityCount} 所 · 车牌题库 ${quizCount || 0} 组`
                        : `简称印章：${provincePlatePrefixes[province.code]} · 车牌题库 ${quizCount || 0} 组`}
                    </p>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    if (activeCategoryId === "city-plate") {
      if (cityGroups.length === 0) {
        return <KnowledgeSearchEmpty query={query} />;
      }
      return (
        <div className="knowledge-stack">
          <div className="knowledge-memory-banner">
            <span>记</span>
            <div>
              <strong>先看汉字锁定省，再把同城全部字母成套记住</strong>
              <p>
                按含历史、区域沿用号段的广义口径，共收录 {MULTI_PLATE_CITY_COUNT} 座多号牌城市；高亮卡片会列出全部前缀和形成原因，关卡中必须全部答出。
              </p>
            </div>
            <button type="button" onClick={onOpenAtlas}>去全国图鉴看地图</button>
          </div>
          <div className="knowledge-group-list">
            {cityGroups.map(({ province, items }) => {
              const plateCount = items.reduce(
                (total, item) => total + item.plates.length,
                0,
              );
              const multiPlateCount = items.filter(
                (item) => item.plates.length > 1,
              ).length;
              return (
                <section className="knowledge-city-group" key={province.code}>
                <header>
                  <b>{provincePlatePrefixes[province.code]}</b>
                  <div>
                    <h3>{province.shortName}车牌组</h3>
                    <p>
                      {items.length} 座城市 · {plateCount} 个前缀
                      {multiPlateCount > 0 ? ` · ${multiPlateCount} 座多号牌城市` : ""}
                      {` · 行政中心 ${plainPlaceName(provinceCapitals[province.code])}`}
                    </p>
                  </div>
                </header>
                <div className="knowledge-plate-grid">
                  {items.map((item) => (
                    <article
                      className={item.plates.length > 1 ? "is-multi-plate" : undefined}
                      key={`${item.province}-${item.city}`}
                    >
                      <span>
                        {plainPlaceName(item.city)}
                        {item.plates.length > 1 ? (
                          <em>{item.plates.length === 2 ? "双号牌" : `${item.plates.length} 号牌`}</em>
                        ) : null}
                      </span>
                      <strong>{item.plate}</strong>
                      {item.plateNote ? <small>{item.plateNote}</small> : null}
                    </article>
                  ))}
                </div>
              </section>
              );
            })}
          </div>
        </div>
      );
    }

    if (activeCategoryId === "universities") {
      if (universityGroups.length === 0) {
        return <KnowledgeSearchEmpty query={query} />;
      }
      return (
        <div className="knowledge-stack">
          <div className="knowledge-memory-banner is-purple">
            <span>学</span>
            <div>
              <strong>不要逐所散记：先记“名校城市群”</strong>
              <p>北京、上海、南京、武汉、西安、成都等城市聚集较多，再补上每省的单点学校。</p>
            </div>
            <a
              href="https://www.moe.gov.cn/srcsite/A22/s7065/200512/t20051223_82762.html"
              target="_blank"
              rel="noreferrer"
            >教育部名单来源</a>
          </div>
          <div className="knowledge-university-list">
            {universityGroups.map(({ province, items }) => (
              <section key={province.code}>
                <header>
                  <div>
                    <p>{province.kind}</p>
                    <h3>{province.shortName}</h3>
                  </div>
                  <strong>{items.length}<small>所</small></strong>
                </header>
                <div>
                  {items.map((item) => (
                    <article key={`${item.province}-${item.name}`}>
                      <span className={`university-tier is-${item.tier}`}>{item.tier}</span>
                      <div>
                        <h4>{item.name}</h4>
                        <p><b>{plainPlaceName(item.city)}</b>{item.note ? ` · ${item.note}` : ""}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      );
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
      const yellowRiverGroup: ProvinceGroup = {
        title: "黄河干流流经省级行政区",
        description: "从青海出发，经过9个省区后在山东注入渤海",
        codes: RIVER_KNOWLEDGE.find((river) => river.id === "yellow")?.provinceCodes ?? [],
      };
      const groups = [...provinceGroups, yellowRiverGroup];
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
        <>
          <section className="knowledge-home-hero">
            <div>
              <p className="eyebrow">把答案串成真正记得住的知识</p>
              <h2>先理解，再挑战。<br /><span>让每个答案都有位置。</span></h2>
              <p>覆盖全部关卡会用到的省份、城市、车牌、名校、邻省和疆域知识，并加入长江黄河、易混城市与读图方法。</p>
            </div>
            <div className="knowledge-coverage-card">
              <span>关卡知识覆盖</span>
              <strong>26<small>/26</small></strong>
              <div><i /></div>
              <p>错题复仇赛与终极混战，会复用前面专题中的知识。</p>
            </div>
          </section>

          <section className="knowledge-stat-strip" aria-label="知识库收录概况">
            <div><strong>34</strong><span>省级行政区</span></div>
            <div><strong>{CITY_PLATE_PREFIX_COUNT}</strong><span>车牌前缀</span></div>
            <div><strong>{UNIVERSITY_QUIZ_DATA.length}</strong><span>985 · 211 高校</span></div>
            <div><strong>{CONFUSABLE_CITY_PAIRS.length}</strong><span>易混城市组</span></div>
          </section>

          <section className="knowledge-catalog" aria-labelledby="knowledge-catalog-title">
            <div className="knowledge-section-heading">
              <div><p className="eyebrow">选择一个专题</p><h2 id="knowledge-catalog-title">九种记忆方式，建立一张知识网</h2></div>
              <p>每张卡片都标明关联关卡，学完可以直接回游戏验证。</p>
            </div>
            <div className="knowledge-category-grid">
              {KNOWLEDGE_CATEGORIES.map((category, index) => (
                <button
                  className={`knowledge-category-card is-${category.tone}`}
                  key={category.id}
                  type="button"
                  onClick={() => openCategory(category.id)}
                >
                  <span className="knowledge-category-number">{String(index + 1).padStart(2, "0")}</span>
                  <b aria-hidden="true">{category.icon}</b>
                  <div>
                    <p>{category.memoryStyle} · {CATEGORY_TOTAL_LABELS[category.id]}</p>
                    <h3>{category.title}</h3>
                    <span>{category.subtitle}</span>
                  </div>
                  <footer>
                    <span>{category.levelRefs.map((level) => `第${level}关`).join(" · ")}</span>
                    <i>→</i>
                  </footer>
                </button>
              ))}
            </div>
          </section>
        </>
      ) : (
        <>
          <section className={`knowledge-detail-hero is-${activeCategory.tone}`}>
            <span aria-hidden="true">{activeCategory.icon}</span>
            <div>
              <p>{activeCategory.memoryStyle} · {CATEGORY_TOTAL_LABELS[activeCategory.id]}</p>
              <h2>{activeCategory.title}</h2>
              <strong>{activeCategory.subtitle}</strong>
              <div>{activeCategory.levelRefs.map((level) => <i key={level}>关联第 {level} 关</i>)}</div>
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
