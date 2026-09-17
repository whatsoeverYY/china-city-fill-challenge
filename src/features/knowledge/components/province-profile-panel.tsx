import type { Dispatch, SetStateAction } from "react";
import {
  getProvinceAdministrativeProfile,
  type ProvinceAdministrativeProfile,
} from "@/domain/geography/data/province-administrative-profiles";
import type { ProvinceCityCountItem } from "@/domain/geography/data/province-city-counts";
import KnowledgeSearchEmpty from "@/features/knowledge/components/knowledge-search-empty";
import type { KnowledgeProvince } from "@/features/knowledge/model/knowledge-types";
import { plainPlaceName } from "@/features/knowledge/model/knowledge-format";
import { PROFILE_BATCH_SIZE } from "@/features/knowledge/config/knowledge-catalog-config";

const PROFILE_METRIC_CLASS = "grid gap-1 border-b border-r border-black/[.13] p-[11px]";
const PROFILE_TERM_CLASS = "text-meta text-stone-500";
const PROFILE_VALUE_CLASS = "m-0 text-xs font-black";

type ProvinceProfilePanelProps = {
  provinces: KnowledgeProvince[];
  filteredProvinces: KnowledgeProvince[];
  visibleProvinces: KnowledgeProvince[];
  query: string;
  setQuery: (query: string) => void;
  selectedProvinceCodes: Set<string>;
  toggleProvince: (provinceCode: string) => void;
  clearFilters: () => void;
  hasActiveFilter: boolean;
  setVisibleCount: Dispatch<SetStateAction<number>>;
  cityCountByCode: Map<string, ProvinceCityCountItem>;
  administrativeProfileByCode: Map<string, ProvinceAdministrativeProfile>;
  quizCityCountByProvince: Map<string, number>;
  universityCountByProvince: Map<string, number>;
  provinceCapitals: Record<string, string>;
  provinceNeighbors: Record<string, string[]>;
  provincePlatePrefixes: Record<string, string>;
};

