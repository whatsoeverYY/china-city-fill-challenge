import type { Dispatch, RefObject, SetStateAction } from "react";
import { PROVINCES, type Province } from "@/domain/geography/data/provinces";
import type {
  CityAnswer,
  CityDragGhost,
  CityTouchDrag,
} from "@/features/city-challenge/model/city-challenge-types";

export default function ChallengeAnswerDock({
  province,
  hardMode,
  neighborMode,
  challengeProvinces,
  completedRegionIds,
  answerCount,
  visibleAnswers,
  selectedAnswerId,
  completedProvinceCodes,
  visibleProvinceList,
  showAllProvinces,
  touchDragRef,
  setSelectedAnswerId,
  setMessage,
  setDragGhost,
  setShowAllProvinces,
  onGuess,
  onEnterProvince,
}: {
  province: Province | null;
  hardMode: boolean;
  neighborMode: boolean;
  challengeProvinces: Province[];
  completedRegionIds: Set<string>;
  answerCount: number;
  visibleAnswers: CityAnswer[];
  selectedAnswerId: string | null;
  completedProvinceCodes: Set<string>;
  visibleProvinceList: Province[];
  showAllProvinces: boolean;
  touchDragRef: RefObject<CityTouchDrag | null>;
  setSelectedAnswerId: Dispatch<SetStateAction<string | null>>;
  setMessage: Dispatch<SetStateAction<string>>;
  setDragGhost: Dispatch<SetStateAction<CityDragGhost | null>>;
  setShowAllProvinces: Dispatch<SetStateAction<boolean>>;
  onGuess: (regionId: string, answerId?: string) => void;
  onEnterProvince: (province: Province) => void;
}) {
  if (province && hardMode) {
    return (
      <section className="answer-dock hard-mode-dock min-w-0 rounded-3xl border border-black/10 bg-card p-5 shadow-[0_20px_60px_rgba(43,48,43,0.08)]" aria-labelledby="hard-city-title">
        <div className="dock-heading mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="eyebrow m-0 text-xs font-black tracking-[0.18em] text-brand-red">{neighborMode ? "邻省连城 · 无提示" : "无提示模式"}</p>
            <h2 className="m-0 text-xl font-black" id="hard-city-title">点区块，写名称</h2>
          </div>
        </div>
        <div className="hard-mode-card grid gap-3 rounded-2xl border border-dashed border-brand-red/30 bg-brand-red/5 p-5">
          <span className="hard-mode-mark grid size-12 place-items-center rounded-full bg-brand-red text-xl font-black text-white" aria-hidden="true">?</span>
          <strong>城市名称已全部隐藏</strong>
          <p className="m-0 text-sm leading-6 text-ink-soft">
            {neighborMode
              ? `从 ${challengeProvinces.length} 个省级行政区的联合地图中挑选区块，输入城市、地区或区县名称。`
              : "从地图中挑选一个尚未填充的区块，输入它的城市、地区或区县名称。"}
          </p>
          <ol className="m-0 grid list-none gap-2 p-0 text-sm">
            <li className="flex items-center gap-2"><i className="grid size-5 place-items-center rounded-full bg-black/10 text-[10px] not-italic">1</i> 点击地图区块</li>
            <li className="flex items-center gap-2"><i className="grid size-5 place-items-center rounded-full bg-black/10 text-[10px] not-italic">2</i> 手动输入名称</li>
            <li className="flex items-center gap-2"><i className="grid size-5 place-items-center rounded-full bg-black/10 text-[10px] not-italic">3</i> 回答正确后填入地图</li>
          </ol>
        </div>
        <div className="hard-mode-summary mt-4 flex items-end justify-between rounded-2xl bg-ink p-4 text-white">
          <span className="text-xs">已识别</span>
          <strong className="text-2xl">{completedRegionIds.size}<i className="text-sm not-italic text-white/60"> / {answerCount}</i></strong>
        </div>
      </section>
    );
  }

  if (province) {
    return (
      <section className="answer-dock min-w-0 rounded-3xl border border-black/10 bg-card p-5 shadow-[0_20px_60px_rgba(43,48,43,0.08)]" aria-labelledby="answer-title">
        <div className="dock-heading mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="eyebrow m-0 text-xs font-black tracking-[0.18em] text-brand-red">
              {neighborMode ? `${challengeProvinces.length} 省连城` : "名称卡片"}
            </p>
            <h2 className="m-0 text-xl font-black" id="answer-title">
              {neighborMode ? "让群城各归其位" : "把名字送回地图"}
            </h2>
          </div>
          <p className="m-0 text-xs text-ink-soft"><span className="mouse-mark" aria-hidden="true">↖</span> 拖拽到区块，或先点名称再点地图</p>
        </div>
        <div className="answer-grid grid max-h-[620px] grid-cols-2 gap-2 overflow-y-auto pr-1 max-sm:grid-cols-1">
          {visibleAnswers.map((answer) => {
            const isPlaced = completedRegionIds.has(answer.id);
            const isSelected = selectedAnswerId === answer.id;
            return (
              <button
                key={answer.id}
                type="button"
                className={`answer-chip flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm font-bold transition ${isPlaced ? "cursor-default border-brand-green/20 bg-brand-green/10 text-brand-green-dark opacity-60" : "cursor-grab border-black/10 bg-white/65 hover:-translate-y-0.5 hover:border-brand-red/30 hover:shadow-sm"} ${isSelected ? "border-brand-red bg-brand-red/10" : ""}`}
                draggable={!isPlaced}
                disabled={isPlaced}
                aria-pressed={isSelected}
                onClick={() => {
                  if (isPlaced) return;
                  setSelectedAnswerId(isSelected ? null : answer.id);
                  setMessage(
                    isSelected
                      ? "已取消选择"
                      : `已选择“${answer.name}”，请点击地图中的位置`,
                  );
                }}
                onDragStart={(event) => {
                  event.dataTransfer.setData("text/plain", answer.id);
                  event.dataTransfer.effectAllowed = "move";
                  setSelectedAnswerId(answer.id);
                }}
                onDragEnd={() => setDragGhost(null)}
                onPointerDown={(event) => {
                  if (isPlaced || event.pointerType !== "touch") return;
                  event.currentTarget.setPointerCapture(event.pointerId);
                  touchDragRef.current = {
                    answer,
                    startX: event.clientX,
                    startY: event.clientY,
                  };
                  setDragGhost({ answer, x: event.clientX, y: event.clientY });
                }}
                onPointerMove={(event) => {
                  if (!touchDragRef.current || event.pointerType !== "touch") return;
                  setDragGhost({ answer, x: event.clientX, y: event.clientY });
                }}
                onPointerUp={(event) => {
                  const drag = touchDragRef.current;
                  if (!drag || event.pointerType !== "touch") return;
                  const distance = Math.hypot(
                    event.clientX - drag.startX,
                    event.clientY - drag.startY,
                  );
                  touchDragRef.current = null;
                  setDragGhost(null);
                  if (distance < 12) return;
                  const target = document
                    .elementFromPoint(event.clientX, event.clientY)
                    ?.closest<SVGPathElement>("[data-region-id]");
                  if (target?.dataset.regionId) {
                    onGuess(target.dataset.regionId, drag.answer.id);
                  } else {
                    setMessage(`“${drag.answer.name}”没有落在地图区块上，已回到名称区`);
                  }
                }}
              >
                <span className="chip-grip text-ink-soft/50" aria-hidden="true">⠿</span>
                <span>{answer.name}</span>
                {isPlaced ? <b className="ml-auto text-brand-green" aria-label="已完成">✓</b> : null}
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  if (hardMode) {
    return (
      <section className="province-dock hard-mode-dock min-w-0 rounded-3xl border border-black/10 bg-card p-5" aria-labelledby="hard-province-title">
        <div className="dock-heading mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="eyebrow m-0 text-xs font-black tracking-[0.18em] text-brand-red">无提示模式</p>
            <h2 className="m-0 text-xl font-black" id="hard-province-title">辨认 {PROVINCES.length} 个省份</h2>
          </div>
        </div>
        <div className="hard-mode-card grid gap-3 rounded-2xl border border-dashed border-brand-red/30 bg-brand-red/5 p-5">
          <span className="hard-mode-mark grid size-12 place-items-center rounded-full bg-brand-red text-xl font-black text-white" aria-hidden="true">?</span>
          <strong>省份名称已全部隐藏</strong>
          <p className="m-0 text-sm leading-6 text-ink-soft">
            点击全国地图中的任一区块，输入省份名称。回答正确后
            {neighborMode ? "展开它与接壤省份的联合挑战" : "进入该省挑战"}。
          </p>
        </div>
        <div className="blind-progress mt-4 grid grid-cols-7 gap-1.5 max-sm:grid-cols-6" aria-label={`已完成 ${completedProvinceCodes.size} 个挑战`}>
          {PROVINCES.map((item, index) => {
            const complete = completedProvinceCodes.has(item.code);
            return (
              <span
                key={item.code}
                className={`grid aspect-square place-items-center rounded-lg text-[10px] font-bold ${complete ? "bg-brand-green text-white" : "bg-black/5"}`}
                aria-label={`进度位 ${index + 1}${complete ? "，已完成" : "，未完成"}`}
              >
                {complete ? "✓" : index + 1}
              </span>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section className="province-dock min-w-0 rounded-3xl border border-black/10 bg-card p-5" aria-labelledby="province-title">
      <div className="dock-heading mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="eyebrow m-0 text-xs font-black tracking-[0.18em] text-brand-red">{PROVINCES.length} 个省级行政区</p>
          <h2 className="m-0 text-xl font-black" id="province-title">
            {neighborMode ? "选择连城起点" : "也可以从名称进入"}
          </h2>
        </div>
        <button
          className="text-button cursor-pointer border-0 bg-transparent p-1 text-xs font-black text-brand-red"
          type="button"
          onClick={() => setShowAllProvinces((value) => !value)}
        >
          {showAllProvinces ? "只看未完成" : "查看全部"}
        </button>
      </div>
      <div className="province-grid grid grid-cols-2 gap-2 max-sm:grid-cols-1">
        {visibleProvinceList.map((item, index) => {
          const complete = completedProvinceCodes.has(item.code);
          return (
            <button
              key={item.code}
              type="button"
              className={`province-chip grid cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-2 rounded-xl border border-black/10 px-3 py-2 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${complete ? "bg-brand-green/10 text-brand-green-dark" : "bg-white/65"}`}
              onClick={() => onEnterProvince(item)}
            >
              <span className="text-[10px] font-black text-ink-soft">{String(index + 1).padStart(2, "0")}</span>
              <strong className="font-black">{item.shortName}</strong>
              <i className="not-italic text-brand-red">{complete ? "✓" : "→"}</i>
            </button>
          );
        })}
      </div>
      {visibleProvinceList.length === 0 ? (
        <div className="all-complete-note rounded-2xl bg-brand-green/10 p-5 text-center font-black text-brand-green-dark">
          {neighborMode
            ? `${PROVINCES.length} 个邻省连城起点已全部完成，太厉害了！`
            : `全国 ${PROVINCES.length} 个省级行政区已全部点亮，太厉害了！`}
        </div>
      ) : null}
    </section>
  );
}
