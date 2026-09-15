import type { Dispatch, SetStateAction } from "react";
import {
  getProvinceAdministrativeProfile,
  type ProvinceAdministrativeProfile,
} from "@/domain/geography/data/province-administrative-profiles";
import type { ProvinceCityCountItem } from "@/domain/geography/data/province-city-counts";
import KnowledgeSearchEmpty from "@/features/knowledge/components/knowledge-search-empty";
import type { KnowledgeProvince } from "@/features/knowledge/model/knowledge-types";
import { plainPlaceName } from "@/features/knowledge/model/knowledge-format";

export const PROFILE_BATCH_SIZE = 8;

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
      <section className="knowledge-province-filter rounded-2xl border border-black/10 bg-card p-5" aria-label="筛选省份名片">
        <header className="flex items-end justify-between gap-4 max-md:flex-col max-md:items-stretch">
          <label className="grid gap-1.5">
            <span className="text-[10px] font-black text-ink-soft">按名称检索</span>
            <input
              className="min-h-11 w-72 rounded-xl border border-black/15 bg-white px-3 outline-none focus:border-[#735285] focus:ring-2 focus:ring-[#735285]/15 max-md:w-full"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setVisibleCount(PROFILE_BATCH_SIZE);
              }}
              placeholder="输入省份全称或简称"
              type="search"
            />
          </label>
          <div className="flex items-center gap-3">
            <strong className="text-xs" aria-live="polite">
              显示 {filteredProvinces.length} / {provinces.length}
            </strong>
            {query || selectedProvinceCodes.size > 0 ? (
              <button className="cursor-pointer rounded-full border border-black/15 bg-white px-3 py-2 text-[10px] font-black" type="button" onClick={clearFilters}>清除筛选</button>
            ) : null}
          </div>
        </header>
        <p className="knowledge-province-filter-hint text-xs text-ink-soft">
          点击省份可多选，未选择时显示全部
        </p>
        <div className="knowledge-province-tags flex flex-wrap gap-2" role="group" aria-label="按省份多选">
          {provinces.map((province) => {
            const isSelected = selectedProvinceCodes.has(province.code);
            return (
              <button
                key={province.code}
                type="button"
                className={`cursor-pointer rounded-full border px-3 py-2 text-xs font-bold ${isSelected ? "is-selected border-[#735285] bg-[#735285] text-white" : "border-black/15 bg-white"}`}
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
      <div className="knowledge-profile-guide flex items-center gap-4 rounded-2xl border border-black/10 bg-card p-5">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#735285] font-black text-white" aria-hidden="true">总</span>
        <div>
          <strong>城市数和综合总量要分开记</strong>
          <p className="mb-0 text-xs leading-5 text-ink-soft">
            综合总量加入州、地区、盟、省直辖单位等；新区、示范区按独立号牌学习单元纳入，不改变统计年鉴的城市数。
          </p>
        </div>
      </div>
      {filteredProvinces.length === 0 ? (
        <KnowledgeSearchEmpty query={query} />
      ) : (
        <>
          <div className="knowledge-profile-grid grid grid-cols-3 gap-4 max-xl:grid-cols-2 max-md:grid-cols-1">
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
                <article className="knowledge-profile-card rounded-[18px_18px_18px_6px] border border-black/10 bg-card p-5 shadow-sm" key={province.code}>
                  <div className="knowledge-profile-head grid grid-cols-[auto_1fr_auto] items-center gap-3">
                    <span className="text-[10px] font-black text-black/30">{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <h3 className="m-0 text-2xl font-black">{province.name}</h3>
                      <p className="m-0 text-[10px] text-ink-soft">{province.kind}</p>
                    </div>
                    <b className="rounded-lg bg-[#735285] px-2 py-1 text-white">{provincePlatePrefixes[province.code]}</b>
                  </div>
                  <dl className="my-4 grid grid-cols-3 gap-2 [&>div]:rounded-lg [&>div]:bg-paper [&>div]:p-2 [&_dd]:m-0 [&_dd]:mt-1 [&_dd]:font-black [&_dt]:text-[9px] [&_dt]:text-ink-soft">
                    <div><dt>行政中心</dt><dd>{plainPlaceName(provinceCapitals[province.code])}</dd></div>
                    <div><dt>城市数量</dt><dd>{cityCount?.cityCount ?? "—"}</dd></div>
                    <div><dt>特殊单位</dt><dd>{specialUnitCount || 0}</dd></div>
                    <div className="is-total"><dt>综合总量</dt><dd>{profile.totalUnitCount}</dd></div>
                    <div><dt>陆地邻省</dt><dd>{provinceNeighbors[province.code]?.length ?? 0}</dd></div>
                    <div><dt>号牌分组</dt><dd>{profile.plateRegions.length || "—"}</dd></div>
                  </dl>
                  <div className="knowledge-region-categories flex flex-wrap gap-1.5 text-[10px] text-ink-soft" aria-label={`${province.name}行政区域分类`}>
                    <span className="rounded-full bg-[#735285]/10 px-2 py-1"><b>{cityTotal}</b> 地级及以上城市</span>
                    {profile.categories.map((item) => (
                      <span className="rounded-full bg-[#735285]/10 px-2 py-1" key={`${province.code}-${item.label}`}>
                        <b>{item.count}</b> {item.label}
                      </span>
                    ))}
                  </div>
                  {profile.plateRegions.length > 0 ? (
                    <section className="knowledge-special-regions mt-4 rounded-xl border border-black/10 p-3">
                      <header className="flex justify-between text-xs">
                        <strong>特殊车牌辖区</strong>
                        <small>{profile.plateRegions.length} 组</small>
                      </header>
                      <div className="mt-2 grid gap-2">
                        {profile.plateRegions.map((item) => (
                          <article className="flex items-center justify-between rounded-lg bg-paper p-2 text-xs" key={`${province.code}-${item.plate}-${item.name}`}>
                            <span>
                              <strong>{item.name}</strong>
                              <small className="ml-2 text-ink-soft">{item.type}</small>
                              {item.note ? <em className="ml-2 text-[9px] text-ink-soft">{item.note}</em> : null}
                            </span>
                            <b>{item.plate}</b>
                          </article>
                        ))}
                      </div>
                    </section>
                  ) : (
                    <p className="knowledge-no-special-region text-xs text-ink-soft">
                      {profile.note ?? "无城市口径外的独立车牌辖区"}
                    </p>
                  )}
                  {profile.plateRegions.length > 0 && profile.note ? (
                    <p className="knowledge-profile-note rounded-xl bg-[#735285]/5 p-3 text-xs">{profile.note}</p>
                  ) : null}
                  <p className="knowledge-card-note mb-0 text-[10px] text-ink-soft">
                    {universityCount > 0
                      ? `名校专题收录 ${universityCount} 所 · 车牌题库 ${quizCount} 组`
                      : `简称印章：${provincePlatePrefixes[province.code]} · 车牌题库 ${quizCount} 组`}
                  </p>
                </article>
              );
            })}
          </div>
          {!hasActiveFilter && visibleProvinces.length < filteredProvinces.length ? (
            <div className="knowledge-profile-more flex items-center justify-center gap-4 rounded-2xl bg-card p-4 text-xs">
              <span>已展示 {visibleProvinces.length} / {filteredProvinces.length}</span>
              <div className="flex gap-2">
                <button
                  className="cursor-pointer rounded-full border-0 bg-[#735285] px-4 py-2 font-black text-white"
                  type="button"
                  onClick={() => setVisibleCount((count) => count + PROFILE_BATCH_SIZE)}
                >
                  再显示 {Math.min(
                    PROFILE_BATCH_SIZE,
                    filteredProvinces.length - visibleProvinces.length,
                  )} 个
                </button>
                <button
                  className="is-text cursor-pointer rounded-full border border-black/15 bg-white px-4 py-2 font-black"
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
