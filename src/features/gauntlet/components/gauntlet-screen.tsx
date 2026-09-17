"use client";

import { useEffect, useRef } from "react";

import GauntletAnswerPanel from "@/features/gauntlet/components/gauntlet-answer-panel";
import GauntletLobby from "@/features/gauntlet/components/gauntlet-lobby";
import GauntletOutcome from "@/features/gauntlet/components/gauntlet-outcome";
import GauntletQuestionStage from "@/features/gauntlet/components/gauntlet-question-stage";
import GauntletRoundHeader from "@/features/gauntlet/components/gauntlet-round-header";
import ProvincePickerDialog from "@/features/gauntlet/components/province-picker-dialog";
import {
  GAUNTLET_LEVEL_BY_ID,
  gauntletLevelNumber,
} from "@/domain/game/gauntlet-levels";
import type { GauntletLevelId } from "@/domain/game/gauntlet-level-ids";
import { useGauntletActions } from "@/features/gauntlet/hooks/use-gauntlet-actions";
import { useGauntletDerived } from "@/features/gauntlet/model/gauntlet-derived-context";
import { useGauntletSession } from "@/features/gauntlet/model/gauntlet-session-context";
import { MAP_REQUIRED_LEVELS } from "@/features/gauntlet/config/gauntlet-config";
import PageBreadcrumbs from "@/shared/components/page-breadcrumbs";
import { routePath } from "@/shared/lib/app-path";

export default function GauntletScreen({
  initialLevel,
}: {
  initialLevel: GauntletLevelId | null;
}) {
  const s = useGauntletSession();
  const d = useGauntletDerived();
  const actions = useGauntletActions();
  const initializationStarted = useRef(false);
  const displayedLevel = s.level ?? initialLevel;
  const displayedConfig = displayedLevel
    ? GAUNTLET_LEVEL_BY_ID.get(displayedLevel) ?? null
    : null;
  const displayNumber = displayedLevel ? gauntletLevelNumber(displayedLevel) : null;
  const roundEnded = d.hasTimedOut || d.hasLostBoss || Boolean(s.passedLevel);
  const initializationBlocked = Boolean(
    initialLevel &&
    s.provinceScopeReady &&
    (
      d.provinceScopeIssue(initialLevel) ||
      (MAP_REQUIRED_LEVELS.has(initialLevel) && s.nationalError)
    ),
  );
  const initializationPending = Boolean(
    initialLevel && !s.level && !initializationBlocked,
  );

  useEffect(() => {
    if (!initialLevel || initializationStarted.current || !s.provinceScopeReady) return;
    if (
      MAP_REQUIRED_LEVELS.has(initialLevel) &&
      !s.nationalMap &&
      !s.nationalError
    ) return;
    initializationStarted.current = true;
    if (
      d.provinceScopeIssue(initialLevel) ||
      (MAP_REQUIRED_LEVELS.has(initialLevel) && s.nationalError)
    ) {
      return;
    }
    actions.startLevel(initialLevel);
  }, [actions, d, initialLevel, s.nationalError, s.nationalMap, s.provinceScopeReady]);

  return (
    <main className={`game-shell gauntlet-shell mx-auto min-h-dvh w-[min(1460px,calc(100%_-_48px))] pb-10 pt-7 text-ink max-md:w-[min(680px,calc(100%_-_24px))] max-md:pb-24 max-md:pt-0 ${displayedLevel ? "is-round-active" : ""}`}>
      <header className="site-header gauntlet-header flex min-h-[62px] items-center border-b border-black/[.13] pb-[22px] max-md:sticky max-md:top-0 max-md:z-40 max-md:ml-[calc((100%-100vw)/2)] max-md:min-h-14 max-md:w-screen max-md:bg-card/95 max-md:px-3 max-md:pb-0 max-md:backdrop-blur-xl">
        <div className="brand inline-flex min-h-11 min-w-0 items-center gap-[13px] text-left">
          <span className="brand-seal gauntlet-brand-seal grid size-[45px] -rotate-2 place-items-center rounded-[9px_9px_9px_3px] bg-gold-600 font-serif text-[25px] font-bold text-gold-100 shadow-[inset_0_0_0_2px_rgba(255,248,231,.24)] max-md:size-[39px]" aria-hidden="true">关</span>
          <PageBreadcrumbs
            className="max-w-[min(920px,75vw)] max-md:max-w-[calc(100vw_-_88px)]"
            items={displayedConfig
              ? [
                  { label: "首页", href: routePath("/") },
                  { label: "过关斩将", mobileLabel: "闯关", href: routePath("/gauntlet") },
                  { label: `第 ${displayNumber} 关 · ${displayedConfig.title}`, mobileLabel: `第 ${displayNumber} 关` },
                ]
              : [
                  { label: "首页", href: routePath("/") },
                  { label: "过关斩将", mobileLabel: "闯关" },
                ]}
          />
        </div>
      </header>

      {initializationPending ? (
        <section className="grid min-h-[420px] place-items-center text-center text-compact font-extrabold text-ink-500" role="status">
          正在准备关卡…
        </section>
      ) : initializationBlocked ? (
        <section className="mx-auto mt-12 grid min-h-[360px] max-w-[680px] place-content-center justify-items-center gap-4 rounded-[24px_24px_24px_8px] border border-city-500/20 bg-card/90 p-8 text-center max-md:mt-5">
          <h1 className="m-0 font-serif text-section">当前设置无法开始这一关</h1>
          <p className="m-0 text-body text-ink-soft">{d.provinceScopeIssue(initialLevel!) ?? "关卡所需地图暂时无法载入。"}</p>
          <a className="inline-flex min-h-11 items-center rounded-full bg-city-500 px-5 py-2.5 text-compact font-black text-white no-underline" href={routePath("/gauntlet")}>返回选关</a>
        </section>
      ) : !s.level ? (
        <GauntletLobby actions={actions} />
      ) : roundEnded ? (
        <GauntletOutcome actions={actions} />
      ) : (
        <>
          <GauntletRoundHeader />
          <section
            className={`gauntlet-play-card grid min-h-[590px] grid-cols-[minmax(0,1.65fr)_minmax(330px,.8fr)] overflow-hidden rounded-3xl border border-black/15 bg-card/95 shadow-[0_30px_70px_rgba(57,46,31,.1)] max-[900px]:grid-cols-1 ${
              s.feedbackType === "wrong" ? "animate-[dialog-shake_300ms_ease]" : ""
            }`}
          >
            <GauntletQuestionStage actions={actions} />
            <GauntletAnswerPanel actions={actions} />
          </section>
        </>
      )}

      <ProvincePickerDialog actions={actions} />
    </main>
  );
}
