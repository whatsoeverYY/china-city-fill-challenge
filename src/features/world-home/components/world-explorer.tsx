import { WORLD_CONTINENTS } from "@/domain/geography/data/world-continents";
import {
  WORLD_COUNTRIES,
  type WorldCountryId,
} from "@/domain/geography/data/world-countries";
import WorldMapCanvas from "@/features/map/components/world-map-canvas";
import type {
  WorldMapData,
  WorldMapFeature,
} from "@/features/map/model/world-map-data";
import AppLink from "@/shared/components/app-link";
import { routePath } from "@/shared/lib/app-path";

export default function WorldExplorer({
  map,
  exploredCountryIds,
  selectedCountryId,
  activeContinentId,
  onCountry,
  onCountryId,
  onContinent,
  onRandomCountry,
}: {
  map: WorldMapData;
  exploredCountryIds: Set<WorldCountryId>;
  selectedCountryId: WorldCountryId | null;
  activeContinentId: string | null;
  onCountry: (feature: WorldMapFeature) => void;
  onCountryId: (countryId: WorldCountryId) => void;
  onContinent: (continentId: string | null) => void;
  onRandomCountry: () => void;
}) {
  const activeContinent = WORLD_CONTINENTS.find(
    (continent) => continent.id === activeContinentId,
  ) ?? null;
  const countryOptions = [...WORLD_COUNTRIES]
    .filter((country) =>
      !activeContinentId || country.continentId === activeContinentId
    )
    .sort((first, second) => first.name.localeCompare(second.name, "zh-CN"));
  const exploredInScope = countryOptions.filter((country) =>
    exploredCountryIds.has(country.id)
  ).length;
  const scopeTotal = countryOptions.length;
  const remaining = scopeTotal - exploredInScope;
  const progressPercent = scopeTotal > 0
    ? Math.round((exploredInScope / scopeTotal) * 100)
    : 0;

  return (
    <section className="mt-8" aria-labelledby="world-explorer-title">
      <div className="mb-4 flex items-end justify-between gap-5 max-md:block">
        <div>
          <p className="m-0 text-meta font-black uppercase tracking-[0.2em] text-atlas-700">EXPLORATION DESK</p>
          <h2 className="mb-1 mt-1 font-serif text-section font-bold" id="world-explorer-title">环球探索指挥台</h2>
          <p className="m-0 text-compact text-ink-soft">选择一个洲，再点击地图上的国家，将它收入你的世界探索册。</p>
        </div>
        <p className="mb-0 mt-3 text-compact font-bold text-ink-soft md:mt-0">
          当前范围 <strong className="font-numeric text-xl text-atlas-700">{exploredInScope}</strong> / {scopeTotal || "特别篇"}
        </p>
      </div>

      <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-2" aria-label="按洲选择探索范围">
        <button className={`min-h-11 shrink-0 cursor-pointer rounded-full border px-4 text-compact font-black ${activeContinentId === null ? "border-atlas-700 bg-atlas-700 text-white" : "border-atlas-500/20 bg-card text-atlas-800"}`} type="button" aria-pressed={activeContinentId === null} onClick={() => onContinent(null)}>全世界 · 195</button>
        {WORLD_CONTINENTS.map((continent) => {
          const explored = WORLD_COUNTRIES.filter((country) =>
            country.continentId === continent.id && exploredCountryIds.has(country.id)
          ).length;
          const active = activeContinentId === continent.id;
          return (
            <button className={`min-h-11 shrink-0 cursor-pointer rounded-full border px-4 text-compact font-black ${active ? "border-atlas-700 bg-atlas-700 text-white" : "border-atlas-500/20 bg-card text-atlas-800"}`} key={continent.id} type="button" aria-pressed={active} onClick={() => onContinent(continent.id)}>
              {continent.name} · {continent.countryCount > 0 ? `${explored}/${continent.countryCount}` : "特别篇"}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_300px] gap-4 max-lg:grid-cols-1">
        <WorldMapCanvas
          map={map}
          completedCountryIds={exploredCountryIds}
          selectedCountryId={selectedCountryId}
          wrongCountryId={null}
          activeContinentId={activeContinentId}
          completedStateLabel="已探索"
          ariaLabel="环球探索世界国家地图"
          onCountry={onCountry}
        />

        <aside className="rounded-[22px_22px_22px_7px] border border-atlas-500/20 bg-card/90 p-5 shadow-lg">
          <p className="m-0 text-meta font-black uppercase tracking-[0.16em] text-atlas-700">CURRENT ROUTE</p>
          <h3 className="mb-2 mt-2 font-serif text-card-title font-bold">{activeContinent?.name ?? "世界自由探索"}</h3>
          <p className="m-0 text-compact text-ink-soft">
            {activeContinent?.description ?? "从任意国家开始。打开国家档案后，该国会在地图上留下探索颜色与名称。"}
          </p>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-atlas-100" aria-label={`探索进度 ${progressPercent}%`}>
            <span className="block h-full rounded-full bg-atlas-600 transition-[width] duration-500" style={{ width: `${progressPercent}%` }} />
          </div>
          <p className="mb-0 mt-2 text-meta font-bold text-ink-soft">{scopeTotal > 0 ? `还可发现 ${remaining} 个国家` : "南极洲没有主权国家，将在后续开放专题探索"}</p>

          {scopeTotal > 0 ? (
            <label className="mt-5 grid gap-1 text-meta font-bold text-ink-soft">
              快速查找国家
              <select className="min-h-11 w-full rounded-xl border border-black/15 bg-paper-100 px-3 text-compact text-ink" value={selectedCountryId ?? ""} onChange={(event) => {
                if (event.target.value) onCountryId(event.target.value as WorldCountryId);
              }}>
                <option value="">选择一个国家</option>
                {countryOptions.map((country) => (
                  <option key={country.id} value={country.id}>{exploredCountryIds.has(country.id) ? "✓ " : ""}{country.name}</option>
                ))}
              </select>
            </label>
          ) : null}

          <button className="mt-4 min-h-11 w-full cursor-pointer rounded-full border-0 bg-atlas-700 px-4 py-2.5 text-compact font-black text-white disabled:cursor-not-allowed disabled:opacity-45" type="button" disabled={remaining <= 0} onClick={onRandomCountry}>
            {remaining > 0 ? "随机发现一个国家" : scopeTotal > 0 ? "当前范围已探索完成" : "特别篇敬请期待"}
          </button>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <AppLink className="inline-flex min-h-11 items-center justify-center rounded-xl border border-scholar-500/20 bg-scholar-100 px-3 text-center text-meta font-black text-scholar-800 no-underline" href={routePath("/world/knowledge")}>国家索引</AppLink>
            <AppLink className="inline-flex min-h-11 items-center justify-center rounded-xl border border-gold-600/25 bg-gold-100 px-3 text-center text-meta font-black text-gold-900 no-underline" href={routePath("/world/gauntlet")}>挑战关卡</AppLink>
          </div>
        </aside>
      </div>
    </section>
  );
}
