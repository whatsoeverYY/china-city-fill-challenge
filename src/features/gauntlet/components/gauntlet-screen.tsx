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
    <main className={`game-shell gauntlet-shell mx-auto min-h-dvh w-full max-w-[1540px] px-6 pb-10 pt-5 text-ink max-md:px-3 max-md:pb-24 max-md:pt-3 ${s.level ? "is-round-active" : ""}`}>
      <header className="site-header gauntlet-header mb-7 flex items-center justify-between gap-5 max-md:mb-5">
        <button className="brand inline-flex cursor-pointer items-center gap-3 border-0 bg-transparent p-0 text-left" type="button" onClick={s.onExit}>
          <span className="brand-seal gauntlet-brand-seal grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-red to-[#7c2d68] text-xl font-black text-white" aria-hidden="true">关</span>
          <span>
            <strong className="block whitespace-nowrap text-base font-black tracking-[0.08em]">中国城市填充挑战</strong>
            <small className="block text-[10px] font-bold tracking-[0.2em] text-ink-soft">GAUNTLET MODE</small>
          </span>
        </button>
        <button className="gauntlet-exit cursor-pointer rounded-full border border-black/15 bg-card px-4 py-2.5 text-xs font-black" type="button" onClick={s.onExit}>
          返回地图玩法
        </button>
      </header>

      {s.level ? (
        <nav className="gauntlet-mobile-nav sticky top-0 z-40 mb-4 hidden grid-cols-[auto_1fr_auto] items-center gap-2 rounded-xl bg-ink p-2 text-center text-white max-md:grid" aria-label="关卡导航">
          <button className="rounded-lg border-0 bg-white/10 px-2 py-2 text-[10px] font-black" type="button" onClick={actions.returnToLevels}>← 选关</button>
          <strong className="text-xs">
            第 {displayNumber} 关
            <small className="text-white/60"> · {d.target === 0 ? "暂无题目" : `${d.progress}/${d.target}`}</small>
          </strong>
          <button className="rounded-lg border-0 bg-white/10 px-2 py-2 text-[10px] font-black" type="button" onClick={s.onExit}>地图首页</button>
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
            className={`gauntlet-play-card grid grid-cols-[minmax(0,1.5fr)_minmax(290px,.7fr)] overflow-hidden rounded-[28px_28px_28px_8px] border border-black/10 bg-card shadow-xl max-lg:grid-cols-1 ${
              s.feedbackType === "wrong" ? "has-error animate-[dialog-shake_300ms_ease]" : ""
            } ${s.answerReview ? "is-reviewing" : ""}`}
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
