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
      <section className="answer-dock hard-mode-dock sticky top-4 flex h-[min(836px,calc(100vh-32px))] min-h-[520px] min-w-0 flex-col overflow-hidden rounded-[22px] border border-black/15 bg-[rgba(251,248,240,.96)] [background-image:radial-gradient(circle_at_100%_0%,rgba(180,59,50,.12),transparent_18rem)] p-[27px] shadow-[0_30px_70px_rgba(57,46,31,.1)] max-[900px]:static max-[900px]:mt-[22px] max-[900px]:block max-[900px]:h-auto max-[900px]:min-h-0 max-md:px-4 max-md:py-5 max-sm:rounded-[14px]" aria-labelledby="hard-city-title">
        <div className="dock-heading mb-[22px] flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow mb-[5px] mt-0 text-[11px] font-extrabold tracking-[0.24em] text-city-500">{neighborMode ? "邻省连城 · 无提示" : "无提示模式"}</p>
            <h2 className="m-0 font-serif text-section" id="hard-city-title">点区块，写名称</h2>
          </div>
        </div>
        <div className="hard-mode-card grid justify-items-center rounded-[14px] border border-dashed border-city-500/30 bg-paper-100/70 px-[18px] py-[26px] text-center">
          <span className="hard-mode-mark mb-[17px] grid size-[58px] -rotate-3 place-items-center rounded-[50%_50%_50%_16%] bg-city-500 font-serif text-[31px] font-bold text-gold-100 shadow-[0_8px_20px_rgba(125,41,36,.2)]" aria-hidden="true">?</span>
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
      <section className="answer-dock sticky top-4 flex h-[min(836px,calc(100vh-32px))] min-h-[520px] min-w-0 flex-col overflow-hidden rounded-[22px] border border-black/15 bg-card/90 p-[27px] shadow-[0_30px_70px_rgba(57,46,31,.1)] max-[900px]:static max-[900px]:mt-[22px] max-[900px]:block max-[900px]:h-auto max-[900px]:min-h-0 max-md:px-4 max-md:py-5 max-sm:rounded-[14px]" aria-labelledby="answer-title">
        <div className="dock-heading mb-[22px] grid flex-none items-start gap-[13px] max-[900px]:flex max-[900px]:items-end max-[900px]:gap-6">
          <div>
            <p className="eyebrow mb-[5px] mt-0 text-[11px] font-extrabold tracking-[0.24em] text-city-500">
              {neighborMode ? `${challengeProvinces.length} 省连城` : "名称卡片"}
            </p>
            <h2 className="m-0 font-serif text-section" id="answer-title">
              {neighborMode ? "让群城各归其位" : "把名字送回地图"}
            </h2>
          </div>
          <p className="m-0 text-[11px] leading-[1.6] text-ink-500 max-[900px]:ml-auto max-[900px]:max-w-[150px] max-[900px]:text-right max-sm:hidden"><span className="mouse-mark mr-[5px] inline-grid size-[22px] place-items-center rounded-md border border-stone-400" aria-hidden="true">↖</span> 拖拽到区块，或先点名称再点地图</p>
        </div>
        <div className="answer-grid grid min-h-0 flex-1 grid-cols-2 content-start gap-2.5 overflow-y-auto pb-[5px] pl-[3px] pr-[5px] max-[900px]:flex max-[900px]:max-h-none max-[900px]:flex-wrap max-[900px]:overflow-visible max-md:gap-2">
          {visibleAnswers.map((answer) => {
            const isPlaced = completedRegionIds.has(answer.id);
            const isSelected = selectedAnswerId === answer.id;
            return (
              <button
                key={answer.id}
                type="button"
                className={`answer-chip flex min-h-10 w-full min-w-0 touch-none select-none items-center gap-[7px] rounded-[9px] border px-3 py-2 pl-[9px] text-left text-[13px] leading-[1.35] shadow-[0_3px_0_rgba(95,77,49,.08)] transition max-[900px]:w-auto max-md:min-h-11 max-md:text-xs ${isPlaced ? "cursor-default border-ink-300 bg-jade-200 text-moss-400 opacity-65 shadow-none" : "cursor-grab border-paper-900 bg-paper-100 hover:-translate-y-0.5 hover:border-stone-500 hover:shadow-[0_5px_12px_rgba(75,59,34,.09)]"} ${isSelected ? "border-city-500 shadow-[0_0_0_3px_rgba(180,59,50,.12)]" : ""}`}
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
                {isPlaced ? <b className="ml-auto text-jade-500" aria-label="已完成">✓</b> : null}
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  if (hardMode) {
    return (
      <section className="province-dock hard-mode-dock sticky top-4 flex h-[min(782px,calc(100vh-32px))] min-h-[520px] min-w-0 flex-col overflow-hidden rounded-[18px] border border-black/15 bg-[rgba(251,248,240,.96)] [background-image:radial-gradient(circle_at_100%_0%,rgba(180,59,50,.12),transparent_18rem)] p-[27px] shadow-[0_16px_46px_rgba(57,46,31,.06)] max-[900px]:static max-[900px]:mt-[22px] max-[900px]:block max-[900px]:h-auto max-[900px]:min-h-0 max-md:px-4 max-md:py-5 max-sm:rounded-[14px]" aria-labelledby="hard-province-title">
        <div className="dock-heading mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="eyebrow m-0 text-xs font-black tracking-[0.18em] text-city-500">无提示模式</p>
            <h2 className="m-0 text-xl font-black" id="hard-province-title">辨认 {PROVINCES.length} 个省份</h2>
          </div>
        </div>
        <div className="hard-mode-card grid gap-3 rounded-2xl border border-dashed border-city-500/30 bg-city-500/5 p-5">
          <span className="hard-mode-mark grid size-12 place-items-center rounded-full bg-city-500 text-xl font-black text-white" aria-hidden="true">?</span>
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
                className={`grid aspect-square place-items-center rounded-lg text-[10px] font-bold ${complete ? "bg-jade-500 text-white" : "bg-black/5"}`}
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
    <section className="province-dock sticky top-4 flex h-[min(782px,calc(100vh-32px))] min-h-[520px] min-w-0 flex-col overflow-hidden rounded-[18px] border border-black/15 bg-card/90 p-[27px] shadow-[0_16px_46px_rgba(57,46,31,.06)] max-[900px]:static max-[900px]:mt-[22px] max-[900px]:block max-[900px]:h-auto max-[900px]:min-h-0 max-md:px-4 max-md:py-5 max-sm:rounded-[14px]" aria-labelledby="province-title">
      <div className="dock-heading mb-[22px] flex items-end justify-between gap-6">
        <div>
          <p className="eyebrow mb-[5px] mt-0 text-[11px] font-extrabold tracking-[0.24em] text-city-500">{PROVINCES.length} 个省级行政区</p>
          <h2 className="m-0 font-serif text-section" id="province-title">
            {neighborMode ? "选择连城起点" : "也可以从名称进入"}
          </h2>
        </div>
        <button
        className="text-button min-h-11 cursor-pointer border-0 bg-transparent p-1 text-xs font-bold text-city-900"
          type="button"
          onClick={() => setShowAllProvinces((value) => !value)}
        >
          {showAllProvinces ? "只看未完成" : "查看全部"}
        </button>
      </div>
      <div className="province-grid grid min-h-0 flex-1 grid-cols-2 content-start gap-2.5 overflow-y-auto pb-[5px] pl-[3px] pr-[5px] max-[900px]:max-h-none max-[900px]:overflow-visible max-sm:grid-cols-1">
        {visibleProvinceList.map((item, index) => {
          const complete = completedProvinceCodes.has(item.code);
          return (
            <button
              key={item.code}
              type="button"
              className={`province-chip grid min-h-[52px] min-w-0 cursor-pointer grid-cols-[auto_1fr_auto] items-center rounded-[10px] border px-3 py-2.5 text-left transition hover:-translate-y-0.5 hover:border-city-500 hover:bg-gold-100 ${complete ? "border-jade-400 bg-jade-200 text-jade-700" : "border-stone-300 bg-paper-100"}`}
              onClick={() => onEnterProvince(item)}
            >
              <span className="mr-[9px] font-serif text-meta text-stone-500">{String(index + 1).padStart(2, "0")}</span>
              <strong className="text-[13px] font-bold">{item.shortName}</strong>
              <i className={`text-[15px] not-italic ${complete ? "text-jade-500" : "text-city-500"}`}>{complete ? "✓" : "→"}</i>
            </button>
          );
        })}
      </div>
      {visibleProvinceList.length === 0 ? (
        <div className="all-complete-note rounded-2xl bg-jade-500/10 p-5 text-center font-black text-jade-700">
          {neighborMode
            ? `${PROVINCES.length} 个邻省连城起点已全部完成，太厉害了！`
            : `全国 ${PROVINCES.length} 个省级行政区已全部点亮，太厉害了！`}
        </div>
      ) : null}
    </section>
  );
}
