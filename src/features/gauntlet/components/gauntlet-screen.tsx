"use client";

import GauntletAnswerPanel from "@/features/gauntlet/components/gauntlet-answer-panel";
import GauntletLobby from "@/features/gauntlet/components/gauntlet-lobby";
import GauntletOutcome from "@/features/gauntlet/components/gauntlet-outcome";
import GauntletQuestionStage from "@/features/gauntlet/components/gauntlet-question-stage";
import GauntletRoundHeader from "@/features/gauntlet/components/gauntlet-round-header";
import ProvincePickerDialog from "@/features/gauntlet/components/province-picker-dialog";
import { gauntletLevelNumber } from "@/domain/game/gauntlet-levels";
import { useGauntletActions } from "@/features/gauntlet/hooks/use-gauntlet-actions";
import { useGauntletDerived } from "@/features/gauntlet/model/gauntlet-derived-context";
import { useGauntletSession } from "@/features/gauntlet/model/gauntlet-session-context";

export default function GauntletScreen() {
  const s = useGauntletSession();
  const d = useGauntletDerived();
  const actions = useGauntletActions();
  const displayNumber = s.level ? gauntletLevelNumber(s.level) : null;
  const roundEnded = d.hasTimedOut || d.hasLostBoss || Boolean(s.passedLevel);

  return (
    <main className={`game-shell gauntlet-shell mx-auto min-h-dvh w-[min(1460px,calc(100%_-_48px))] pb-10 pt-7 text-ink max-md:w-[min(680px,calc(100%_-_24px))] max-md:pb-24 max-md:pt-[15px] ${s.level ? "is-round-active" : ""}`}>
      <header className={`site-header gauntlet-header flex min-h-[62px] items-center justify-between border-b border-black/[.13] pb-[22px] max-md:mb-5 ${s.level ? "max-md:hidden" : ""}`}>
        <button className="brand inline-flex min-h-11 cursor-pointer items-center gap-[13px] border-0 bg-transparent p-0 text-left" type="button" onClick={s.onExit}>
          <span className="brand-seal gauntlet-brand-seal grid size-[45px] -rotate-2 place-items-center rounded-[9px_9px_9px_3px] bg-gold-600 font-serif text-[25px] font-bold text-gold-100 shadow-[inset_0_0_0_2px_rgba(255,248,231,.24)] max-md:size-[39px]" aria-hidden="true">关</span>
          <span>
            <strong className="block whitespace-nowrap font-serif text-lg font-bold tracking-[0.06em] max-md:text-sm">中国城市填充挑战</strong>
            <small className="mt-[3px] block text-meta font-bold tracking-[0.22em] text-ink-500 max-md:hidden">GAUNTLET MODE</small>
          </span>
        </button>
        <button className="gauntlet-exit min-h-10 cursor-pointer rounded-full border border-city-500/25 bg-paper-100/70 px-3.5 py-2 text-compact font-extrabold text-city-900 max-md:min-h-11" type="button" onClick={s.onExit}>
          返回地图玩法
        </button>
      </header>

      {s.level ? (
        <nav className="gauntlet-mobile-nav sticky top-0 z-40 mb-4 hidden min-h-12 grid-cols-[82px_minmax(0,1fr)_82px] items-center rounded-b-[13px] border-b border-black/15 bg-card/95 text-center shadow-[0_9px_24px_rgba(57,46,31,.1)] backdrop-blur-xl max-md:grid" aria-label="关卡导航">
          <button className="min-h-11 justify-self-start border-0 bg-transparent px-2 text-sm font-extrabold text-city-900" type="button" onClick={actions.returnToLevels}>← 选关</button>
          <strong className="truncate text-sm">
            第 {displayNumber} 关
            <small className="text-ink-soft"> · {d.target === 0 ? "暂无题目" : `${d.progress}/${d.target}`}</small>
          </strong>
          <button className="min-h-11 justify-self-end border-0 bg-transparent px-2 text-sm font-extrabold text-city-900" type="button" onClick={s.onExit}>地图首页</button>
        </nav>
      ) : null}

      {!s.level ? (
        <GauntletLobby actions={actions} />
      ) : roundEnded ? (
        <GauntletOutcome actions={actions} />
      ) : (
        <>
          <GauntletRoundHeader actions={actions} />
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
