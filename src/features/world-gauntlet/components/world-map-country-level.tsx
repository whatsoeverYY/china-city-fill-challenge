"use client";

import { useMemo, useState } from "react";
import { WORLD_LEVEL_ID } from "@/domain/game/world-level-ids";
import {
  WORLD_COUNTRIES,
  WORLD_COUNTRY_BY_ID,
} from "@/domain/geography/data/world-countries";
import { worldCountryAnswerMatches } from "@/domain/geography/lib/world-country-answer";
import WorldMapCanvas from "@/features/map/components/world-map-canvas";
import type { WorldMapData, WorldMapFeature } from "@/features/map/model/world-map-data";
import AppLink from "@/shared/components/app-link";
import { routePath } from "@/shared/lib/app-path";

const TARGET = 30;

export default function WorldMapCountryLevel({
  map,
  onComplete,
}: {
  map: WorldMapData;
  onComplete: (levelId: typeof WORLD_LEVEL_ID.MAP_COUNTRY_NAMES) => void;
}) {
  const [completedCountryIds, setCompletedCountryIds] = useState<Set<string>>(new Set());
  const [selectedFeature, setSelectedFeature] = useState<WorldMapFeature | null>(null);
  const [wrongCountryId, setWrongCountryId] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("点击地图上的任一国家区块开始填写");
  const passed = completedCountryIds.size >= TARGET;
  const remaining = TARGET - completedCountryIds.size;
  const selectedCountry = selectedFeature
    ? WORLD_COUNTRY_BY_ID.get(selectedFeature.properties.id)
    : null;
  const completedCountries = useMemo(
    () => WORLD_COUNTRIES.filter((country) => completedCountryIds.has(country.id)),
    [completedCountryIds],
  );

  const selectCountry = (feature: WorldMapFeature) => {
    if (completedCountryIds.has(feature.properties.id)) {
      setFeedback(`${feature.properties.name}已经填写正确，请选择其他国家`);
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
      setFeedback("还不正确，可以结合所在洲与邻近国家再观察一次");
      return;
    }
    const next = new Set(completedCountryIds).add(selectedCountry.id);
    setCompletedCountryIds(next);
    setSelectedFeature(null);
    setWrongCountryId(null);
    setAnswer("");
    if (next.size >= TARGET) {
      onComplete(WORLD_LEVEL_ID.MAP_COUNTRY_NAMES);
      setFeedback("30 个国家全部落名，关卡完成！");
    } else {
      setFeedback(`正确，是${selectedCountry.name}。再完成 ${TARGET - next.size} 个不同国家即可过关`);
    }
  };

  return (
    <>
      <section className="mb-4 grid grid-cols-[1fr_auto] items-end gap-4 max-sm:grid-cols-1">
        <div>
          <p className="m-0 text-meta font-black uppercase tracking-[0.2em] text-atlas-700">第 1 关 · 世界落名</p>
          <h1 className="mb-2 mt-1 font-serif text-page font-bold max-sm:text-page-mobile">看世界地图，填写国家名称</h1>
          <p className="m-0 text-body text-ink-soft">点击任意未完成国家，再输入中文或英文名称。累计答对 30 个不同国家即可通关。</p>
        </div>
        <strong className="font-numeric text-section text-atlas-700">{completedCountryIds.size}<span className="text-base text-ink-soft">/{TARGET}</span></strong>
      </section>

      <WorldMapCanvas map={map} completedCountryIds={completedCountryIds} selectedCountryId={selectedCountry?.id ?? null} wrongCountryId={wrongCountryId} onCountry={selectCountry} />

      <section className="mt-4 rounded-[20px_20px_20px_6px] border border-black/10 bg-card/90 p-5">
        {passed ? (
          <div className="text-center">
            <h2 className="m-0 font-serif text-section font-bold text-jade-800">世界落名，通关！</h2>
            <p className="mb-5 mt-2 text-body text-ink-soft">你已经在地图上正确填写了 30 个不同国家。</p>
            <AppLink className="inline-flex min-h-11 items-center rounded-full bg-atlas-700 px-5 py-2.5 text-compact font-black text-white no-underline" href={routePath("/world/gauntlet")}>返回世界选关</AppLink>
          </div>
        ) : (
          <form className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 max-sm:grid-cols-1" onSubmit={submitAnswer}>
            <label className="grid gap-1 text-meta font-bold text-ink-soft">
              {selectedCountry ? "这个国家是？" : "请先点击一个国家区块"}
              <input className="min-h-11 rounded-xl border border-black/15 bg-paper-100 px-4 text-body text-ink outline-none focus:border-atlas-500 disabled:cursor-not-allowed disabled:opacity-60" disabled={!selectedCountry} value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="输入国家名称" />
            </label>
            <button className="min-h-11 self-end rounded-full border-0 bg-atlas-700 px-6 py-2.5 text-compact font-black text-white disabled:cursor-not-allowed disabled:opacity-50" disabled={!selectedCountry || !answer.trim()} type="submit">确认答案</button>
          </form>
        )}
        <p className={`mb-0 mt-3 text-compact font-bold ${wrongCountryId ? "text-city-700" : "text-ink-soft"}`} aria-live="polite">{feedback}{!passed && remaining > 0 ? ` · 还差 ${remaining} 个` : ""}</p>
        {completedCountries.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5" aria-label="本轮已填写国家">
            {completedCountries.map((country) => <span className="rounded-full bg-jade-100 px-2.5 py-1 text-meta font-bold text-jade-800" key={country.id}>{country.name}</span>)}
          </div>
        ) : null}
      </section>
    </>
  );
}
