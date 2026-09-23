"use client";

import { useMemo, useState } from "react";
import { WORLD_LEVEL_ID } from "@/domain/game/world-level-ids";
import { WORLD_CONTINENTS } from "@/domain/geography/data/world-continents";
import {
  WORLD_COUNTRY_BY_ID,
  type WorldCountry,
} from "@/domain/geography/data/world-countries";
import { worldCountryAnswerMatches } from "@/domain/geography/lib/world-country-answer";
import WorldCountrySilhouette from "@/features/map/components/world-country-silhouette";
import type {
  WorldMapData,
  WorldMapFeature,
} from "@/features/map/model/world-map-data";
import { usePlayerData } from "@/features/player/player-data-context";
import AppLink from "@/shared/components/app-link";
import { routePath } from "@/shared/lib/app-path";
import { randomShuffle } from "@/shared/lib/random";
import { WORLD_MAP_ROUTE_SEEDS } from "../config/world-map-route-seeds";
import { recordWorldExploredCountry } from "../model/record-world-exploration";

type AnswerResult = "correct" | "wrong" | null;

const MAX_QUESTIONS_PER_MISSION = 10;

function countriesForScope(
  eligibleFeatures: readonly WorldMapFeature[],
  scopeId: string,
) {
  if (scopeId === "all") return [...eligibleFeatures];
  return eligibleFeatures.filter((feature) =>
    WORLD_COUNTRY_BY_ID.get(feature.properties.id)?.continentId === scopeId
  );
}

function routeNameForCountry(country: WorldCountry) {
  return WORLD_MAP_ROUTE_SEEDS.find((route) =>
    route.subregions.includes(country.subregion)
  )?.name ?? country.subregion;
}

