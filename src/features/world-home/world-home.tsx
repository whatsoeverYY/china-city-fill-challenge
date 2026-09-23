"use client";

import { useCallback, useMemo, useState } from "react";
import {
  WORLD_COUNTRIES,
  WORLD_COUNTRY_BY_ID,
  type WorldCountryId,
} from "@/domain/geography/data/world-countries";
import {
  WORLD_COUNTRY_DATA_NOTICE,
  WORLD_BOUNDARY_DISCLAIMER,
  WORLD_MAP_DATA_NOTICE,
} from "@/domain/geography/data/world-data-policy";
import {
  useWorldMapData,
  type WorldMapFeature,
} from "@/features/map/model/world-map-data";
import DataVintageNotice from "@/shared/components/data-vintage-notice";
import PageBreadcrumbs from "@/shared/components/page-breadcrumbs";
import { routePath } from "@/shared/lib/app-path";
import WorldCountryDossier from "./components/world-country-dossier";
import WorldExplorer from "./components/world-explorer";
import { useWorldExplorationProgress } from "./model/use-world-exploration-progress";

export default function WorldHome() {
  const { data: map, error } = useWorldMapData();
  const { exploredCountryIds, exploreCountry } = useWorldExplorationProgress();
  const [activeContinentId, setActiveContinentId] = useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<WorldMapFeature | null>(null);
  const selectedCountry = selectedFeature
    ? WORLD_COUNTRY_BY_ID.get(selectedFeature.properties.id) ?? null
    : null;
  const exploredContinents = useMemo(() => new Set(
    WORLD_COUNTRIES
      .filter((country) => exploredCountryIds.has(country.id))
      .map((country) => country.continentId),
  ).size, [exploredCountryIds]);
  const closeDossier = useCallback(() => setSelectedFeature(null), []);

  const openCountry = (feature: WorldMapFeature) => {
    const country = WORLD_COUNTRY_BY_ID.get(feature.properties.id);
    if (!country) return;
    exploreCountry(country.id);
    setSelectedFeature(feature);
  };

  const openCountryById = (countryId: WorldCountryId) => {
    const feature = map?.features.find(
      (item) => item.properties.id === countryId,
    );
    if (feature) openCountry(feature);
  };

  const openRandomCountry = () => {
    if (!map) return;
    const candidates = WORLD_COUNTRIES.filter((country) =>
      (!activeContinentId || country.continentId === activeContinentId) &&
      !exploredCountryIds.has(country.id)
    );
    const country = candidates[Math.floor(Math.random() * candidates.length)];
    if (country) openCountryById(country.id);
  };

  return (
    <main className="mx-auto min-h-dvh w-[min(1320px,calc(100%_-_48px))] pb-16 pt-8 text-ink max-md:w-[min(760px,calc(100%_-_24px))] max-md:pt-4">
      <PageBreadcrumbs items={[{ label: "中国篇", href: routePath("/") }, { label: "世界篇" }]} />

      <section className="mt-8 grid grid-cols-[minmax(0,1fr)_360px] gap-6 overflow-hidden rounded-[30px_30px_30px_9px] border border-atlas-500/20 bg-card/85 px-8 py-10 shadow-xl max-lg:grid-cols-1 max-sm:px-5 max-sm:py-7">
        <div>
          <p className="m-0 text-meta font-black uppercase tracking-[0.24em] text-atlas-700">WORLD EXPEDITION · 环球探索册</p>
          <h1 className="mb-4 mt-3 max-w-[780px] font-serif text-display font-bold max-md:text-display-mobile">从一张地图出发，亲手点亮世界</h1>
          <p className="m-0 max-w-[780px] text-body text-ink-soft">选择一个洲，点击国家查看轮廓、首都和资料。每打开一份国家档案，地图就会留下你的探索印记。</p>
        </div>
        <div className="grid grid-cols-3 gap-2 self-end">
          {[
            [String(exploredCountryIds.size), "已探索国家"],
            [String(exploredContinents), "已踏足洲别"],
            ["195", "国家目标"],
          ].map(([value, label]) => (
            <div className="rounded-[16px_16px_16px_5px] border border-atlas-500/15 bg-atlas-100/65 px-3 py-4 text-center" key={label}>
              <strong className="block font-numeric text-section text-atlas-800">{value}</strong>
              <span className="text-meta font-bold text-ink-soft">{label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-5">
        <DataVintageNotice lines={[WORLD_MAP_DATA_NOTICE, WORLD_COUNTRY_DATA_NOTICE, WORLD_BOUNDARY_DISCLAIMER]} />
      </div>

      {error ? (
        <section className="mt-8 rounded-[22px_22px_22px_7px] border border-city-500/20 bg-card p-8 text-center">
          <h2 className="m-0 font-serif text-section font-bold">世界地图加载失败</h2>
          <p className="mb-0 mt-2 text-body text-ink-soft">请检查网络或刷新页面后重试。</p>
        </section>
      ) : map ? (
        <WorldExplorer
          map={map}
          exploredCountryIds={exploredCountryIds}
          selectedCountryId={selectedCountry?.id ?? null}
          activeContinentId={activeContinentId}
          onCountry={openCountry}
          onCountryId={openCountryById}
          onContinent={(continentId) => {
            setActiveContinentId(continentId);
            setSelectedFeature(null);
          }}
          onRandomCountry={openRandomCountry}
        />
      ) : (
        <section className="mt-8 grid min-h-[420px] place-items-center rounded-[22px_22px_22px_7px] border border-atlas-500/20 bg-card/85 text-center" role="status">
          <div>
            <span className="mx-auto mb-4 block size-9 animate-spin rounded-full border-[3px] border-atlas-500/20 border-t-atlas-600" aria-hidden="true" />
            <p className="m-0 text-body font-bold text-ink-soft">正在展开环球探索地图…</p>
          </div>
        </section>
      )}

      {selectedCountry && selectedFeature ? (
        <WorldCountryDossier country={selectedCountry} feature={selectedFeature} onClose={closeDossier} />
      ) : null}
    </main>
  );
}
