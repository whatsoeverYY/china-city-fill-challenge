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
    <main className={`game-shell gauntlet-shell min-h-dvh ${s.level ? "is-round-active" : ""}`}>
      <header className="site-header gauntlet-header">
        <button className="brand" type="button" onClick={s.onExit}>
          <span className="brand-seal gauntlet-brand-seal" aria-hidden="true">关</span>
          <span>
            <strong>中国城市填充挑战</strong>
            <small>GAUNTLET MODE</small>
          </span>
        </button>
        <button className="gauntlet-exit" type="button" onClick={s.onExit}>
          返回地图玩法
        </button>
      </header>

      {s.level ? (
        <nav className="gauntlet-mobile-nav" aria-label="关卡导航">
          <button type="button" onClick={actions.returnToLevels}>← 选关</button>
          <strong>
            第 {displayNumber} 关
            <small> · {d.target === 0 ? "暂无题目" : `${d.progress}/${d.target}`}</small>
          </strong>
          <button type="button" onClick={s.onExit}>地图首页</button>
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
            className={`gauntlet-play-card ${
              s.feedbackType === "wrong" ? "has-error" : ""
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
