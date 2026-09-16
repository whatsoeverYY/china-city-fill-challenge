"use client";

import GauntletAnswerForm from "@/features/gauntlet/components/gauntlet-answer-form";
import type { GauntletActions } from "@/features/gauntlet/hooks/use-gauntlet-actions";
import { useGauntletDerived } from "@/features/gauntlet/model/gauntlet-derived-context";
import { useGauntletSession } from "@/features/gauntlet/model/gauntlet-session-context";

const SUMMARY_CLASS =
  "map-answer-summary rounded-xl bg-paper p-3 text-xs leading-5 text-ink-soft";

export default function CityNeighborAnswer({
  actions,
}: {
  actions: GauntletActions;
}) {
  const s = useGauntletSession();
  const d = useGauntletDerived();

  if (d.gauntletDetailError) {
    return (
      <>
        <h2 className="mb-4 mt-0 text-2xl font-black">提示地图载入失败</h2>
        <p className={SUMMARY_CLASS}>请返回选关后重新进入本关。</p>
      </>
    );
  }
  if (!d.currentCityNeighborQuestion) {
    return (
      <>
        <h2 className="mb-4 mt-0 text-2xl font-black">正在准备邻市题</h2>
        <p className={SUMMARY_CLASS}>正在读取省级地图和市界数据…</p>
      </>
    );
  }

  return (
    <>
      <h2 className="mb-4 mt-0 text-2xl font-black">写出全部省内陆地邻区</h2>
      <GauntletAnswerForm
        actions={actions}
        id="gauntlet-city-neighbor-answer"
        label="行政区名称"
        placeholder="例如：南京、扬州；没有邻市可留空"
        allowEmpty
      />
      <button
        className="mt-3 min-h-11 w-full cursor-pointer rounded-xl border border-brand-green/30 bg-brand-green/10 px-4 text-xs font-black text-brand-green-dark disabled:cursor-default disabled:opacity-60"
        type="button"
        disabled={s.cityNeighborHintVisible}
        onClick={actions.showCityNeighborHint}
      >
        {s.cityNeighborHintVisible ? "市界提示图已显示" : "显示市界提示图"}
      </button>
      <p className={SUMMARY_CLASS}>
        多个答案请用顿号、逗号或空格分隔，必须答全且不能多答。没有陆地邻市时，可以留空提交，也可以填写“0”“无”或“没有”。
      </p>
      {s.cityNeighborRetry ? (
        <p className="m-0 rounded-xl bg-brand-gold/15 p-3 text-xs font-bold text-ink">
          本题正在重答；这次答对仍计入连胜与通关进度。
        </p>
      ) : null}
    </>
  );
}
