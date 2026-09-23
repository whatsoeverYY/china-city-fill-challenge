"use client";

import { useMemo, useState } from "react";
import { WORLD_LEVEL_ID } from "@/domain/game/world-level-ids";
import {
  WORLD_COUNTRIES,
  WORLD_COUNTRY_BY_ID,
  type WorldCountry,
  type WorldCountryId,
} from "@/domain/geography/data/world-countries";
import { worldCountryAnswerMatches } from "@/domain/geography/lib/world-country-answer";
import WorldMapCanvas from "@/features/map/components/world-map-canvas";
import type {
  WorldMapData,
  WorldMapFeature,
} from "@/features/map/model/world-map-data";
import { usePlayerData } from "@/features/player/player-data-context";
import AppLink from "@/shared/components/app-link";
import { routePath } from "@/shared/lib/app-path";
import {
  DEFAULT_WORLD_MAP_ROUTE_ID,
  WORLD_MAP_ROUTES,
} from "../config/world-map-routes";
import { recordWorldExploredCountry } from "../model/record-world-exploration";

export default function WorldMapCountryLevel({
  map,
  onComplete,
}: {
  map: WorldMapData;
  onComplete: (levelId: typeof WORLD_LEVEL_ID.MAP_COUNTRY_NAMES) => void;
}) {
  const { progressStorage } = usePlayerData();
  const [routeId, setRouteId] = useState(DEFAULT_WORLD_MAP_ROUTE_ID);
  const [completedCountryIds, setCompletedCountryIds] = useState<
    Set<WorldCountryId>
  >(new Set());
  const [selectedFeature, setSelectedFeature] =
    useState<WorldMapFeature | null>(null);
  const [wrongCountryId, setWrongCountryId] =
    useState<WorldCountryId | null>(null);
  const [answer, setAnswer] = useState("");
  const [revealedCountry, setRevealedCountry] =
    useState<WorldCountry | null>(null);
  const [feedback, setFeedback] = useState(
    "点击当前路线中高亮的国家区块开始探索",
  );
  const activeRoute = WORLD_MAP_ROUTES.find((route) => route.id === routeId)
    ?? WORLD_MAP_ROUTES[0];
  const activeCountryIds = useMemo(
    () => new Set(activeRoute.countryIds),
    [activeRoute],
  );
  const routeCountries = useMemo(
    () => WORLD_COUNTRIES.filter((country) => activeCountryIds.has(country.id)),
    [activeCountryIds],
  );
  const target = routeCountries.length;
  const passed = completedCountryIds.size >= target;
  const remaining = Math.max(0, target - completedCountryIds.size);
  const selectedCountry = selectedFeature
    ? WORLD_COUNTRY_BY_ID.get(selectedFeature.properties.id) ?? null
    : null;
  const completedCountries = routeCountries.filter((country) =>
    completedCountryIds.has(country.id)
  );

  const selectRoute = (nextRouteId: string) => {
    setRouteId(nextRouteId);
    setCompletedCountryIds(new Set());
    setSelectedFeature(null);
    setWrongCountryId(null);
    setAnswer("");
    setRevealedCountry(null);
    setFeedback("新路线已展开，点击高亮的国家区块开始探索");
  };

  const selectCountry = (feature: WorldMapFeature) => {
    const countryId = feature.properties.id as WorldCountryId;
    if (!activeCountryIds.has(countryId)) return;
    if (completedCountryIds.has(countryId)) {
      setFeedback(`${feature.properties.name}已经点亮，请选择其他国家`);
      return;
    }
    setSelectedFeature(feature);
    setWrongCountryId(null);
    setAnswer("");
    setFeedback("观察区块位置与边界，填写国家名称");
  };

  const submitAnswer = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFeature || !selectedCountry || !answer.trim()) return;
    if (!worldCountryAnswerMatches(answer, selectedCountry)) {
      setWrongCountryId(selectedCountry.id);
      setFeedback("还不正确，可以结合所在地区与邻近国家再观察一次");
      return;
    }

    const next = new Set(completedCountryIds).add(selectedCountry.id);
    setCompletedCountryIds(next);
    setRevealedCountry(selectedCountry);
    recordWorldExploredCountry(progressStorage, selectedCountry.id);
    setSelectedFeature(null);
    setWrongCountryId(null);
    setAnswer("");
    if (next.size >= target) {
      onComplete(WORLD_LEVEL_ID.MAP_COUNTRY_NAMES);
      setFeedback(`${activeRoute.name}路线全部点亮，关卡完成！`);
    } else {
      setFeedback(
        `正确，是${selectedCountry.name}。首都线索已解锁`,
      );
    }
  };

  return (
    <>
      <section className="mb-4 grid grid-cols-[minmax(0,1fr)_280px] items-end gap-5 max-md:grid-cols-1">
        <div>
          <p className="m-0 text-meta font-black uppercase tracking-[0.2em] text-atlas-700">第 1 关 · 点亮世界</p>
          <h1 className="mb-2 mt-1 font-serif text-page font-bold max-sm:text-page-mobile">选择地区路线，逐国点亮地图</h1>
          <p className="m-0 text-body text-ink-soft">地图只开放当前路线内的国家。每次答对都会点亮国土，并解锁该国的首都线索。</p>
        </div>
        <label className="grid gap-1 text-meta font-bold text-ink-soft">
          当前探索路线
          <select
            className="min-h-11 w-full rounded-xl border border-atlas-500/25 bg-paper-100 px-3 text-compact font-black text-ink"
            value={activeRoute.id}
            onChange={(event) => selectRoute(event.target.value)}
          >
            {WORLD_MAP_ROUTES.map((route) => (
              <option key={route.id} value={route.id}>
                {route.name} · {route.countryIds.length} 国
              </option>
            ))}
          </select>
          <span className="text-meta font-medium text-ink-soft">切换路线会重置本轮进度</span>
        </label>
      </section>

      <section className="mb-4 rounded-[18px_18px_18px_6px] border border-atlas-500/20 bg-atlas-100/55 px-5 py-4">
        <div className="flex items-start justify-between gap-5 max-sm:block">
          <div>
            <p className="m-0 text-meta font-black text-atlas-700">{activeRoute.continentName} · 联合国 M49 地区组合</p>
            <h2 className="mb-1 mt-1 font-serif text-card-title font-bold">{activeRoute.name}探索路线</h2>
            <p className="m-0 text-compact text-ink-soft">{activeRoute.briefing}</p>
          </div>
          <strong className="mt-1 block shrink-0 font-numeric text-section text-atlas-700 max-sm:mt-3">
            {completedCountryIds.size}
            <span className="text-base text-ink-soft">/{target}</span>
          </strong>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-card" aria-label={`路线进度 ${completedCountryIds.size}/${target}`}>
          <span
            className="block h-full rounded-full bg-atlas-600 transition-[width] duration-500"
            style={{ width: `${target > 0 ? (completedCountryIds.size / target) * 100 : 0}%` }}
          />
        </div>
      </section>

      <WorldMapCanvas
        map={map}
        completedCountryIds={completedCountryIds}
        selectedCountryId={selectedCountry?.id ?? null}
        wrongCountryId={wrongCountryId}
        activeCountryIds={activeCountryIds}
        completedStateLabel="已点亮"
        ariaLabel={`${activeRoute.name}国家点亮挑战地图`}
        onCountry={selectCountry}
      />

      <section className="mt-4 grid grid-cols-[minmax(0,1fr)_320px] gap-4 max-lg:grid-cols-1">
        <div className="rounded-[20px_20px_20px_6px] border border-black/10 bg-card/90 p-5">
          {passed ? (
            <div className="text-center">
              <h2 className="m-0 font-serif text-section font-bold text-jade-800">{activeRoute.name}，全部点亮！</h2>
              <p className="mb-5 mt-2 text-body text-ink-soft">你已经辨认出这条路线上的 {target} 个国家，也把它们收进了探索册。</p>
              <div className="flex flex-wrap justify-center gap-2">
                <AppLink className="inline-flex min-h-11 items-center rounded-full bg-atlas-700 px-5 py-2.5 text-compact font-black text-white no-underline" href={routePath("/world/gauntlet")}>返回世界选关</AppLink>
                <button className="min-h-11 cursor-pointer rounded-full border border-atlas-500/25 bg-atlas-100 px-5 py-2.5 text-compact font-black text-atlas-800" type="button" onClick={() => selectRoute(activeRoute.id)}>重走这条路线</button>
              </div>
            </div>
          ) : (
            <form className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 max-sm:grid-cols-1" onSubmit={submitAnswer}>
              <label className="grid gap-1 text-meta font-bold text-ink-soft">
                {selectedCountry ? "这个国家是？" : "请先点击当前路线中高亮的国家"}
                <input className="min-h-11 rounded-xl border border-black/15 bg-paper-100 px-4 text-body text-ink outline-none focus:border-atlas-500 disabled:cursor-not-allowed disabled:opacity-60" disabled={!selectedCountry} value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="输入中文或英文国家名称" />
              </label>
              <button className="min-h-11 self-end rounded-full border-0 bg-atlas-700 px-6 py-2.5 text-compact font-black text-white disabled:cursor-not-allowed disabled:opacity-50" disabled={!selectedCountry || !answer.trim()} type="submit">确认答案</button>
            </form>
          )}
          <p className={`mb-0 mt-3 text-compact font-bold ${wrongCountryId ? "text-city-700" : "text-ink-soft"}`} aria-live="polite">{feedback}{!passed && remaining > 0 ? ` · 还差 ${remaining} 个` : ""}</p>
          {completedCountries.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5" aria-label="本路线已点亮国家">
              {completedCountries.map((country) => <span className="rounded-full bg-jade-100 px-2.5 py-1 text-meta font-bold text-jade-800" key={country.id}>{country.name}</span>)}
            </div>
          ) : null}
        </div>

        <aside className="rounded-[20px_20px_20px_6px] border border-gold-600/20 bg-gold-100/60 p-5" aria-live="polite">
          <p className="m-0 text-meta font-black uppercase tracking-[0.16em] text-gold-900">CAPITAL SIGNAL</p>
          {revealedCountry ? (
            <div key={revealedCountry.id}>
              <h2 className="mb-1 mt-2 font-serif text-card-title font-bold">{revealedCountry.name} · 首都线索已解锁</h2>
              <ul className="mb-0 mt-3 grid list-none gap-2 p-0">
                {revealedCountry.capitals.map((capital) => (
                  <li className="rounded-xl bg-card/75 px-3 py-2.5" key={`${revealedCountry.id}-${capital.englishName}`}>
                    <span className="mr-2 inline-block size-2 rounded-full bg-city-600" aria-hidden="true" />
                    <strong className="text-body">{capital.name}</strong>
                    <span className="ml-2 text-meta text-ink-soft">{capital.englishName}</span>
                    <small className="mt-1 block text-meta font-bold text-clay-700">{capital.role}</small>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div>
              <h2 className="mb-1 mt-2 font-serif text-card-title font-bold">等待第一束信号</h2>
              <p className="mb-0 mt-2 text-compact text-ink-soft">答对一个国家后，这里会出现它在 2026-09-20 时点采用的首都或行政中心资料。</p>
            </div>
          )}
        </aside>
      </section>
    </>
  );
}
