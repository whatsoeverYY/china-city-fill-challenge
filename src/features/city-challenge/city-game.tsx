"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PROVINCE_BY_CODE, PROVINCE_NEIGHBORS, PROVINCES, type Province } from "@/domain/geography/data/provinces";
import ChallengeAnswerDock from "@/features/city-challenge/components/challenge-answer-dock";
import ChallengeFooterAndOverlays from "@/features/city-challenge/components/challenge-footer-and-overlays";
import ChallengeHeader from "@/features/city-challenge/components/challenge-header";
import ChallengeMapPanel from "@/features/city-challenge/components/challenge-map-panel";
import { provinceForFeature } from "@/features/map/lib/map-geometry";
import { useMapCollection, useMapData, type MapFeature } from "@/features/map/model/map-data";
import { usePlayerData } from "@/features/player/player-data-context";
import {
  nationalChallengeMessage,
  useCityProgress,
} from "@/features/city-challenge/model/use-city-progress";
import { useCityMapView } from "@/features/city-challenge/model/use-city-map-view";
import { HARD_MODE_KEY, MAP_COMPLETION_MARKER, NEIGHBOR_MODE_KEY, NEIGHBOR_PROGRESS_KEY, STORAGE_KEY } from "@/infrastructure/storage/progress-storage";
import { placeNameMatches } from "@/shared/lib/place-name";
import { deterministicShuffle } from "@/shared/lib/random";
export default function CityGame() {
  const { identity, progressStorage, syncStatus } = usePlayerData();
  const [province, setProvince] = useState<Province | null>(null);
  const [showAllProvinceNames, setShowAllProvinceNames] = useState(false);
  const [showAllCityNames, setShowAllCityNames] = useState(false);
  const [hiddenProvinceCodes, setHiddenProvinceCodes] = useState<Set<string>>(
    new Set(),
  );
  const [completedNames, setCompletedNames] = useState<Set<string>>(new Set());
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hoveredName, setHoveredName] = useState<string | null>(null);
  const [wrongRegion, setWrongRegion] = useState<string | null>(null);
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
  const [dragGhost, setDragGhost] = useState<{
    name: string;
    x: number;
    y: number;
  } | null>(null);
  const manualAnswerInputRef = useRef<HTMLInputElement>(null);
  const touchDragRef = useRef<{
    name: string;
    startX: number;
    startY: number;
  } | null>(null);
  const { data: nationalMap, error: nationalError } = useMapData("100000");
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
  const answerNames = useMemo(
    () => detailMap?.features.map((feature) => feature.properties.name) ?? [],
    [detailMap],
  );
  const shuffledAnswers = useMemo(
    () =>
      deterministicShuffle(
        answerNames,
        `${province?.code ?? "1"}${neighborMode ? "7" : ""}`,
      ),
    [answerNames, neighborMode, province?.code],
  );
  const answerProvinceCodes = useMemo(
    () =>
      new Map(
        detailMap?.features.map((feature) => [
          feature.properties.name,
          feature.properties.provinceCode ?? "",
        ]) ?? [],
      ),
    [detailMap],
  );
  const visibleShuffledAnswers = useMemo(
    () =>
      shuffledAnswers.filter(
        (name) => !hiddenProvinceCodes.has(answerProvinceCodes.get(name) ?? ""),
      ),
    [answerProvinceCodes, hiddenProvinceCodes, shuffledAnswers],
  );
  const isChallengeComplete =
    Boolean(province) &&
    answerNames.length > 0 &&
    completedNames.size === answerNames.length;
  const activeCompletedProvinceCodes = neighborMode
    ? completedNeighborCodes
    : completedProvinceCodes;

  const enterProvince = useCallback(
    (nextProvince: Province) => {
      setProvince(nextProvince);
      const saved = (
        neighborMode ? neighborProgressRef.current : progressRef.current
      )[nextProvince.code] ?? [];
      setCompletedNames(
        new Set(saved.filter((name) => name !== MAP_COMPLETION_MARKER)),
      );
      setSelectedAnswer(null);
      setHoveredName(null);
      setWrongRegion(null);
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
    const validNames = new Set(answerNames);
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setCompletedNames((current) =>
        new Set(Array.from(current).filter((name) => validNames.has(name))),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [answerNames, detailMap, province]);

  const handleGuess = useCallback(
    (regionName: string, answer: string | null | undefined) => {
      if (!province || !detailMap) return;
      const guess = answer || selectedAnswer;
      if (!guess) {
        setMessage("先选择下方名称，再点击地图区块；也可以直接拖拽");
        return;
      }
      if (completedNames.has(regionName)) {
        setMessage(`${regionName}已经填好啦，试试其他区块`);
        return;
      }

      setAttempts((value) => value + 1);
      if (guess !== regionName) {
        setMistakes((value) => value + 1);
        setWrongRegion(regionName);
        setMessage(`“${guess}”不在这里，再观察一下边界形状`);
        window.setTimeout(() => setWrongRegion(null), 560);
        return;
      }

      const next = new Set(completedNames);
      next.add(regionName);
      const complete = next.size === detailMap.features.length;
      setCompletedNames(next);
      setSelectedAnswer(null);
      setMessage(
        complete
          ? neighborMode
            ? `${province.shortName}邻省连城挑战全部完成！`
            : `${province.name}全部完成！`
          : `正确！${regionName}已填入地图`,
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
      completedNames,
      detailMap,
      neighborMode,
      province,
      saveProgress,
      selectedAnswer,
      setCompletedNeighborCodes,
      setCompletedProvinceCodes,
    ],
  );

  const handleMapRegion = (feature: MapFeature, draggedAnswer?: string) => {
    if (hardMode) {
      if (province && completedNames.has(feature.properties.name)) {
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
    handleGuess(feature.properties.name, draggedAnswer);
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
    if (placeNameMatches(manualAnswer, [regionName])) {
      setPendingFeature(null);
      setManualAnswer("");
      setManualError("");
      handleGuess(regionName, regionName);
      return;
    }

    setAttempts((value) => value + 1);
    setMistakes((value) => value + 1);
    setWrongRegion(regionName);
    setManualError("名称不正确，再观察一下这个区块的形状和位置");
    window.setTimeout(() => setWrongRegion(null), 560);
  };

  const toggleHardMode = () => {
    const next = !hardMode;
    setHardMode(next);
    if (next) setShowAllProvinceNames(false);
    progressStorage.setItem(HARD_MODE_KEY, String(next));
    setPendingFeature(null);
    setManualAnswer("");
    setManualError("");
    setSelectedAnswer(null);
    setHoveredName(null);
    setMessage(
      next
        ? province
          ? neighborMode
            ? "邻省连城：点击联合地图区块并输入名称"
            : "难度提升：点击地图区块并输入名称"
          : "难度提升：点击省级行政区并输入名称解锁"
        : province
          ? neighborMode
            ? "名称卡片已恢复，完成整片联合区域吧"
            : "名称提示已恢复，可以拖拽或点选作答"
          : neighborMode
            ? "邻省连城：选择一个省份，联动它的所有接壤省份"
            : "省份名称已恢复，选择一个省级行政区开始挑战",
    );
  };

  const clearProvinceView = () => {
    setProvince(null);
    setSelectedAnswer(null);
    setHoveredName(null);
    setPendingFeature(null);
    setManualAnswer("");
    setManualError("");
    setShowAllCityNames(false);
    setHiddenProvinceCodes(new Set());
  };

  const toggleNeighborMode = () => {
    const next = !neighborMode;
    setNeighborMode(next);
    progressStorage.setItem(NEIGHBOR_MODE_KEY, String(next));
    clearProvinceView();
    setCompletedNames(new Set());
    setAttempts(0);
    setMistakes(0);
    setMessage(nationalChallengeMessage(hardMode, next));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetProvince = () => {
    if (!province) return;
    setCompletedNames(new Set());
    if (neighborMode) {
      setCompletedNeighborCodes((current) => {
        const next = new Set(current);
        next.delete(province.code);
        return next;
      });
      neighborProgressRef.current[province.code] = [];
      progressStorage.setItem(
        NEIGHBOR_PROGRESS_KEY,
        JSON.stringify(neighborProgressRef.current),
      );
    } else {
      setCompletedProvinceCodes((current) => {
        const next = new Set(current);
        next.delete(province.code);
        return next;
      });
      progressRef.current[province.code] = [];
      progressStorage.setItem(STORAGE_KEY, JSON.stringify(progressRef.current));
    }
    setSelectedAnswer(null);
    setShowAllCityNames(false);
    setHiddenProvinceCodes(new Set());
    setAttempts(0);
    setMistakes(0);
    setMessage(
      neighborMode
        ? `已重置以${province.shortName}为起点的联合挑战`
        : `已重置${province.shortName}，重新开始吧`,
    );
  };

  const backToNational = () => {
    clearProvinceView();
    setMessage(nationalChallengeMessage(hardMode, neighborMode));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleProvinceVisibility = (item: Province) => {
    const isHidden = hiddenProvinceCodes.has(item.code);
    if (!isHidden && challengeCodes.length - hiddenProvinceCodes.size <= 1) {
      setMessage("至少保留一个省份显示在联合地图中");
      return;
    }

    const next = new Set(hiddenProvinceCodes);
    if (isHidden) {
      next.delete(item.code);
      setMessage(`已重新显示${item.shortName}`);
    } else {
      next.add(item.code);
      if (selectedAnswer && answerProvinceCodes.get(selectedAnswer) === item.code) {
        setSelectedAnswer(null);
      }
      setMessage(`已隐藏${item.shortName}，再次点击名称可恢复`);
    }
    setHoveredName(null);
    setHiddenProvinceCodes(next);
  };

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
    <main className={`game-shell mx-auto min-h-dvh w-full max-w-[1540px] px-6 pb-10 pt-5 text-ink max-md:px-3 max-md:pb-24 max-md:pt-3 ${hardMode ? "is-hard-mode" : ""} ${neighborMode ? "is-neighbor-mode" : ""}`}>
      <ChallengeHeader
        province={province}
        neighborMode={neighborMode}
        hardMode={hardMode}
        completedProvinceCodes={activeCompletedProvinceCodes}
        challengeProvinces={challengeProvinces}
        answerCount={answerNames.length}
        onBack={backToNational}
        onToggleNeighborMode={toggleNeighborMode}
        onToggleHardMode={toggleHardMode}
      />

      {isChallengeComplete && province ? (
        <section className="success-banner mb-5 grid grid-cols-[auto_1fr_auto] items-center gap-3 overflow-hidden rounded-3xl bg-brand-green p-5 text-white shadow-lg" aria-live="polite">
          <span className="success-kicker text-xs font-black tracking-[0.15em]">挑战达成</span>
          <strong className="text-xl">{neighborMode ? `${province.shortName}邻省连城` : province.name}</strong>
          <span className="success-icon grid size-11 place-items-center rounded-full bg-white/15 text-2xl" aria-label="成功">✓</span>
          <p className="col-start-2 m-0 text-sm text-white/75">这片区域的每一个名字，都已回到正确的位置。</p>
        </section>
      ) : null}

      <div className={`challenge-layout grid grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)] items-start gap-5 max-lg:grid-cols-1 ${province ? "" : "is-national"} ${neighborMode ? "is-joined" : ""}`}>
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
        hoveredName={hoveredName}
        completedNames={completedNames}
        completedProvinceCodes={activeCompletedProvinceCodes}
        selectedAnswer={selectedAnswer}
        wrongRegion={wrongRegion}
        outlineFeatures={outlineFeatures}
        answerCount={answerNames.length}
        accuracy={accuracy}
        message={message}
        onBack={backToNational}
        onReset={resetProvince}
        onToggleProvinceVisibility={toggleProvinceVisibility}
        onMapRegion={handleMapRegion}
        setHoveredName={setHoveredName}
        setShowAllCityNames={setShowAllCityNames}
        setShowAllProvinceNames={setShowAllProvinceNames}
      />

      <ChallengeAnswerDock
        province={province}
        hardMode={hardMode}
        neighborMode={neighborMode}
        challengeProvinces={challengeProvinces}
        completedNames={completedNames}
        answerCount={answerNames.length}
        visibleAnswers={visibleShuffledAnswers}
        selectedAnswer={selectedAnswer}
        completedProvinceCodes={activeCompletedProvinceCodes}
        visibleProvinceList={visibleProvinceList}
        showAllProvinces={showAllProvinces}
        touchDragRef={touchDragRef}
        setSelectedAnswer={setSelectedAnswer}
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
