"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NATIONAL_MAP_CODE, PROVINCE_BY_CODE, PROVINCE_NEIGHBORS, PROVINCES, type Province } from "@/domain/geography/data/provinces";
import ChallengeAnswerDock from "@/features/city-challenge/components/challenge-answer-dock";
import ChallengeFooterAndOverlays from "@/features/city-challenge/components/challenge-footer-and-overlays";
import ChallengeHeader from "@/features/city-challenge/components/challenge-header";
import ChallengeMapPanel from "@/features/city-challenge/components/challenge-map-panel";
import { provinceForFeature } from "@/features/map/lib/map-geometry";
import {
  mapFeatureId,
  useMapCollection,
  useMapData,
  type MapFeature,
} from "@/features/map/model/map-data";
import { usePlayerData } from "@/features/player/player-data-context";
import { useCityProgress } from "@/features/city-challenge/model/use-city-progress";
import { useCityMapView } from "@/features/city-challenge/model/use-city-map-view";
import { MAP_COMPLETION_MARKER } from "@/infrastructure/storage/progress-storage";
import { placeNameMatches } from "@/shared/lib/place-name";
import { deterministicShuffle } from "@/shared/lib/random";
import { WRONG_REGION_FEEDBACK_MS } from "@/features/city-challenge/config/city-challenge-config";
import type {
  CityDragGhost,
  CityTouchDrag,
} from "@/features/city-challenge/model/city-challenge-types";
import { useCityChallengeControls } from "@/features/city-challenge/model/use-city-challenge-controls";
import { createCityAnswers, normalizeStoredRegionIds } from "@/features/city-challenge/model/city-answer-model";
export default function CityGame() {
  const { identity, progressStorage, syncStatus } = usePlayerData();
  const [province, setProvince] = useState<Province | null>(null);
  const [showAllProvinceNames, setShowAllProvinceNames] = useState(false);
  const [showAllCityNames, setShowAllCityNames] = useState(false);
  const [hiddenProvinceCodes, setHiddenProvinceCodes] = useState<Set<string>>(
    new Set(),
  );
  const [completedRegionIds, setCompletedRegionIds] = useState<Set<string>>(new Set());
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [hoveredFeature, setHoveredFeature] = useState<MapFeature | null>(null);
  const [wrongRegionId, setWrongRegionId] = useState<string | null>(null);
  const [message, setMessage] = useState("请选择一个省级行政区开始挑战");
  const {
    completedNeighborCodes,
    completedProvinceCodes,
    hardMode,
    neighborMode,
    neighborProgressRef,
    progressRef,
    saveProgress,
    setCompletedNeighborCodes,
    setCompletedProvinceCodes,
    setHardMode,
    setNeighborMode,
  } = useCityProgress(progressStorage, setMessage);
  const [attempts, setAttempts] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [showAllProvinces, setShowAllProvinces] = useState(false);
  const [pendingFeature, setPendingFeature] = useState<MapFeature | null>(null);
  const [manualAnswer, setManualAnswer] = useState("");
  const [manualError, setManualError] = useState("");
  const [dragGhost, setDragGhost] = useState<CityDragGhost | null>(null);
  const manualAnswerInputRef = useRef<HTMLInputElement>(null);
  const touchDragRef = useRef<CityTouchDrag | null>(null);
  const { data: nationalMap, error: nationalError } = useMapData(NATIONAL_MAP_CODE);
  const challengeProvinces = useMemo(() => {
    if (!province) return [];
    const codes = neighborMode
      ? [province.code, ...(PROVINCE_NEIGHBORS[province.code] ?? [])]
      : [province.code];
    return codes
      .map((code) => PROVINCE_BY_CODE.get(code))
      .filter((item): item is Province => Boolean(item));
  }, [neighborMode, province]);
  const challengeCodes = useMemo(
    () => challengeProvinces.map((item) => item.code),
    [challengeProvinces],
  );
  const { data: detailMap, error: detailError } = useMapCollection(challengeCodes);
  useEffect(() => {
    if (!pendingFeature) return;
    const frame = window.requestAnimationFrame(() => manualAnswerInputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [pendingFeature]);
  const answers = useMemo(() => createCityAnswers(detailMap), [detailMap]);
  const shuffledAnswers = useMemo(
    () =>
      deterministicShuffle(
        answers,
        `${province?.code ?? "1"}${neighborMode ? "7" : ""}`,
      ),
    [answers, neighborMode, province?.code],
  );
  const answerById = useMemo(
    () => new Map(answers.map((answer) => [answer.id, answer])),
    [answers],
  );
  const visibleShuffledAnswers = useMemo(
    () =>
      shuffledAnswers.filter(
        (answer) => !hiddenProvinceCodes.has(answer.provinceCode),
      ),
    [hiddenProvinceCodes, shuffledAnswers],
  );
  const isChallengeComplete =
    Boolean(province) &&
    answers.length > 0 &&
    completedRegionIds.size === answers.length;
  const activeCompletedProvinceCodes = neighborMode
    ? completedNeighborCodes
    : completedProvinceCodes;

  const enterProvince = useCallback(
    (nextProvince: Province) => {
      setProvince(nextProvince);
      const saved = (
        neighborMode ? neighborProgressRef.current : progressRef.current
      )[nextProvince.code] ?? [];
      setCompletedRegionIds(
        new Set(saved.filter((regionId) => regionId !== MAP_COMPLETION_MARKER)),
      );
      setSelectedAnswerId(null);
      setHoveredFeature(null);
      setWrongRegionId(null);
      setShowAllCityNames(false);
      setHiddenProvinceCodes(new Set());
      setAttempts(0);
      setMistakes(0);
      setMessage(
        hardMode
          ? neighborMode
            ? "邻省连城：点击联合地图区块并输入名称"
            : "难度提升：点击地图区块并输入名称"
          : neighborMode
          ? `把${nextProvince.shortName}及所有邻省的城市名称送回正确位置`
          : nextProvince.kind === "直辖市"
          ? `把区县名称放到${nextProvince.shortName}地图上的正确位置`
          : `把行政区名称放到${nextProvince.shortName}地图上的正确位置`,
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [hardMode, neighborMode, neighborProgressRef, progressRef],
  );

  useEffect(() => {
    if (!province || !detailMap) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setCompletedRegionIds((current) => normalizeStoredRegionIds(current, answers));
    });
    return () => {
      cancelled = true;
    };
  }, [answers, detailMap, province]);

  const handleGuess = useCallback(
    (regionId: string, answerId: string | null | undefined) => {
      if (!province || !detailMap) return;
      const guessId = answerId || selectedAnswerId;
      if (!guessId) {
        setMessage("先选择下方名称，再点击地图区块；也可以直接拖拽");
        return;
      }
      const region = answerById.get(regionId);
      const guess = answerById.get(guessId);
      if (!region || !guess) return;
      if (completedRegionIds.has(regionId)) {
        setMessage(`${region.name}已经填好啦，试试其他区块`);
        return;
      }

      setAttempts((value) => value + 1);
      if (guessId !== regionId) {
        setMistakes((value) => value + 1);
        setWrongRegionId(regionId);
        setMessage(`“${guess.name}”不在这里，再观察一下边界形状`);
        window.setTimeout(() => setWrongRegionId(null), WRONG_REGION_FEEDBACK_MS);
        return;
      }

      const next = new Set(completedRegionIds);
      next.add(regionId);
      const complete = next.size === detailMap.features.length;
      setCompletedRegionIds(next);
      setSelectedAnswerId(null);
      setMessage(
        complete
          ? neighborMode
            ? `${province.shortName}邻省连城挑战全部完成！`
            : `${province.name}全部完成！`
          : `正确！${region.name}已填入地图`,
      );
      saveProgress(province.code, next, complete, neighborMode);
      if (complete) {
        if (neighborMode) {
          setCompletedNeighborCodes((current) => new Set(current).add(province.code));
        } else {
          setCompletedProvinceCodes((current) => new Set(current).add(province.code));
        }
      }
    },
    [
      answerById,
      completedRegionIds,
      detailMap,
      neighborMode,
      province,
      saveProgress,
      selectedAnswerId,
      setCompletedNeighborCodes,
      setCompletedProvinceCodes,
    ],
  );

  const handleMapRegion = (feature: MapFeature, draggedAnswer?: string) => {
    const regionId = mapFeatureId(feature);
    if (hardMode) {
      if (province && completedRegionIds.has(regionId)) {
        setMessage(`${feature.properties.name}已经填好啦，试试其他区块`);
        return;
      }
      setPendingFeature(feature);
      setManualAnswer("");
      setManualError("");
      setMessage(
        province
          ? "已选中一个区块，请输入它的名称"
          : "已选中一个省级行政区，请输入名称解锁",
      );
      return;
    }
    if (!province) {
      const selectedProvince = provinceForFeature(feature);
      if (selectedProvince) enterProvince(selectedProvince);
      return;
    }
    handleGuess(regionId, draggedAnswer);
  };

  const submitManualAnswer = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pendingFeature) return;

    if (!province) {
      const selectedProvince = provinceForFeature(pendingFeature);
      if (
        selectedProvince &&
        placeNameMatches(manualAnswer, [selectedProvince.name, selectedProvince.shortName])
      ) {
        setPendingFeature(null);
        setManualAnswer("");
        setManualError("");
        enterProvince(selectedProvince);
        return;
      }
      setManualError("名称不正确，再观察一下它在全国地图中的位置");
      return;
    }

    const regionName = pendingFeature.properties.name;
    const regionId = mapFeatureId(pendingFeature);
    if (placeNameMatches(manualAnswer, [regionName])) {
      setPendingFeature(null);
      setManualAnswer("");
      setManualError("");
      handleGuess(regionId, regionId);
      return;
    }

    setAttempts((value) => value + 1);
    setMistakes((value) => value + 1);
    setWrongRegionId(regionId);
    setManualError("名称不正确，再观察一下这个区块的形状和位置");
    window.setTimeout(() => setWrongRegionId(null), WRONG_REGION_FEEDBACK_MS);
  };

  const {
    backToNational,
    resetProvince,
    toggleHardMode,
    toggleNeighborMode,
    toggleProvinceVisibility,
  } = useCityChallengeControls({
    answerById, challengeCodes, hardMode, hiddenProvinceCodes, neighborMode,
    neighborProgressRef, progressRef, progressStorage, province, selectedAnswerId,
    setAttempts, setCompletedNeighborCodes, setCompletedProvinceCodes,
    setCompletedRegionIds, setHardMode, setHiddenProvinceCodes, setHoveredFeature,
    setManualAnswer, setManualError, setMessage, setMistakes, setNeighborMode,
    setPendingFeature, setProvince, setSelectedAnswerId, setShowAllCityNames,
    setShowAllProvinceNames,
  });

  const visibleProvinceList = showAllProvinces
    ? PROVINCES
    : PROVINCES.filter((item) => !activeCompletedProvinceCodes.has(item.code));

  const { outlineFeatures, provinceFillColors } = useCityMapView(
    nationalMap,
    challengeCodes,
    challengeProvinces,
  );

  const mapError = province ? detailError : nationalError;
  const activeMap = province ? detailMap : nationalMap;
  const accuracy = attempts === 0 ? 100 : Math.round(((attempts - mistakes) / attempts) * 100);

  return (
    <main className="game-shell mx-auto min-h-dvh w-[min(1460px,calc(100%_-_48px))] pb-10 pt-7 text-ink max-md:w-[min(680px,calc(100%_-_24px))] max-md:pb-24 max-md:pt-[15px]">
      <ChallengeHeader
        province={province}
        neighborMode={neighborMode}
        hardMode={hardMode}
        completedProvinceCodes={activeCompletedProvinceCodes}
        challengeProvinces={challengeProvinces}
        answerCount={answers.length}
        onBack={backToNational}
        onToggleNeighborMode={toggleNeighborMode}
        onToggleHardMode={toggleHardMode}
      />

      {isChallengeComplete && province ? (
        <section className="success-banner mb-5 grid grid-cols-[auto_1fr_auto] items-center gap-3 overflow-hidden rounded-3xl bg-jade-500 p-5 text-white shadow-lg" aria-live="polite">
          <span className="success-kicker text-xs font-black tracking-[0.15em]">挑战达成</span>
          <strong className="text-xl">{neighborMode ? `${province.shortName}邻省连城` : province.name}</strong>
          <span className="success-icon grid size-11 place-items-center rounded-full bg-white/15 text-2xl" aria-label="成功">✓</span>
          <p className="col-start-2 m-0 text-sm text-white/75">这片区域的每一个名字，都已回到正确的位置。</p>
        </section>
      ) : null}

      <div className="challenge-layout grid grid-cols-[minmax(0,1fr)_minmax(310px,360px)] items-start gap-[22px] max-[1050px]:grid-cols-[minmax(0,1fr)_310px] max-[820px]:grid-cols-1">
      <ChallengeMapPanel
        province={province}
        neighborMode={neighborMode}
        hardMode={hardMode}
        challengeProvinces={challengeProvinces}
        hiddenProvinceCodes={hiddenProvinceCodes}
        provinceFillColors={provinceFillColors}
        showAllCityNames={showAllCityNames}
        showAllProvinceNames={showAllProvinceNames}
        mapError={mapError}
        activeMap={activeMap}
        isChallengeComplete={isChallengeComplete}
        hoveredFeature={hoveredFeature}
        completedRegionIds={completedRegionIds}
        completedProvinceCodes={activeCompletedProvinceCodes}
        wrongRegionId={wrongRegionId}
        outlineFeatures={outlineFeatures}
        answerCount={answers.length}
        accuracy={accuracy}
        message={message}
        onBack={backToNational}
        onReset={resetProvince}
        onToggleProvinceVisibility={toggleProvinceVisibility}
        onMapRegion={handleMapRegion}
        setHoveredFeature={setHoveredFeature}
        setShowAllCityNames={setShowAllCityNames}
        setShowAllProvinceNames={setShowAllProvinceNames}
      />

      <ChallengeAnswerDock
        province={province}
        hardMode={hardMode}
        neighborMode={neighborMode}
        challengeProvinces={challengeProvinces}
        completedRegionIds={completedRegionIds}
        answerCount={answers.length}
        visibleAnswers={visibleShuffledAnswers}
        selectedAnswerId={selectedAnswerId}
        completedProvinceCodes={activeCompletedProvinceCodes}
        visibleProvinceList={visibleProvinceList}
        showAllProvinces={showAllProvinces}
        touchDragRef={touchDragRef}
        setSelectedAnswerId={setSelectedAnswerId}
        setMessage={setMessage}
        setDragGhost={setDragGhost}
        setShowAllProvinces={setShowAllProvinces}
        onGuess={handleGuess}
        onEnterProvince={enterProvince}
      />
      </div>

      <ChallengeFooterAndOverlays
        signedIn={Boolean(identity)}
        syncStatus={syncStatus}
        provinceSelected={Boolean(province)}
        pendingFeature={pendingFeature}
        manualAnswer={manualAnswer}
        manualError={manualError}
        manualAnswerInputRef={manualAnswerInputRef}
        dragGhost={dragGhost}
        setPendingFeature={setPendingFeature}
        setManualAnswer={setManualAnswer}
        setManualError={setManualError}
        onSubmitManualAnswer={submitManualAnswer}
      />
    </main>
  );
}
