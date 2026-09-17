import type {
  Dispatch,
  FormEventHandler,
  RefObject,
  SetStateAction,
} from "react";
import type { MapFeature } from "@/features/map/model/map-data";
import type { SyncStatus } from "@/features/player/model/player-types";
import type { CityDragGhost } from "@/features/city-challenge/model/city-challenge-types";

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
  dragGhost: CityDragGhost | null;
  setPendingFeature: Dispatch<SetStateAction<MapFeature | null>>;
  setManualAnswer: Dispatch<SetStateAction<string>>;
  setManualError: Dispatch<SetStateAction<string>>;
  onSubmitManualAnswer: FormEventHandler<HTMLFormElement>;
}) {
  return (
    <>
      <footer className="mt-6 flex flex-wrap justify-center gap-x-4 text-center text-xs leading-6 text-ink-soft">
        <span>一张地图，500 个待归位的名字</span>
        <span>
          边界数据：
          <a className="font-bold text-city-500" href="https://geojson.cn/data/atlas/china" target="_blank" rel="noreferrer">
            GeoJSON.CN
          </a>
          {" · "}
          <a className="font-bold text-city-500" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
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
        <div className="answer-dialog-backdrop fixed inset-0 z-50 grid place-items-center bg-black/35 p-4 backdrop-blur-sm" role="presentation">
          <section
            className={`answer-dialog relative w-full max-w-md rounded-3xl bg-card p-6 shadow-2xl ${manualError ? "animate-[dialog-shake_300ms_ease]" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="manual-answer-title"
          >
            <button
              className="dialog-close absolute right-4 top-4 grid size-9 cursor-pointer place-items-center rounded-full border-0 bg-black/5 text-xl"
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
            <p className="eyebrow m-0 text-xs font-black tracking-[0.18em] text-city-500">难度提升 · 区块已选中</p>
            <h2 className="mt-2 pr-10 text-2xl" id="manual-answer-title">
              {provinceSelected ? "这里是什么城市或区县？" : "这里是哪个省份？"}
            </h2>
            <p className="dialog-hint text-sm leading-6 text-ink-soft">
              可输入完整行政区名称，也可以省略“省、市、区、县”等常见后缀。
            </p>
            <form onSubmit={onSubmitManualAnswer}>
              <label className="text-xs font-black" htmlFor="manual-answer">
                {provinceSelected ? "城市 / 区县名称" : "省份名称"}
              </label>
              <div className="manual-answer-row mt-2 flex gap-2">
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
                  className="min-w-0 flex-1 rounded-xl border border-black/15 bg-white px-3 py-3 outline-none focus:border-city-500 focus:ring-2 focus:ring-city-500/15"
                />
                <button className="cursor-pointer rounded-xl border-0 bg-city-500 px-4 font-black text-white disabled:cursor-not-allowed disabled:opacity-40" type="submit" disabled={!manualAnswer.trim()}>
                  确认答案
                </button>
              </div>
              <p className="manual-error min-h-5 text-sm font-bold text-city-500" aria-live="polite">
                {manualError || "按 Enter 键也可以提交"}
              </p>
            </form>
          </section>
        </div>
      ) : null}

      {dragGhost ? (
        <div
          className="drag-ghost pointer-events-none fixed z-[70] rounded-full bg-ink px-3 py-2 text-xs font-black text-white shadow-xl"
          style={{
            transform: `translate(${dragGhost.x + 14}px, ${dragGhost.y + 14}px)`,
          }}
          aria-hidden="true"
        >
          {dragGhost.answer.name}
        </div>
      ) : null}
    </>
  );
}
