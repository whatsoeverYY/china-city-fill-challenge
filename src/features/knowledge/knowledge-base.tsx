"use client";

import { CONFUSABLE_CITY_PAIRS } from "@/domain/geography/data/confusable-cities";
import {
  RIVER_ID,
  RIVER_KNOWLEDGE,
  YELLOW_RIVER_PROVINCE_GROUP,
} from "@/domain/geography/data/geographic-groups";
import {
  MAP_READING_TIPS,
} from "@/features/knowledge/data/knowledge-data";
import { gauntletLevelNumber } from "@/domain/game/gauntlet-levels";
import { PROVINCE_CITY_COUNT_DATA } from "@/domain/geography/data/province-city-counts";
import CityPlatePanel from "@/features/knowledge/components/city-plate-panel";
import KnowledgeCatalog from "@/features/knowledge/components/knowledge-catalog";
import KnowledgeSearchEmpty from "@/features/knowledge/components/knowledge-search-empty";
import ProvinceProfilePanel from "@/features/knowledge/components/province-profile-panel";
import UniversityPanel from "@/features/knowledge/components/university-panel";
import { matchesSearch, plainPlaceName } from "@/features/knowledge/model/knowledge-format";
import type {
  KnowledgeBaseProps,
} from "@/features/knowledge/model/knowledge-types";
import {
  CATEGORY_TOTAL_LABELS,
  SEARCHABLE_CATEGORIES,
} from "@/features/knowledge/config/knowledge-catalog-config";
import {
  DETAIL_TONE_CLASSES,
  RIVER_TONE_CLASSES,
} from "@/features/knowledge/config/knowledge-tone-style";
import { useKnowledgeCatalog } from "@/features/knowledge/model/use-knowledge-catalog";