export default function ProvinceProfilePanel({
  provinces,
  filteredProvinces,
  visibleProvinces,
  query,
  setQuery,
  selectedProvinceCodes,
  toggleProvince,
  clearFilters,
  hasActiveFilter,
  setVisibleCount,
  cityCountByCode,
  administrativeProfileByCode,
  quizCityCountByProvince,
  universityCountByProvince,
  provinceCapitals,
  provinceNeighbors,
  provincePlatePrefixes,
}: ProvinceProfilePanelProps) {
  return (
    <div className="knowledge-stack grid gap-5">
      <section className="knowledge-province-filter grid gap-[15px] rounded-[18px_18px_18px_7px] border border-city-700/15 bg-paper-100/90 p-[18px] shadow-[0_10px_28px_rgba(60,50,36,.04)]" aria-label="筛选省份名片">
        <header className="flex items-end justify-between gap-[18px] max-md:flex-col max-md:items-stretch">
          <label className="grid w-[min(100%,380px)] gap-[7px]">
            <span className="text-meta font-black tracking-[.1em] text-ink-500">按名称检索</span>
            <input
              className="min-h-11 w-full rounded-xl border border-city-700/25 bg-white px-3.5 text-xs outline-none focus:border-city-500 focus:ring-4 focus:ring-city-700/10"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setVisibleCount(PROFILE_BATCH_SIZE);
              }}
              placeholder="输入省份全称或简称"
              type="search"
            />
          </label>
          <div className="flex min-h-11 items-center gap-2.5">
            <strong className="whitespace-nowrap text-[10px] text-stone-700" aria-live="polite">
              显示 {filteredProvinces.length} / {provinces.length}
            </strong>
            {query || selectedProvinceCodes.size > 0 ? (
              <button className="min-h-10 cursor-pointer rounded-full border border-city-700/20 bg-city-200 px-2.5 py-2 text-compact font-black text-city-800 max-md:min-h-11" type="button" onClick={clearFilters}>清除筛选</button>
            ) : null}
          </div>
        </header>
        <p className="knowledge-province-filter-hint -mt-[3px] mb-0 text-meta text-stone-600">
          点击省份可多选，未选择时显示全部
        </p>
        <div className="knowledge-province-tags flex flex-wrap gap-[7px]" role="group" aria-label="按省份多选">
          {provinces.map((province) => {
            const isSelected = selectedProvinceCodes.has(province.code);
            return (
              <button
                key={province.code}
                type="button"
                className={`min-h-10 min-w-[43px] cursor-pointer rounded-full border px-2.5 py-2 text-compact font-extrabold transition hover:-translate-y-px hover:border-city-700/35 hover:text-city-800 max-md:min-h-11 ${isSelected ? "border-city-500 bg-city-500 text-white shadow-[0_5px_14px_rgba(160,59,50,.18)] hover:text-white" : "border-black/15 bg-paper-300 text-stone-700"}`}
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
      <div className="knowledge-profile-guide grid grid-cols-[48px_minmax(0,1fr)] items-center gap-3.5 rounded-[16px_16px_16px_6px] border border-city-700/15 bg-clay-200 px-[18px] py-4 text-city-900">
        <span className="grid size-12 shrink-0 place-items-center rounded-[50%_50%_50%_13px] bg-city-500 font-serif text-[21px] font-black text-white" aria-hidden="true">总</span>
        <div>
          <strong className="font-serif text-base">城市数和综合总量要分开记</strong>
          <p className="mb-0 mt-1 text-meta text-stone-700">
            综合总量加入州、地区、盟、省直辖单位等；新区、示范区按独立号牌学习单元纳入，不改变统计年鉴的城市数。
          </p>
        </div>
      </div>
      {filteredProvinces.length === 0 ? (
        <KnowledgeSearchEmpty query={query} />
      ) : (
        <>
          <div className="knowledge-profile-grid grid grid-cols-3 gap-[13px] max-xl:grid-cols-2 max-md:grid-cols-1">
            {visibleProvinces.map((province, index) => {
              const cityCount = cityCountByCode.get(province.code);
              const cityTotal = cityCount?.cityCount ?? 0;
              const profile = administrativeProfileByCode.get(province.code) ??
                getProvinceAdministrativeProfile(province.code, cityTotal);
              const specialUnitCount = profile.categories.reduce(
                (total, item) => total + item.count,
                0,
              );
              const quizCount = quizCityCountByProvince.get(province.code) ?? 0;
              const universityCount =
                universityCountByProvince.get(province.code) ?? 0;
              return (
                <article className="knowledge-profile-card rounded-[17px_17px_17px_6px] border border-black/15 bg-paper-100/90 p-5 shadow-[0_10px_28px_rgba(60,50,36,.05)]" key={province.code}>
                  <div className="knowledge-profile-head grid grid-cols-[auto_1fr_auto] items-center gap-[11px]">
                    <span className="font-numeric text-[10px] text-stone-500">{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <h3 className="m-0 font-serif text-base">{province.name}</h3>
                      <p className="mb-0 mt-[3px] text-meta text-stone-500">{province.kind}</p>
                    </div>
                    <b className="grid size-[38px] place-items-center rounded-[11px_11px_11px_4px] bg-city-500 font-serif text-lg text-white">{provincePlatePrefixes[province.code]}</b>
                  </div>
                  <dl className="mb-0 mt-[18px] grid grid-cols-3 border-l border-t border-black/[.13]">
                    <div className={PROFILE_METRIC_CLASS}><dt className={PROFILE_TERM_CLASS}>行政中心</dt><dd className={PROFILE_VALUE_CLASS}>{plainPlaceName(provinceCapitals[province.code])}</dd></div>
                    <div className={PROFILE_METRIC_CLASS}><dt className={PROFILE_TERM_CLASS}>城市数量</dt><dd className={PROFILE_VALUE_CLASS}>{cityCount?.cityCount ?? "—"}</dd></div>
                    <div className={PROFILE_METRIC_CLASS}><dt className={PROFILE_TERM_CLASS}>特殊单位</dt><dd className={PROFILE_VALUE_CLASS}>{specialUnitCount || 0}</dd></div>
                    <div className={`${PROFILE_METRIC_CLASS} bg-city-200 text-city-800`}><dt className={PROFILE_TERM_CLASS}>综合总量</dt><dd className={PROFILE_VALUE_CLASS}>{profile.totalUnitCount}</dd></div>
                    <div className={PROFILE_METRIC_CLASS}><dt className={PROFILE_TERM_CLASS}>陆地邻省</dt><dd className={PROFILE_VALUE_CLASS}>{provinceNeighbors[province.code]?.length ?? 0}</dd></div>
                    <div className={PROFILE_METRIC_CLASS}><dt className={PROFILE_TERM_CLASS}>号牌分组</dt><dd className={PROFILE_VALUE_CLASS}>{profile.plateRegions.length || "—"}</dd></div>
                  </dl>
                  <div className="knowledge-region-categories mt-[13px] flex flex-wrap gap-1.5 text-meta font-extrabold text-ink-600" aria-label={`${province.name}行政区域分类`}>
                    <span className="rounded-full border border-jade-500/15 bg-jade-200 px-2 py-1.5"><b className="text-[10px] text-jade-700">{cityTotal}</b> 地级及以上城市</span>
                    {profile.categories.map((item) => (
                      <span className="rounded-full border border-jade-500/15 bg-jade-200 px-2 py-1.5" key={`${province.code}-${item.label}`}>
                        <b className="text-[10px] text-jade-700">{item.count}</b> {item.label}
                      </span>
                    ))}
                  </div>
                  {profile.plateRegions.length > 0 ? (
                    <section className="knowledge-special-regions mt-3.5 border-t border-dashed border-black/20 pt-3">
                      <header className="flex items-center justify-between text-clay-700">
                        <strong className="text-meta tracking-[.08em]">特殊车牌辖区</strong>
                        <small className="text-meta text-stone-500">{profile.plateRegions.length} 组</small>
                      </header>
                      <div className="mt-2 grid gap-1.5">
                        {profile.plateRegions.map((item) => (
                          <article className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2.5 rounded-[10px_10px_10px_3px] bg-stone-100 px-[9px] py-2" key={`${province.code}-${item.plate}-${item.name}`}>
                            <span className="grid min-w-0 gap-0.5">
                              <strong className="truncate text-meta">{item.name}</strong>
                              <small className="text-meta text-stone-500">{item.type}</small>
                              {item.note ? <em className="text-meta not-italic text-stone-500">{item.note}</em> : null}
                            </span>
                            <b className="min-w-[35px] rounded-[7px] bg-atlas-500 px-1.5 py-[5px] text-center font-serif text-[10px] text-white">{item.plate}</b>
                          </article>
                        ))}
                      </div>
                    </section>
                  ) : (
                    <p className="knowledge-no-special-region mb-0 mt-[13px] rounded-[9px] bg-paper-300 px-2.5 py-[9px] text-meta text-stone-600">
                      {profile.note ?? "无城市口径外的独立车牌辖区"}
                    </p>
                  )}
                  {profile.plateRegions.length > 0 && profile.note ? (
                    <p className="knowledge-profile-note mb-0 mt-[13px] rounded-[9px] bg-clay-200 px-2.5 py-[9px] text-meta text-stone-700">{profile.note}</p>
                  ) : null}
                  <p className="knowledge-card-note mb-0 mt-[13px] text-meta text-stone-700">
                    {universityCount > 0
                      ? `名校专题收录 ${universityCount} 所 · 车牌题库 ${quizCount} 组`
                      : `简称印章：${provincePlatePrefixes[province.code]} · 车牌题库 ${quizCount} 组`}
                  </p>
                </article>
              );
            })}
          </div>
          {!hasActiveFilter && visibleProvinces.length < filteredProvinces.length ? (
            <div className="knowledge-profile-more flex items-center justify-between gap-4 rounded-[14px] border border-black/15 bg-paper-100/80 px-[18px] py-4 text-meta text-ink-500">
              <span>已展示 {visibleProvinces.length} / {filteredProvinces.length}</span>
              <div className="flex gap-2">
                <button
                  className="min-h-10 cursor-pointer rounded-full border border-city-500 bg-city-500 px-[13px] py-2 text-compact font-black text-white max-md:min-h-11"
                  type="button"
                  onClick={() => setVisibleCount((count) => count + PROFILE_BATCH_SIZE)}
                >
                  再显示 {Math.min(
                    PROFILE_BATCH_SIZE,
                    filteredProvinces.length - visibleProvinces.length,
                  )} 个
                </button>
                <button
                  className="min-h-10 cursor-pointer rounded-full border border-city-500 bg-transparent px-[13px] py-2 text-compact font-black text-city-900 max-md:min-h-11"
                  type="button"
                  onClick={() => setVisibleCount(filteredProvinces.length)}
                >
                  显示全部
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
