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
    <div className="knowledge-stack">
      <section className="knowledge-province-filter" aria-label="筛选省份名片">
        <header>
          <label>
            <span>按名称检索</span>
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setVisibleCount(PROFILE_BATCH_SIZE);
              }}
              placeholder="输入省份全称或简称"
              type="search"
            />
          </label>
          <div>
            <strong aria-live="polite">
              显示 {filteredProvinces.length} / {provinces.length}
            </strong>
            {query || selectedProvinceCodes.size > 0 ? (
              <button type="button" onClick={clearFilters}>清除筛选</button>
            ) : null}
          </div>
        </header>
        <p className="knowledge-province-filter-hint">
          点击省份可多选，未选择时显示全部
        </p>
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
          <p>
            综合总量加入州、地区、盟、省直辖单位等；新区、示范区按独立号牌学习单元纳入，不改变统计年鉴的城市数。
          </p>
        </div>
      </div>
      {filteredProvinces.length === 0 ? (
        <KnowledgeSearchEmpty query={query} />
      ) : (
        <>
          <div className="knowledge-profile-grid">
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
                    <div className="is-total"><dt>综合总量</dt><dd>{profile.totalUnitCount}</dd></div>
                    <div><dt>陆地邻省</dt><dd>{provinceNeighbors[province.code]?.length ?? 0}</dd></div>
                    <div><dt>号牌分组</dt><dd>{profile.plateRegions.length || "—"}</dd></div>
                  </dl>
                  <div className="knowledge-region-categories" aria-label={`${province.name}行政区域分类`}>
                    <span><b>{cityTotal}</b> 地级及以上城市</span>
                    {profile.categories.map((item) => (
                      <span key={`${province.code}-${item.label}`}>
                        <b>{item.count}</b> {item.label}
                      </span>
                    ))}
                  </div>
                  {profile.plateRegions.length > 0 ? (
                    <section className="knowledge-special-regions">
                      <header>
                        <strong>特殊车牌辖区</strong>
                        <small>{profile.plateRegions.length} 组</small>
                      </header>
                      <div>
                        {profile.plateRegions.map((item) => (
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
                      {profile.note ?? "无城市口径外的独立车牌辖区"}
                    </p>
                  )}
                  {profile.plateRegions.length > 0 && profile.note ? (
                    <p className="knowledge-profile-note">{profile.note}</p>
                  ) : null}
                  <p className="knowledge-card-note">
                    {universityCount > 0
                      ? `名校专题收录 ${universityCount} 所 · 车牌题库 ${quizCount} 组`
                      : `简称印章：${provincePlatePrefixes[province.code]} · 车牌题库 ${quizCount} 组`}
                  </p>
                </article>
              );
            })}
          </div>
          {!hasActiveFilter && visibleProvinces.length < filteredProvinces.length ? (
            <div className="knowledge-profile-more">
              <span>已展示 {visibleProvinces.length} / {filteredProvinces.length}</span>
              <div>
                <button
                  type="button"
                  onClick={() => setVisibleCount((count) => count + PROFILE_BATCH_SIZE)}
                >
                  再显示 {Math.min(
                    PROFILE_BATCH_SIZE,
                    filteredProvinces.length - visibleProvinces.length,
                  )} 个
                </button>
                <button
                  className="is-text"
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
