"use client";

import { useMemo, useState } from "react";
import { WORLD_LEVEL_ID } from "@/domain/game/world-level-ids";
import { WORLD_COUNTRY_BY_ID } from "@/domain/geography/data/world-countries";
import { worldCountryAnswerMatches } from "@/domain/geography/lib/world-country-answer";
import WorldCountrySilhouette from "@/features/map/components/world-country-silhouette";
import type { WorldMapData, WorldMapFeature } from "@/features/map/model/world-map-data";
import AppLink from "@/shared/components/app-link";
import { routePath } from "@/shared/lib/app-path";
import { randomShuffle } from "@/shared/lib/random";

const TARGET = 20;

export default function WorldCountryShapeLevel({
  map,
  onComplete,
}: {
  map: WorldMapData;
  onComplete: (levelId: typeof WORLD_LEVEL_ID.COUNTRY_SHAPES) => void;
}) {
  const eligibleFeatures = useMemo(() => map.features.filter((feature) =>
    feature.properties.playable &&
    feature.properties.shapeEligible &&
    WORLD_COUNTRY_BY_ID.has(feature.properties.id)
  ), [map.features]);
  const [order] = useState<WorldMapFeature[]>(() => randomShuffle(eligibleFeatures));
  const [questionIndex, setQuestionIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("观察轮廓，填写国家名称");
  const [wrong, setWrong] = useState(false);
  const passed = streak >= TARGET;
  const currentFeature = order.length
    ? order[questionIndex % order.length]
    : null;
  const currentCountry = currentFeature
    ? WORLD_COUNTRY_BY_ID.get(currentFeature.properties.id)
    : null;

  const submitAnswer = (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentCountry || !answer.trim()) return;
    const correct = worldCountryAnswerMatches(answer, currentCountry);
    setAnswer("");
    setQuestionIndex((value) => value + 1);
    if (!correct) {
      setStreak(0);
      setWrong(true);
      setFeedback(`答案是${currentCountry.name}。连胜已重置，下一题继续`);
      return;
    }
    const nextStreak = streak + 1;
    setWrong(false);
    setStreak(nextStreak);
    if (nextStreak >= TARGET) {
      onComplete(WORLD_LEVEL_ID.COUNTRY_SHAPES);
      setFeedback("连续答对 20 题，关卡完成！");
    } else {
      setFeedback(`正确，是${currentCountry.name}。当前 ${nextStreak} 连胜`);
    }
  };

  if (!currentFeature || !currentCountry) {
    return <p className="rounded-2xl bg-card p-8 text-center text-body text-ink-soft">正在准备国家轮廓…</p>;
  }

  return (
    <>
      <section className="mb-4 grid grid-cols-[1fr_auto] items-end gap-4 max-sm:grid-cols-1">
        <div>
          <p className="m-0 text-meta font-black uppercase tracking-[0.2em] text-clay-700">第 2 关 · 国形辨影</p>
          <h1 className="mb-2 mt-1 font-serif text-page font-bold max-sm:text-page-mobile">根据地图形状，写出国家名称</h1>
          <p className="m-0 text-body text-ink-soft">轮廓保持北向朝上。连续答对 20 题即可通关，答错后连胜重新计算。</p>
        </div>
        <strong className="font-numeric text-section text-clay-700">{streak}<span className="text-base text-ink-soft">/{TARGET} 连胜</span></strong>
      </section>

      <section className="rounded-[24px_24px_24px_7px] border border-clay-500/20 bg-card/85 p-5 shadow-lg">
        {passed ? (
          <div className="grid min-h-[420px] place-items-center text-center">
            <div>
              <span className="mx-auto mb-5 grid size-20 place-items-center rounded-full bg-jade-500 font-serif text-3xl font-black text-white" aria-hidden="true">胜</span>
              <h2 className="m-0 font-serif text-section font-bold">国形辨影，通关！</h2>
              <p className="mb-5 mt-2 text-body text-ink-soft">你已连续辨认出 20 个国家轮廓。</p>
              <AppLink className="inline-flex min-h-11 items-center rounded-full bg-atlas-700 px-5 py-2.5 text-compact font-black text-white no-underline" href={routePath("/world/gauntlet")}>返回世界选关</AppLink>
            </div>
          </div>
        ) : (
          <>
            <div className="mx-auto max-w-[760px] rounded-2xl bg-paper-200/65 p-3">
              <WorldCountrySilhouette feature={currentFeature} />
            </div>
            <form className="mx-auto mt-5 grid max-w-[700px] grid-cols-[minmax(0,1fr)_auto] gap-3 max-sm:grid-cols-1" onSubmit={submitAnswer}>
              <label className="grid gap-1 text-meta font-bold text-ink-soft">
                这个国家是？
                <input className="min-h-11 rounded-xl border border-black/15 bg-paper-100 px-4 text-body text-ink outline-none focus:border-clay-500" value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="输入中文或英文名称" />
              </label>
              <button className="min-h-11 self-end rounded-full border-0 bg-clay-700 px-6 py-2.5 text-compact font-black text-white disabled:opacity-50" disabled={!answer.trim()} type="submit">确认答案</button>
            </form>
            <p className={`mb-0 mt-3 text-center text-compact font-bold ${wrong ? "text-city-700" : "text-ink-soft"}`} aria-live="polite">{feedback}</p>
          </>
        )}
      </section>
    </>
  );
}
