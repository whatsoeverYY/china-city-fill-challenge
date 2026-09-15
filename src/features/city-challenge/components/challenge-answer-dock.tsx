import type { Dispatch, RefObject, SetStateAction } from "react";
import { PROVINCES, type Province } from "@/domain/geography/data/provinces";

type TouchDrag = { name: string; startX: number; startY: number };
type DragGhost = { name: string; x: number; y: number };

export default function ChallengeAnswerDock({
  province,
  hardMode,
  neighborMode,
  challengeProvinces,
  completedNames,
  answerCount,
  visibleAnswers,
  selectedAnswer,
  completedProvinceCodes,
  visibleProvinceList,
  showAllProvinces,
  touchDragRef,
  setSelectedAnswer,
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
  completedNames: Set<string>;
  answerCount: number;
  visibleAnswers: string[];
  selectedAnswer: string | null;
  completedProvinceCodes: Set<string>;
  visibleProvinceList: Province[];
  showAllProvinces: boolean;
  touchDragRef: RefObject<TouchDrag | null>;
  setSelectedAnswer: Dispatch<SetStateAction<string | null>>;
  setMessage: Dispatch<SetStateAction<string>>;
  setDragGhost: Dispatch<SetStateAction<DragGhost | null>>;
  setShowAllProvinces: Dispatch<SetStateAction<boolean>>;
  onGuess: (regionName: string, answer?: string) => void;
  onEnterProvince: (province: Province) => void;
}) {
  if (province && hardMode) {
    return (
      <section className="answer-dock hard-mode-dock" aria-labelledby="hard-city-title">
        <div className="dock-heading">
          <div>
            <p className="eyebrow">{neighborMode ? "邻省连城 · 无提示" : "无提示模式"}</p>
            <h2 id="hard-city-title">点区块，写名称</h2>
          </div>
        </div>
        <div className="hard-mode-card">
          <span className="hard-mode-mark" aria-hidden="true">?</span>
          <strong>城市名称已全部隐藏</strong>
          <p>
            {neighborMode
              ? `从 ${challengeProvinces.length} 个省级行政区的联合地图中挑选区块，输入城市、地区或区县名称。`
              : "从地图中挑选一个尚未填充的区块，输入它的城市、地区或区县名称。"}
          </p>
          <ol>
            <li><i>1</i> 点击地图区块</li>
            <li><i>2</i> 手动输入名称</li>
            <li><i>3</i> 回答正确后填入地图</li>
          </ol>
        </div>
        <div className="hard-mode-summary">
          <span>已识别</span>
          <strong>{completedNames.size}<i> / {answerCount}</i></strong>
        </div>
      </section>
    );
  }

  if (province) {
    return (
      <section className="answer-dock" aria-labelledby="answer-title">
        <div className="dock-heading">
          <div>
            <p className="eyebrow">
              {neighborMode ? `${challengeProvinces.length} 省连城` : "名称卡片"}
            </p>
            <h2 id="answer-title">
              {neighborMode ? "让群城各归其位" : "把名字送回地图"}
            </h2>
          </div>
          <p><span className="mouse-mark" aria-hidden="true">↖</span> 拖拽到区块，或先点名称再点地图</p>
        </div>
        <div className="answer-grid">
          {visibleAnswers.map((name) => {
            const isPlaced = completedNames.has(name);
            const isSelected = selectedAnswer === name;
            return (
              <button
                key={name}
                type="button"
                className={`answer-chip ${isPlaced ? "is-placed" : ""} ${isSelected ? "is-selected" : ""}`}
                draggable={!isPlaced}
                disabled={isPlaced}
                aria-pressed={isSelected}
                onClick={() => {
                  if (isPlaced) return;
                  setSelectedAnswer(isSelected ? null : name);
                  setMessage(
                    isSelected
                      ? "已取消选择"
                      : `已选择“${name}”，请点击地图中的位置`,
                  );
                }}
                onDragStart={(event) => {
                  event.dataTransfer.setData("text/plain", name);
                  event.dataTransfer.effectAllowed = "move";
                  setSelectedAnswer(name);
                }}
                onDragEnd={() => setDragGhost(null)}
                onPointerDown={(event) => {
                  if (isPlaced || event.pointerType !== "touch") return;
                  event.currentTarget.setPointerCapture(event.pointerId);
                  touchDragRef.current = {
                    name,
                    startX: event.clientX,
                    startY: event.clientY,
                  };
                  setDragGhost({ name, x: event.clientX, y: event.clientY });
                }}
                onPointerMove={(event) => {
                  if (!touchDragRef.current || event.pointerType !== "touch") return;
                  setDragGhost({ name, x: event.clientX, y: event.clientY });
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
                    ?.closest<SVGPathElement>("[data-region-name]");
                  if (target?.dataset.regionName) {
                    onGuess(target.dataset.regionName, drag.name);
                  } else {
                    setMessage(`“${drag.name}”没有落在地图区块上，已回到名称区`);
                  }
                }}
              >
                <span className="chip-grip" aria-hidden="true">⠿</span>
                <span>{name}</span>
                {isPlaced ? <b aria-label="已完成">✓</b> : null}
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  if (hardMode) {
    return (
      <section className="province-dock hard-mode-dock" aria-labelledby="hard-province-title">
        <div className="dock-heading">
          <div>
            <p className="eyebrow">无提示模式</p>
            <h2 id="hard-province-title">辨认 34 个省份</h2>
          </div>
        </div>
        <div className="hard-mode-card">
          <span className="hard-mode-mark" aria-hidden="true">?</span>
          <strong>省份名称已全部隐藏</strong>
          <p>
            点击全国地图中的任一区块，输入省份名称。回答正确后
            {neighborMode ? "展开它与接壤省份的联合挑战" : "进入该省挑战"}。
          </p>
        </div>
        <div className="blind-progress" aria-label={`已完成 ${completedProvinceCodes.size} 个挑战`}>
          {PROVINCES.map((item, index) => {
            const complete = completedProvinceCodes.has(item.code);
            return (
              <span
                key={item.code}
                className={complete ? "is-complete" : ""}
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
    <section className="province-dock" aria-labelledby="province-title">
      <div className="dock-heading">
        <div>
          <p className="eyebrow">34 个省级行政区</p>
          <h2 id="province-title">
            {neighborMode ? "选择连城起点" : "也可以从名称进入"}
          </h2>
        </div>
        <button
          className="text-button"
          type="button"
          onClick={() => setShowAllProvinces((value) => !value)}
        >
          {showAllProvinces ? "只看未完成" : "查看全部"}
        </button>
      </div>
      <div className="province-grid">
        {visibleProvinceList.map((item, index) => {
          const complete = completedProvinceCodes.has(item.code);
          return (
            <button
              key={item.code}
              type="button"
              className={`province-chip ${complete ? "is-complete" : ""}`}
              onClick={() => onEnterProvince(item)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{item.shortName}</strong>
              <i>{complete ? "✓" : "→"}</i>
            </button>
          );
        })}
      </div>
      {visibleProvinceList.length === 0 ? (
        <div className="all-complete-note">
          {neighborMode
            ? "34 个邻省连城起点已全部完成，太厉害了！"
            : "全国 34 个省级行政区已全部点亮，太厉害了！"}
        </div>
      ) : null}
    </section>
  );
}