export default function WorldCountryShapeLevel({
  map,
  onComplete,
}: {
  map: WorldMapData;
  onComplete: (levelId: typeof WORLD_LEVEL_ID.COUNTRY_SHAPES) => void;
}) {
  const { progressStorage } = usePlayerData();
  const eligibleFeatures = useMemo(() => map.features.filter((feature) =>
    feature.properties.playable &&
    feature.properties.shapeEligible &&
    WORLD_COUNTRY_BY_ID.has(feature.properties.id)
  ), [map.features]);
  const scopeOptions = useMemo(() => [
    { id: "all", name: "全球混合", count: eligibleFeatures.length },
    ...WORLD_CONTINENTS
      .filter((continent) => continent.countryCount > 0)
      .map((continent) => ({
        id: continent.id,
        name: continent.name,
        count: countriesForScope(eligibleFeatures, continent.id).length,
      })),
  ], [eligibleFeatures]);
  const [scopeId, setScopeId] = useState("all");
  const [order, setOrder] = useState<WorldMapFeature[]>(() =>
    randomShuffle(eligibleFeatures)
  );
  const [questionIndex, setQuestionIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [attemptedAnswers, setAttemptedAnswers] = useState(0);
  const [totalCluesUsed, setTotalCluesUsed] = useState(0);
  const [revealedClueCount, setRevealedClueCount] = useState(0);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<AnswerResult>(null);
  const [feedback, setFeedback] = useState("先观察轮廓；需要时可逐层解锁线索");
  const target = Math.min(MAX_QUESTIONS_PER_MISSION, order.length);
  const passed = target > 0 && correctAnswers >= target;
  const currentFeature = order.length
    ? order[questionIndex % order.length]
    : null;
  const currentCountry = currentFeature
    ? WORLD_COUNTRY_BY_ID.get(currentFeature.properties.id) ?? null
    : null;
  const currentScope = scopeOptions.find((scope) => scope.id === scopeId)
    ?? scopeOptions[0];
  const accuracy = attemptedAnswers > 0
    ? Math.round((correctAnswers / attemptedAnswers) * 100)
    : 0;
  const clues = currentCountry ? [
    { label: "洲别信号", value: currentCountry.continentName },
    { label: "地区信号", value: routeNameForCountry(currentCountry) },
    {
      label: "首都信号",
      value: currentCountry.capitals.map((capital) => capital.name).join("、"),
    },
  ] : [];

  const resetMission = (nextScopeId: string) => {
    setScopeId(nextScopeId);
    setOrder(randomShuffle(countriesForScope(eligibleFeatures, nextScopeId)));
    setQuestionIndex(0);
    setCorrectAnswers(0);
    setAttemptedAnswers(0);
    setTotalCluesUsed(0);
    setRevealedClueCount(0);
    setAnswer("");
    setResult(null);
    setFeedback("新的侦察范围已就绪，先观察轮廓再决定是否调用线索");
  };

  const revealNextClue = () => {
    if (result || revealedClueCount >= clues.length) return;
    setRevealedClueCount((value) => value + 1);
    setTotalCluesUsed((value) => value + 1);
    setFeedback(`已接收${clues[revealedClueCount].label}，继续判断国家名称`);
  };

  const submitAnswer = (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentCountry || !answer.trim() || result) return;
    const correct = worldCountryAnswerMatches(answer, currentCountry);
    const nextAttemptedAnswers = attemptedAnswers + 1;
    setAttemptedAnswers(nextAttemptedAnswers);
    setResult(correct ? "correct" : "wrong");
    if (!correct) {
      setFeedback(`答案是${currentCountry.name}。先查看档案，再进入下一次侦察`);
      return;
    }

    const nextCorrectAnswers = correctAnswers + 1;
    setCorrectAnswers(nextCorrectAnswers);
    recordWorldExploredCountry(progressStorage, currentCountry.id);
    if (nextCorrectAnswers >= target) {
      onComplete(WORLD_LEVEL_ID.COUNTRY_SHAPES);
      setFeedback(`${currentScope.name}轮廓侦察完成！`);
    } else {
      setFeedback(`判断正确，是${currentCountry.name}。档案已加入探索册`);
    }
  };

  const nextQuestion = () => {
    const nextIndex = questionIndex + 1;
    if (nextIndex >= order.length) {
      setOrder(randomShuffle(order));
      setQuestionIndex(0);
    } else {
      setQuestionIndex(nextIndex);
    }
    setAnswer("");
    setResult(null);
    setRevealedClueCount(0);
    setFeedback("新轮廓已送达，先观察整体比例与海岸线");
  };

  if (!currentFeature || !currentCountry) {
    return <p className="rounded-2xl bg-card p-8 text-center text-body text-ink-soft">正在准备国家轮廓…</p>;
  }

  return (
    <>
      <section className="mb-4 grid grid-cols-[minmax(0,1fr)_280px] items-end gap-5 max-md:grid-cols-1">
        <div>
          <p className="m-0 text-meta font-black uppercase tracking-[0.2em] text-clay-700">第 2 关 · 轮廓侦察</p>
          <h1 className="mb-2 mt-1 font-serif text-page font-bold max-sm:text-page-mobile">逐层接收线索，辨认国家轮廓</h1>
          <p className="m-0 text-body text-ink-soft">轮廓保持北向朝上。可以直接作答，也可以依次解锁洲别、地区和首都信号；答错不再清空进度。</p>
        </div>
        <label className="grid gap-1 text-meta font-bold text-ink-soft">
          侦察范围
          <select
            className="min-h-11 w-full rounded-xl border border-clay-500/25 bg-paper-100 px-3 text-compact font-black text-ink"
            value={scopeId}
            onChange={(event) => resetMission(event.target.value)}
          >
            {scopeOptions.map((scope) => (
              <option key={scope.id} value={scope.id}>
                {scope.name} · {scope.count} 个有效轮廓
              </option>
            ))}
          </select>
          <span className="text-meta font-medium text-ink-soft">切换范围会重置本轮进度</span>
        </label>
      </section>

      <section className="mb-4 grid grid-cols-3 gap-3 max-sm:gap-2">
        {[
          [String(correctAnswers), `已识别 / ${target}`],
          [String(attemptedAnswers), "累计判断"],
          [String(totalCluesUsed), "调用线索"],
        ].map(([value, label]) => (
          <div className="rounded-[16px_16px_16px_5px] border border-clay-500/15 bg-clay-100/55 px-3 py-3 text-center max-sm:px-2" key={label}>
            <strong className="block font-numeric text-card-title text-clay-800">{value}</strong>
            <span className="mt-1 block text-meta font-bold text-ink-soft">{label}</span>
          </div>
        ))}
      </section>

      <section className="rounded-[24px_24px_24px_7px] border border-clay-500/20 bg-card/85 p-5 shadow-lg max-sm:p-3">
        {passed ? (
          <div className="grid min-h-[420px] place-items-center text-center">
            <div>
              <span className="mx-auto mb-5 grid size-20 place-items-center rounded-full bg-jade-500 font-serif text-3xl font-black text-white" aria-hidden="true">明</span>
              <h2 className="m-0 font-serif text-section font-bold">{currentScope.name}轮廓侦察完成！</h2>
              <p className="mb-1 mt-3 text-body text-ink-soft">成功辨认 {target} 个国家，判断正确率 {accuracy}%。</p>
              <p className="mb-5 mt-1 text-compact text-ink-soft">本轮共调用 {totalCluesUsed} 条线索，答对的国家已经收入探索册。</p>
              <div className="flex flex-wrap justify-center gap-2">
                <AppLink className="inline-flex min-h-11 items-center rounded-full bg-atlas-700 px-5 py-2.5 text-compact font-black text-white no-underline" href={routePath("/world/gauntlet")}>返回世界选关</AppLink>
                <button className="min-h-11 cursor-pointer rounded-full border border-clay-500/25 bg-clay-100 px-5 py-2.5 text-compact font-black text-clay-800" type="button" onClick={() => resetMission(scopeId)}>再次侦察</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-[minmax(0,1fr)_330px] gap-5 max-lg:grid-cols-1">
            <div>
              <div className="relative mx-auto max-w-[760px] rounded-2xl bg-paper-200/65 p-3">
                <span className="absolute left-4 top-4 z-10 rounded-full border border-black/10 bg-card/90 px-3 py-1 text-meta font-black text-ink-soft" aria-hidden="true">N ↑</span>
                <WorldCountrySilhouette feature={currentFeature} ariaLabel={`第 ${attemptedAnswers + (result ? 0 : 1)} 次侦察的待辨认国家轮廓`} />
              </div>

              {result ? (
                <section className={`mt-4 rounded-[18px_18px_18px_6px] border p-5 ${result === "correct" ? "border-jade-500/25 bg-jade-100/65" : "border-city-500/20 bg-city-100/55"}`} aria-live="polite">
                  <p className={`m-0 text-meta font-black ${result === "correct" ? "text-jade-800" : "text-city-800"}`}>{result === "correct" ? "侦察命中" : "档案校准"}</p>
                  <h2 className="mb-1 mt-1 font-serif text-section font-bold">{currentCountry.name}</h2>
                  <p className="m-0 text-compact text-ink-soft">{currentCountry.englishName} · {currentCountry.continentName} · {routeNameForCountry(currentCountry)}</p>
                  <p className="mb-4 mt-3 text-compact font-bold text-clay-800">首都或行政中心：{currentCountry.capitals.map((capital) => capital.name).join("、")}</p>
                  <button className="min-h-11 cursor-pointer rounded-full border-0 bg-clay-700 px-5 py-2.5 text-compact font-black text-white" type="button" onClick={nextQuestion}>进入下一次侦察</button>
                </section>
              ) : (
                <form className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] gap-3 max-sm:grid-cols-1" onSubmit={submitAnswer}>
                  <label className="grid gap-1 text-meta font-bold text-ink-soft">
                    这个国家是？
                    <input className="min-h-11 rounded-xl border border-black/15 bg-paper-100 px-4 text-body text-ink outline-none focus:border-clay-500" value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="输入中文或英文名称" />
                  </label>
                  <button className="min-h-11 self-end rounded-full border-0 bg-clay-700 px-6 py-2.5 text-compact font-black text-white disabled:cursor-not-allowed disabled:opacity-50" disabled={!answer.trim()} type="submit">提交判断</button>
                </form>
              )}
              <p className={`mb-0 mt-3 text-center text-compact font-bold ${result === "wrong" ? "text-city-700" : "text-ink-soft"}`} aria-live="polite">{feedback}</p>
            </div>

            <aside className="rounded-[20px_20px_20px_6px] border border-gold-600/20 bg-gold-100/55 p-5">
              <p className="m-0 text-meta font-black uppercase tracking-[0.16em] text-gold-900">SIGNAL SCAN</p>
              <h2 className="mb-2 mt-2 font-serif text-card-title font-bold">渐进式侦察信号</h2>
              <p className="m-0 text-compact text-ink-soft">每次只展开一层信息；越少使用线索，越能检验对轮廓的真实记忆。</p>
              <ol className="mb-0 mt-4 grid list-none gap-2 p-0">
                {clues.map((clue, index) => {
                  const revealed = index < revealedClueCount;
                  return (
                    <li className={`rounded-xl border px-3 py-3 ${revealed ? "border-gold-600/20 bg-card/80" : "border-black/10 bg-paper-200/45"}`} key={clue.label}>
                      <span className="text-meta font-black text-ink-soft">信号 {index + 1} · {clue.label}</span>
                      <strong className={`mt-1 block text-body ${revealed ? "text-ink" : "text-ink-soft/45"}`}>{revealed ? clue.value : "等待解锁"}</strong>
                    </li>
                  );
                })}
              </ol>
              <button className="mt-4 min-h-11 w-full cursor-pointer rounded-full border-0 bg-gold-800 px-4 py-2.5 text-compact font-black text-white disabled:cursor-not-allowed disabled:opacity-45" type="button" disabled={Boolean(result) || revealedClueCount >= clues.length} onClick={revealNextClue}>
                {revealedClueCount < clues.length ? `解锁信号 ${revealedClueCount + 1}` : "全部信号已接收"}
              </button>
              <p className="mb-0 mt-3 text-meta font-bold text-ink-soft">国家与首都资料统计时间：2026-09-20</p>
            </aside>
          </div>
        )}
      </section>
    </>
  );
}
