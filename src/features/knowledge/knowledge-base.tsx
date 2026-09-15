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
        <div className="knowledge-neighbor-layout grid grid-cols-[280px_1fr] gap-5 max-lg:grid-cols-1">
          <aside className="rounded-2xl bg-card p-5">
            <p className="mt-0 font-black">选择中心省份</p>
            <div className="knowledge-province-selector grid grid-cols-4 gap-2">
              {provinces.map((province) => (
                <button
                  key={province.code}
                  type="button"
                  className={`cursor-pointer rounded-lg border border-black/10 p-2 text-xs ${province.code === selectedNeighborProvince?.code ? "is-active bg-[#735285] text-white" : "bg-white"}`}
                  onClick={() => setSelectedNeighborCode(province.code)}
                >
                  {province.shortName}
                </button>
              ))}
            </div>
          </aside>
          <section className="knowledge-neighbor-stage rounded-2xl bg-card p-6">
            <div className="neighbor-orbit" aria-label={`${selectedNeighborProvince?.name}的陆地邻省`}>
              <article className="neighbor-center mx-auto grid size-40 place-items-center rounded-full bg-[#735285] text-center text-white [&_h3]:m-0">
                <span>{provincePlatePrefixes[selectedNeighborProvince?.code]}</span>
                <h3>{selectedNeighborProvince?.shortName}</h3>
                <p>{plainPlaceName(provinceCapitals[selectedNeighborProvince?.code])}</p>
              </article>
              <div className="neighbor-satellites mt-5 grid grid-cols-4 gap-2 max-sm:grid-cols-2">
                {selectedNeighborCodes.length > 0 ? selectedNeighborCodes.map((code, index) => {
                  const neighbor = provinceByCode.get(code);
                  if (!neighbor) return null;
                  return (
                    <button
                      key={code}
                      className="rounded-xl border border-black/10 bg-paper p-3"
                      type="button"
                      onClick={() => setSelectedNeighborCode(code)}
                    >
                      <span>{index + 1}</span>
                      <strong>{neighbor.shortName}</strong>
                      <small>{plainPlaceName(provinceCapitals[code])}</small>
                    </button>
                  );
                }) : (
                  <p className="knowledge-empty-note text-sm text-ink-soft">没有陆地相邻的省级行政区</p>
                )}
              </div>
            </div>
            <div className="knowledge-neighbor-mnemonic mt-5 flex items-center gap-3 rounded-xl bg-[#735285]/10 p-4 text-sm">
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
          <div className="knowledge-memory-banner is-gold mb-5 flex items-center gap-4 rounded-2xl bg-brand-gold/20 p-5">
            <span className="grid size-12 place-items-center rounded-full bg-brand-gold font-black">数</span>
            <div>
              <strong>先记两端，再记密集区</strong>
              <p className="mb-0 text-xs text-ink-soft">广东 21 居首；港澳按现行行政区划口径计 0。相同数量的省份可以成组记。</p>
            </div>
          </div>
          <ol className="knowledge-count-ranking m-0 grid list-none gap-2 p-0">
            {sortedCounts.map((item, index) => (
              <li className="grid grid-cols-[40px_80px_1fr_65px] items-center gap-3 rounded-xl bg-card p-3 max-sm:grid-cols-[30px_50px_1fr_55px]" key={item.code}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{item.shortName}</strong>
                <div className="h-2 overflow-hidden rounded-full bg-black/10" aria-hidden="true"><i className="block h-full bg-[#735285]" style={{ width: `${Math.max((item.cityCount / maxCount) * 100, 2)}%` }} /></div>
                <b>{item.cityCount}<small>座</small></b>
                <p className="col-span-full m-0 text-xs text-ink-soft">{item.explanation}</p>
              </li>
            ))}
          </ol>
        </div>
      );
    }

    if (activeCategoryId === "rivers") {
      return (
        <div className="knowledge-river-list grid gap-5">
          {RIVER_KNOWLEDGE.map((river) => (
            <article className={`knowledge-river-card is-${river.id} rounded-[20px_20px_20px_6px] bg-card p-6 shadow-sm`} key={river.id}>
              <header className="flex justify-between gap-5 max-md:block">
                <div>
                  <p>{river.label}</p>
                  <h3 className="mt-1 text-3xl font-black">{river.name}</h3>
                </div>
                <dl className="flex gap-4 [&_dd]:m-0 [&_dd]:text-xs [&_dd]:font-bold [&_dt]:text-[9px] [&_dt]:text-ink-soft">
                  <div><dt>源头</dt><dd>{river.source}</dd></div>
                  <div><dt>入海</dt><dd>{river.mouth}</dd></div>
                  <div><dt>长度</dt><dd>{river.length}</dd></div>
                </dl>
              </header>
              <section className="river-mnemonic rounded-xl bg-[#735285]/10 p-4">
                <span>口诀</span>
                <strong>{river.mnemonic}</strong>
              </section>
              <div
                className="river-route my-5 flex flex-wrap gap-2 [&>div]:rounded-full [&>div]:bg-paper [&>div]:px-3 [&>div]:py-2"
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
              <div className="river-cities text-xs text-ink-soft">
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
        <div className="knowledge-territory-grid grid grid-cols-2 gap-4 max-md:grid-cols-1">
          {groups.map((group, groupIndex) => (
            <article className="rounded-2xl bg-card p-5" key={group.title}>
              <header className="flex gap-3">
                <span>{String(groupIndex + 1).padStart(2, "0")}</span>
                <div><h3>{group.title}</h3><p>{group.description}</p></div>
              </header>
              <div className="territory-province-cloud flex flex-wrap gap-2">
                {group.codes.map((code) => (
                  <span className="rounded-full bg-[#735285]/10 px-3 py-2" key={code}>
                    {provinceByCode.get(code)?.shortName}
                  </span>
                ))}
              </div>
              <p className="territory-memory-tip text-xs leading-5 text-ink-soft"><b>记忆抓手</b>{memoryTips[groupIndex]}</p>
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
        <div className="knowledge-confusable-grid grid grid-cols-3 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {filteredPairs.map((pair, index) => (
            <article className="rounded-2xl bg-card p-5" key={`${pair.left.city}-${pair.right.city}`}>
              <header className="flex justify-between"><span>辨析 {String(index + 1).padStart(2, "0")}</span><b>VS</b></header>
              <div className="grid grid-cols-2 gap-2">
                {[pair.left, pair.right].map((city) => (
                  <section className="rounded-xl bg-paper p-3" key={`${city.province}-${city.city}`}>
                    <span>{plainPlaceName(city.city).slice(0, 1)}</span>
                    <h3 className="mb-1 text-xl">{plainPlaceName(city.city)}</h3>
                    <p className="text-xs text-ink-soft">{city.provinceShort}</p>
                  </section>
                ))}
              </div>
              <p className="text-xs text-ink-soft"><b>记忆钩子</b>{pair.memoryTip}</p>
            </article>
          ))}
        </div>
      );
    }

    return (
      <div className="knowledge-reading-layout grid grid-cols-[minmax(260px,.7fr)_1.3fr] gap-5 max-lg:grid-cols-1">
        <section className="knowledge-reading-intro rounded-2xl bg-[#735285] p-7 text-white">
          <span>读图五步法</span>
          <h3 className="text-3xl">大范围 → 小范围<br />位置 → 边界 → 路线</h3>
          <p>地图题不是只靠死记轮廓。把观察顺序固定下来，陌生题也能用排除法解决。</p>
          <button className="cursor-pointer rounded-full border-0 bg-white px-4 py-3 font-black text-[#735285]" type="button" onClick={onOpenAtlas}>打开全国车牌图鉴练读图</button>
        </section>
        <ol className="knowledge-tip-list m-0 grid list-none gap-3 p-0">
          {MAP_READING_TIPS.map((tip, index) => (
            <li className="flex gap-4 rounded-2xl bg-card p-5" key={tip.mark}>
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#735285] font-black text-white">{tip.mark}</span>
              <div>
                <small>第 {index + 1} 步</small>
                <h3 className="m-0">{tip.title}</h3>
                <p className="text-xs text-ink-soft">{tip.detail}</p>
                <strong>{tip.mnemonic}</strong>
              </div>
            </li>
          ))}
        </ol>
      </div>
    );
  };

  return (
    <main className="knowledge-shell min-h-dvh bg-[#f1ece1] text-ink">
      <header className="knowledge-header sticky top-0 z-40 flex min-h-[78px] items-center justify-between gap-6 border-b border-black/10 bg-card/95 px-[max(24px,calc((100vw_-_1380px)/2))] py-3 shadow-sm backdrop-blur-xl max-sm:px-3">
        <button className="knowledge-brand flex cursor-pointer items-center gap-3 border-0 bg-transparent p-0 text-left" type="button" onClick={backToCatalog}>
          <span className="grid size-12 place-items-center rounded-[14px_14px_14px_5px] bg-[#735285] text-xl font-black text-white max-sm:size-10" aria-hidden="true">知</span>
          <div>
            <p className="m-0 text-[8px] font-black tracking-[0.16em] text-[#817588] max-sm:hidden">CHINA GEO KNOWLEDGE</p>
            <h1 className="m-0 text-xl font-black max-sm:text-base">中国地理知识馆</h1>
          </div>
        </button>
        <div className="knowledge-header-actions flex gap-2 [&>button]:min-h-10 [&>button]:cursor-pointer [&>button]:rounded-full [&>button]:border [&>button]:border-black/20 [&>button]:bg-white [&>button]:px-3.5 [&>button]:text-[10px] [&>button]:font-black">
          {activeCategory ? (
            <button type="button" onClick={backToCatalog}>← 返回分类</button>
          ) : null}
          <button className="knowledge-exit !border-brand-red-dark !bg-brand-red-dark !text-white" type="button" onClick={onExit}>返回游戏</button>
        </div>
      </header>

      {!activeCategory ? (
        <KnowledgeCatalog onOpenCategory={openCategory} />
      ) : (
        <>
          <section className={`knowledge-detail-hero is-${activeCategory.tone} mx-auto my-10 grid w-[min(1380px,calc(100%_-_48px))] grid-cols-[auto_1fr_auto] items-center gap-6 rounded-[24px_24px_24px_8px] bg-[#735285] p-8 text-white shadow-xl max-md:grid-cols-[auto_1fr] max-sm:w-[calc(100%_-_24px)] max-sm:p-5`}>
            <span className="grid size-16 place-items-center rounded-2xl bg-white/15 text-3xl" aria-hidden="true">{activeCategory.icon}</span>
            <div>
              <p className="m-0 text-[10px] font-black">{activeCategory.memoryStyle} · {CATEGORY_TOTAL_LABELS[activeCategory.id]}</p>
              <h2 className="my-1 text-4xl font-black">{activeCategory.title}</h2>
              <strong className="text-sm">{activeCategory.subtitle}</strong>
              <div>{activeCategory.levelRefs.map((levelId) => {
                const levelNumber = gauntletLevelNumber(levelId);
                return levelNumber > 0
                  ? <i className="mr-2 mt-2 inline-flex rounded-full bg-white/15 px-2 py-1 text-[9px] not-italic" key={levelId}>关联第 {levelNumber} 关</i>
                  : null;
              })}</div>
            </div>
            {SEARCHABLE_CATEGORIES.has(activeCategory.id) ? (
              <label className="knowledge-search grid gap-1.5 max-md:col-span-2">
                <span className="text-[9px] font-black">搜索本专题</span>
                <input
                  className="min-h-11 w-64 rounded-xl border border-white/25 bg-white/95 px-3 text-ink outline-none max-md:w-full"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="输入省份、城市、车牌或学校"
                  type="search"
                />
              </label>
            ) : null}
          </section>
          <section className="knowledge-detail-content mx-auto min-h-[50vh] w-[min(1380px,calc(100%_-_48px))] pb-12 max-sm:w-[calc(100%_-_24px)]">{renderDetailContent()}</section>
          <footer className="knowledge-page-footer mx-auto flex w-[min(1380px,calc(100%_-_48px))] items-center justify-between gap-4 border-t border-black/10 py-8 max-sm:w-[calc(100%_-_24px)] max-sm:flex-col">
            <button className="cursor-pointer rounded-full border-0 bg-[#735285] px-4 py-3 font-black text-white" type="button" onClick={backToCatalog}>← 继续浏览其他知识专题</button>
            <span className="text-[10px] text-ink-soft">知识来自当前关卡题库及注明的权威公开资料</span>
          </footer>
        </>
      )}
    </main>
  );
}
