import type {
  Dispatch,
  FormEventHandler,
  RefObject,
  SetStateAction,
} from "react";
import type { MapFeature } from "@/features/map/model/map-data";
import type { SyncStatus } from "@/features/player/player-data-context";

type DragGhost = { name: string; x: number; y: number };

export default function ChallengeFooterAndOverlays({
  signedIn,
  syncStatus,
  provinceSelected,
  pendingFeature,
  manualAnswer,
  manualError,
  manualAnswerInputRef,
  dragGhost,
  setPendingFeature,
  setManualAnswer,
  setManualError,
  onSubmitManualAnswer,
}: {
  signedIn: boolean;
  syncStatus: SyncStatus;
  provinceSelected: boolean;
  pendingFeature: MapFeature | null;
  manualAnswer: string;
  manualError: string;
  manualAnswerInputRef: RefObject<HTMLInputElement | null>;
  dragGhost: DragGhost | null;
  setPendingFeature: Dispatch<SetStateAction<MapFeature | null>>;
  setManualAnswer: Dispatch<SetStateAction<string>>;
  setManualError: Dispatch<SetStateAction<string>>;
  onSubmitManualAnswer: FormEventHandler<HTMLFormElement>;
}) {
  return (
    <>
      <footer>
        <span>一张地图，500 个待归位的名字</span>
        <span>
          边界数据：
          <a href="https://geojson.cn/data/atlas/china" target="_blank" rel="noreferrer">
            GeoJSON.CN
          </a>
          {" · "}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
            © OpenStreetMap contributors
          </a>
        </span>
        <span>
          {signedIn
            ? syncStatus === "offline"
              ? "离线进度已保存在本机，联网后自动同步"
              : syncStatus === "synced"
                ? "进度已按账号保存并同步到云端"
                : syncStatus === "error"
                  ? "进度已保存在本机，云同步暂不可用"
                  : "进度已保存在账号缓存，正在同步"
            : "游客试玩不保存，登录后可固化进度"}
        </span>
      </footer>

      {pendingFeature ? (
        <div className="answer-dialog-backdrop" role="presentation">
          <section
            className={`answer-dialog ${manualError ? "has-error" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="manual-answer-title"
          >
            <button
              className="dialog-close"
              type="button"
              aria-label="关闭输入框"
              onClick={() => {
                setPendingFeature(null);
                setManualAnswer("");
                setManualError("");
              }}
            >
              ×
            </button>
            <p className="eyebrow">难度提升 · 区块已选中</p>
            <h2 id="manual-answer-title">
              {provinceSelected ? "这里是什么城市或区县？" : "这里是哪个省份？"}
            </h2>
            <p className="dialog-hint">
              可输入完整行政区名称，也可以省略“省、市、区、县”等常见后缀。
            </p>
            <form onSubmit={onSubmitManualAnswer}>
              <label htmlFor="manual-answer">
                {provinceSelected ? "城市 / 区县名称" : "省份名称"}
              </label>
              <div className="manual-answer-row">
                <input
                  id="manual-answer"
                  ref={manualAnswerInputRef}
                  value={manualAnswer}
                  autoComplete="off"
                  placeholder={provinceSelected ? "输入名称" : "输入省份名称"}
                  onChange={(event) => {
                    setManualAnswer(event.target.value);
                    setManualError("");
                  }}
                />
                <button type="submit" disabled={!manualAnswer.trim()}>
                  确认答案
                </button>
              </div>
              <p className="manual-error" aria-live="polite">
                {manualError || "按 Enter 键也可以提交"}
              </p>
            </form>
          </section>
        </div>
      ) : null}

      {dragGhost ? (
        <div
          className="drag-ghost"
          style={{
            transform: `translate(${dragGhost.x + 14}px, ${dragGhost.y + 14}px)`,
          }}
          aria-hidden="true"
        >
          {dragGhost.name}
        </div>
      ) : null}
    </>
  );
}