export default function KnowledgeBase({
  provinces,
  provinceCapitals,
  provinceNeighbors,
  provincePlatePrefixes,
  provinceGroups,
  onExit,
  onOpenAtlas,
}: KnowledgeBaseProps) {
  const {
    activeCategory, activeCategoryId, administrativeProfileByCode, backToCatalog,
    cityCountByCode, cityGroups, clearProvinceFilters, filteredProvinces,
    hasActiveProvinceFilter, normalizedQuery, openCategory, provinceByCode,
    query, quizCityCountByProvince, selectedNeighborCodes, selectedNeighborProvince,
    selectedProvinceCodes, setQuery, setSelectedNeighborCode, setVisibleProfileCount,
    toggleProvince, universityCountByProvince, universityGroups, visibleProfileProvinces,
  } = useKnowledgeCatalog({ provinces, provinceNeighbors });

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
        <div className="knowledge-neighbor-layout grid min-h-[650px] grid-cols-[260px_minmax(0,1fr)] overflow-hidden rounded-[22px] border border-jade-500/20 bg-paper-100/85 max-lg:grid-cols-1">
          <aside className="border-r border-jade-500/15 bg-jade-200 px-5 py-6 max-lg:border-b max-lg:border-r-0">
            <p className="mb-3.5 mt-0 text-meta font-black tracking-[.1em] text-moss-500">选择中心省份</p>
            <div className="knowledge-province-selector grid grid-cols-3 gap-1.5 max-lg:grid-cols-6 max-sm:grid-cols-4">
              {provinces.map((province) => (
                <button
                  key={province.code}
                  type="button"
                  className={`min-h-[38px] cursor-pointer rounded-lg border px-2 py-1.5 text-meta ${province.code === selectedNeighborProvince?.code ? "border-jade-500 bg-jade-500 font-black text-white" : "border-jade-500/15 bg-white/55 text-ink-600"}`}
                  onClick={() => setSelectedNeighborCode(province.code)}
                >
                  {province.shortName}
                </button>
              ))}
            </div>
          </aside>
          <section className="knowledge-neighbor-stage grid place-content-center place-items-center gap-[34px] [background-image:radial-gradient(circle_at_center,rgba(45,125,95,.1),transparent_20rem),linear-gradient(rgba(53,66,56,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(53,66,56,.025)_1px,transparent_1px)] [background-size:auto,25px_25px,25px_25px] p-10 max-md:p-6">
            <div className="neighbor-orbit grid w-[min(740px,100%)] place-items-center gap-[30px]" aria-label={`${selectedNeighborProvince?.name}的陆地邻省`}>
              <article className="neighbor-center grid size-[155px] place-content-center place-items-center rounded-[50%_50%_50%_20%] border-[5px] border-double border-white/45 bg-jade-500 text-center text-white shadow-[0_20px_40px_rgba(23,84,62,.2)]">
                <span className="font-serif text-sm opacity-70">{provincePlatePrefixes[selectedNeighborProvince?.code]}</span>
                <h3 className="my-1 font-serif text-section">{selectedNeighborProvince?.shortName}</h3>
                <p className="m-0 text-meta opacity-80">{plainPlaceName(provinceCapitals[selectedNeighborProvince?.code])}</p>
              </article>
              <div className="neighbor-satellites flex flex-wrap justify-center gap-[9px]">
                {selectedNeighborCodes.length > 0 ? selectedNeighborCodes.map((code, index) => {
                  const neighbor = provinceByCode.get(code);
                  if (!neighbor) return null;
                  return (
                    <button
                      key={code}
                      className="grid min-w-[105px] grid-cols-[auto_1fr] items-center gap-x-2 gap-y-[3px] rounded-[11px] border border-jade-500/25 bg-paper-100/90 px-[11px] py-[9px] text-left transition hover:-translate-y-0.5 hover:border-jade-500"
                      type="button"
                      onClick={() => setSelectedNeighborCode(code)}
                    >
                      <span className="row-span-2 grid size-[22px] place-items-center rounded-full bg-jade-300 font-numeric text-meta text-jade-700">{index + 1}</span>
                      <strong className="text-[11px]">{neighbor.shortName}</strong>
                      <small className="text-meta text-stone-500">{plainPlaceName(provinceCapitals[code])}</small>
                    </button>
                  );
                }) : (
                  <p className="knowledge-empty-note text-sm text-ink-soft">没有陆地相邻的省级行政区</p>
                )}
              </div>
            </div>
            <div className="knowledge-neighbor-mnemonic flex w-[min(600px,100%)] items-center gap-[13px] rounded-[13px] border border-jade-500/20 bg-jade-200/90 px-[18px] py-3.5">
              <span className="grid size-9 place-items-center rounded-full bg-jade-500 font-serif text-white">围</span>
              <p className="m-0 grid gap-1 text-meta text-ink-600">
                <strong className="text-[11px] text-jade-700">{selectedNeighborProvince?.shortName}有 {selectedNeighborCodes.length} 个陆地邻省</strong>
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
        <div className="knowledge-count-layout grid gap-5">
          <div className="knowledge-memory-banner grid grid-cols-[50px_minmax(0,1fr)] items-center gap-4 rounded-[17px] border border-gold-700/20 bg-gold-300 px-5 py-[18px] text-gold-800">
            <span className="grid size-[50px] place-items-center rounded-[50%_50%_50%_15px] bg-current font-serif text-xl font-black text-white shadow-[inset_0_0_0_4px_rgba(255,255,255,.15)]">数</span>
            <div>
              <strong className="font-serif text-base">先记两端，再记密集区</strong>
              <p className="mb-0 mt-1 text-[10px] leading-[1.7] text-ink-600">广东 21 居首；港澳按现行行政区划口径计 0。相同数量的省份可以成组记。</p>
            </div>
          </div>
          <ol className="knowledge-count-ranking m-0 grid list-none gap-[7px] p-0">
            {sortedCounts.map((item, index) => (
              <li className="grid min-h-[58px] grid-cols-[34px_90px_minmax(100px,1fr)_55px_minmax(260px,.9fr)] items-center gap-[13px] rounded-[11px] border border-gold-700/15 bg-paper-100/85 px-3.5 py-2.5 max-lg:grid-cols-[34px_90px_minmax(100px,1fr)_55px] max-sm:grid-cols-[30px_50px_1fr_50px]" key={item.code}>
                <span className="font-numeric text-[10px] text-stone-500">{String(index + 1).padStart(2, "0")}</span>
                <strong className="font-serif text-[13px]">{item.shortName}</strong>
                <div className="h-2 overflow-hidden rounded-full bg-gold-300" aria-hidden="true"><i className="block h-full rounded-[inherit] bg-gradient-to-r from-gold-500 to-gold-700" style={{ width: `${Math.max((item.cityCount / maxCount) * 100, 2)}%` }} /></div>
                <b className="text-right font-numeric text-xl text-gold-800">{item.cityCount}<small className="ml-[3px] text-meta">座</small></b>
                <p className="m-0 text-meta text-stone-600 max-lg:col-span-full">{item.explanation}</p>
              </li>
            ))}
          </ol>
        </div>
      );
    }

    if (activeCategoryId === "rivers") {
      return (
        <div className="knowledge-river-list grid gap-6">
          {RIVER_KNOWLEDGE.map((river) => {
            const tone = river.id === RIVER_ID.YELLOW
              ? RIVER_TONE_CLASSES.gold
              : RIVER_TONE_CLASSES.atlas;
            return (
            <article className={`knowledge-river-card overflow-hidden rounded-[22px] border p-7 ${tone.card}`} key={river.id}>
              <header className="flex items-end justify-between gap-[30px] max-md:block">
                <div>
                  <p className={`m-0 text-meta font-black tracking-[.12em] ${tone.text}`}>{river.label}</p>
                  <h3 className={`mb-0 mt-[5px] font-serif text-display ${tone.text}`}>{river.name}</h3>
                </div>
                <dl className="m-0 flex gap-[26px] max-sm:mt-4 max-sm:grid max-sm:grid-cols-3 max-sm:gap-2">
                  <div className="grid gap-[5px]"><dt className="text-meta text-stone-500">源头</dt><dd className="m-0 text-xs font-black">{river.source}</dd></div>
                  <div className="grid gap-[5px]"><dt className="text-meta text-stone-500">入海</dt><dd className="m-0 text-xs font-black">{river.mouth}</dd></div>
                  <div className="grid gap-[5px]"><dt className="text-meta text-stone-500">长度</dt><dd className="m-0 text-xs font-black">{river.length}</dd></div>
                </dl>
              </header>
              <section className={`river-mnemonic mt-[25px] flex items-center gap-[13px] rounded-xl border border-dashed px-4 py-[13px] ${tone.mnemonic}`}>
                <span className={`rounded-md px-[7px] py-1 text-meta font-black text-white ${tone.badge}`}>口诀</span>
                <strong className="font-serif text-[17px] tracking-[.08em]">{river.mnemonic}</strong>
              </section>
              <div
                className={`river-route relative mt-7 grid overflow-x-auto before:absolute before:left-[4%] before:right-[4%] before:top-5 before:h-1 before:rounded-full before:bg-gradient-to-r ${tone.route}`}
                aria-label={`${river.name}干流流经省级行政区顺序`}
                style={{ gridTemplateColumns: `repeat(${river.provinceCodes.length}, minmax(66px, 1fr))` }}
              >
                {river.provinceCodes.map((code, index) => (
                  <div className="z-[1] grid min-w-[66px] justify-items-center gap-[7px] px-[3px]" key={code}>
                    <span className={`grid size-[42px] place-items-center rounded-full border-[5px] border-paper-200 font-numeric text-meta text-white ${tone.marker}`}>{index + 1}</span>
                    <strong className="text-[10px]">{provinceByCode.get(code)?.shortName}</strong>
                  </div>
                ))}
              </div>
              <div className={`river-cities mt-6 flex items-baseline gap-[18px] border-t pt-[18px] ${tone.divider}`}>
                <span className="shrink-0 text-meta font-black text-stone-500">代表城市节点（非完整名录）</span>
                <p className="m-0 text-[10px] leading-[1.7] text-ink-600">{river.representativeCities.join(" · ")}</p>
              </div>
              <a className={`mt-3.5 inline-block text-meta font-extrabold no-underline ${tone.link}`} href={river.sourceUrl} target="_blank" rel="noreferrer">资料来源：{river.sourceLabel} ↗</a>
            </article>
            );
          })}
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
        <div className="knowledge-territory-grid grid grid-cols-2 gap-[15px] max-md:grid-cols-1">
          {groups.map((group, groupIndex) => (
            <article className="grid min-h-[330px] content-start rounded-[19px] border border-jade-500/20 bg-paper-100/90 p-6 [background-image:radial-gradient(circle_at_100%_0%,rgba(45,125,95,.08),transparent_16rem)]" key={group.title}>
              <header className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-[13px]">
                <span className="font-numeric text-[11px] font-black text-jade-500">{String(groupIndex + 1).padStart(2, "0")}</span>
                <div><h3 className="m-0 font-serif text-card-title">{group.title}</h3><p className="mb-0 mt-1.5 text-meta text-ink-500">{group.description}</p></div>
              </header>
              <div className="territory-province-cloud mt-[25px] flex flex-wrap content-start gap-2">
                {group.codes.map((code) => (
                  <span className="rounded-full border border-jade-500/20 bg-jade-300 px-[11px] py-2 text-[10px] font-extrabold text-jade-700" key={code}>
                    {provinceByCode.get(code)?.shortName}
                  </span>
                ))}
              </div>
              <p className="territory-memory-tip mt-auto grid gap-[5px] border-t border-black/[.13] pt-[19px] text-meta text-ink-500"><b className="tracking-[.1em] text-jade-700">记忆抓手</b>{memoryTips[groupIndex]}</p>
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
        <div className="knowledge-confusable-grid grid grid-cols-3 gap-[13px] max-lg:grid-cols-2 max-sm:grid-cols-1">
          {filteredPairs.map((pair, index) => (
            <article className="rounded-[17px] border border-city-500/20 bg-paper-100/90 p-[18px]" key={pair.id}>
              <header className="mb-[13px] flex justify-between font-numeric text-meta text-stone-500"><span>辨析 {String(index + 1).padStart(2, "0")}</span><b className="text-xs text-city-500">VS</b></header>
              <div className="grid grid-cols-2 gap-2">
                {[pair.left, pair.right].map((city, sideIndex) => (
                  <section className={`grid min-h-[115px] place-content-center place-items-center rounded-xl border p-3.5 ${sideIndex === 0 ? "border-city-500/15 bg-clay-100" : "border-atlas-500/15 bg-atlas-200"}`} key={`${pair.id}:${sideIndex}`}>
                    <span className={`font-serif text-[10px] font-black ${sideIndex === 0 ? "text-city-500" : "text-atlas-500"}`}>{plainPlaceName(city.city).slice(0, 1)}</span>
                    <h3 className="mb-[3px] mt-1 font-serif text-lg">{plainPlaceName(city.city)}</h3>
                    <p className="m-0 text-meta font-extrabold text-ink-500">{city.provinceShort}</p>
                  </section>
                ))}
              </div>
              <p className="mb-0 mt-3 text-meta text-ink-500"><b className="mr-2 tracking-[.1em] text-city-900">记忆钩子</b>{pair.memoryTip}</p>
            </article>
          ))}
        </div>
      );
    }

    return (
      <div className="knowledge-reading-layout grid grid-cols-[minmax(260px,.48fr)_minmax(0,1fr)] gap-5 max-lg:grid-cols-1">
        <section className="knowledge-reading-intro sticky top-28 grid min-h-[440px] self-start content-center rounded-[23px_23px_23px_8px] bg-gold-800 [background-image:radial-gradient(circle_at_100%_0%,rgba(255,255,255,.16),transparent_16rem)] p-[26px] text-gold-100 shadow-[0_20px_44px_rgba(114,84,18,.18)] max-lg:static max-lg:min-h-0">
          <span className="text-meta font-black tracking-[.14em]">读图五步法</span>
          <h3 className="my-4 font-serif text-section">大范围 → 小范围<br />位置 → 边界 → 路线</h3>
          <p className="m-0 text-compact opacity-85">地图题不是只靠死记轮廓。把观察顺序固定下来，陌生题也能用排除法解决。</p>
          <button className="mt-6 min-h-10 cursor-pointer rounded-[10px] border-0 bg-gold-200 px-3.5 py-2 text-compact font-black text-gold-800 max-md:min-h-11" type="button" onClick={onOpenAtlas}>打开全国车牌图鉴练读图</button>
        </section>
        <ol className="knowledge-tip-list m-0 grid list-none gap-3 p-0">
          {MAP_READING_TIPS.map((tip, index) => (
            <li className="grid min-h-[150px] grid-cols-[62px_minmax(0,1fr)] items-center gap-5 rounded-[17px] border border-gold-700/15 bg-paper-100/90 p-6" key={tip.mark}>
              <span className="grid size-[62px] shrink-0 place-items-center rounded-[18px_18px_18px_6px] bg-gold-700 font-serif text-[25px] font-black text-white">{tip.mark}</span>
              <div>
                <small className="text-meta font-black tracking-[.1em] text-stone-500">第 {index + 1} 步</small>
                <h3 className="mb-2 mt-[5px] font-serif text-[17px]">{tip.title}</h3>
                <p className="m-0 text-[10px] leading-[1.7] text-ink-500">{tip.detail}</p>
                <strong className="mt-2.5 inline-block rounded-md bg-gold-300 px-2 py-[5px] text-meta text-gold-800">{tip.mnemonic}</strong>
              </div>
            </li>
          ))}
        </ol>
      </div>
    );
  };

  return (
    <main className="knowledge-shell min-h-dvh bg-paper-400 [background-image:radial-gradient(circle_at_8%_5%,rgba(255,255,255,.96),transparent_27rem),radial-gradient(circle_at_90%_13%,rgba(110,78,128,.08),transparent_26rem),linear-gradient(rgba(53,66,56,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(53,66,56,.03)_1px,transparent_1px)] [background-size:auto,auto,30px_30px,30px_30px] text-ink">
      <header className="knowledge-header sticky top-0 z-40 flex min-h-[78px] items-center justify-between gap-6 border-b border-black/[.14] bg-card/95 px-[max(24px,calc((100vw_-_1380px)/2))] py-3 shadow-[0_8px_30px_rgba(58,47,32,.06)] backdrop-blur-xl max-sm:min-h-16 max-sm:gap-2 max-sm:px-3 max-sm:py-2">
        <button className="knowledge-brand flex cursor-pointer items-center gap-3 border-0 bg-transparent p-0 text-left" type="button" onClick={backToCatalog}>
          <span className="grid size-[46px] place-items-center rounded-[14px_14px_14px_5px] bg-scholar-500 font-serif text-[22px] font-black text-gold-100 shadow-[inset_0_0_0_3px_rgba(255,255,255,.13)] max-sm:size-10 max-sm:text-xl" aria-hidden="true">知</span>
          <div>
            <p className="m-0 text-meta font-black tracking-[0.16em] text-scholar-500 max-sm:hidden">CHINA GEO KNOWLEDGE</p>
            <h1 className="m-0 font-serif text-card-title max-sm:text-card-title-mobile">中国地理知识馆</h1>
          </div>
        </button>
        <div className="knowledge-header-actions flex gap-2">
          {activeCategory ? (
            <button className="min-h-10 cursor-pointer rounded-full border border-black/20 bg-white px-3.5 py-2 text-compact font-black max-md:min-h-11" type="button" onClick={backToCatalog}>← 返回分类</button>
          ) : null}
          <button className="knowledge-exit min-h-10 cursor-pointer rounded-full border border-city-900 bg-city-900 px-3.5 py-2 text-compact font-black text-white max-md:min-h-11" type="button" onClick={onExit}>返回游戏</button>
        </div>
      </header>

      {!activeCategory ? (
        <KnowledgeCatalog onOpenCategory={openCategory} />
      ) : (
        <>
          <section className={`knowledge-detail-hero mx-auto grid w-[min(1380px,calc(100%_-_48px))] grid-cols-[84px_minmax(0,1fr)_minmax(280px,360px)] items-center gap-5 border-b pb-[30px] pt-10 max-md:grid-cols-[auto_1fr] max-sm:w-[calc(100%_-_24px)] max-sm:gap-3 max-sm:pb-5 max-sm:pt-6 ${DETAIL_TONE_CLASSES[activeCategory.tone].border}`}>
            <span className={`grid size-[84px] place-items-center rounded-[24px_24px_24px_7px] font-serif text-[38px] font-black text-white shadow-[inset_0_0_0_5px_rgba(255,255,255,.12)] max-sm:size-14 max-sm:rounded-[17px_17px_17px_5px] max-sm:text-2xl ${DETAIL_TONE_CLASSES[activeCategory.tone].icon}`} aria-hidden="true">{activeCategory.icon}</span>
            <div>
              <p className={`m-0 text-[10px] font-black ${DETAIL_TONE_CLASSES[activeCategory.tone].text}`}>{activeCategory.memoryStyle} · {CATEGORY_TOTAL_LABELS[activeCategory.id]}</p>
              <h2 className="mb-0 mt-[7px] font-serif text-page max-sm:text-page-mobile">{activeCategory.title}</h2>
              <strong className="mt-[9px] block text-xs font-medium text-ink-600 max-sm:text-[11px]">{activeCategory.subtitle}</strong>
              <div className="mt-3.5 flex flex-wrap gap-1.5">{activeCategory.levelRefs.map((levelId) => {
                const levelNumber = gauntletLevelNumber(levelId);
                return levelNumber > 0
                  ? <i className={`inline-flex rounded-full border px-[7px] py-1 text-meta font-extrabold not-italic ${DETAIL_TONE_CLASSES[activeCategory.tone].pill}`} key={levelId}>关联第 {levelNumber} 关</i>
                  : null;
              })}</div>
            </div>
            {SEARCHABLE_CATEGORIES.has(activeCategory.id) ? (
              <label className="knowledge-search grid gap-1.5 max-md:col-span-2">
                <span className="text-meta font-black">搜索本专题</span>
                <input
                  className={`min-h-12 w-full rounded-[13px] border bg-paper-100/90 px-4 text-xs text-ink outline-none focus:ring-4 max-md:w-full ${DETAIL_TONE_CLASSES[activeCategory.tone].focus}`}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="输入省份、城市、车牌或学校"
                  type="search"
                />
              </label>
            ) : null}
          </section>
          <section className="knowledge-detail-content mx-auto min-h-[520px] w-[min(1380px,calc(100%_-_48px))] pb-[52px] pt-[30px] max-sm:w-[calc(100%_-_24px)] max-sm:pb-8 max-sm:pt-5">{renderDetailContent()}</section>
          <footer className="knowledge-page-footer mx-auto flex w-[min(1380px,calc(100%_-_48px))] items-center justify-between gap-5 border-t border-black/[.13] pb-[42px] pt-6 max-sm:w-[calc(100%_-_24px)] max-sm:flex-col">
            <button className="min-h-10 cursor-pointer rounded-full border border-scholar-500/25 bg-scholar-100 px-[13px] py-2 text-compact font-black text-scholar-600 max-md:min-h-11" type="button" onClick={backToCatalog}>← 继续浏览其他知识专题</button>
            <span className="text-meta text-stone-500">知识来自当前关卡题库及注明的权威公开资料</span>
          </footer>
        </>
      )}
    </main>
  );
}
