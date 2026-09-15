import type { Province } from "@/domain/geography/data/provinces";
import { routePath } from "@/shared/lib/app-path";

export default function ChallengeHeader({
  province,
  neighborMode,
  hardMode,
  completedProvinceCodes,
  challengeProvinces,
  answerCount,
  onBack,
  onToggleNeighborMode,
  onToggleHardMode,
}: {
  province: Province | null;
  neighborMode: boolean;
  hardMode: boolean;
  completedProvinceCodes: Set<string>;
  challengeProvinces: Province[];
  answerCount: number;
  onBack: () => void;
  onToggleNeighborMode: () => void;
  onToggleHardMode: () => void;
}) {
  return (
    <>
      <header className="site-header mb-8 flex items-center justify-between gap-5 max-lg:items-start max-md:mb-5 max-md:flex-col max-md:items-stretch">
        <button className="brand inline-flex cursor-pointer items-center gap-3 border-0 bg-transparent p-0 text-left text-ink" type="button" onClick={onBack}>
          <span className="brand-seal grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-red text-xl font-black text-white shadow-[0_10px_24px_rgba(125,41,36,0.2)] max-md:size-10 max-md:rounded-xl" aria-hidden="true">城</span>
          <span>
            <strong className="block whitespace-nowrap text-base font-black tracking-[0.08em]">中国城市填充挑战</strong>
            <small className="mt-0.5 block text-[10px] font-bold tracking-[0.2em] text-ink-soft">CHINA CITY ATLAS</small>
          </span>
        </button>
        <div className="header-actions flex flex-wrap items-center justify-end gap-2.5 max-md:grid max-md:grid-cols-2 [&>a]:justify-center">
          {!province ? (
            <>
              <a className="atlas-mode-button inline-flex items-center gap-2 rounded-full border border-black/10 bg-card px-3 py-2 text-xs font-black text-ink no-underline transition hover:-translate-y-0.5 hover:shadow-md" href={routePath("/atlas")}>
                <span className="grid size-6 place-items-center rounded-full bg-[#dcebf5]" aria-hidden="true">图</span>全国车牌图鉴
              </a>
              <a className="knowledge-mode-button inline-flex items-center gap-2 rounded-full border border-black/10 bg-card px-3 py-2 text-xs font-black text-ink no-underline transition hover:-translate-y-0.5 hover:shadow-md" href={routePath("/knowledge")}>
                <span className="grid size-6 place-items-center rounded-full bg-[#e5f0e8]" aria-hidden="true">知</span>地理知识馆
              </a>
              <a className="gauntlet-mode-button inline-flex items-center gap-2 rounded-full border border-black/10 bg-card px-3 py-2 text-xs font-black text-ink no-underline transition hover:-translate-y-0.5 hover:shadow-md" href={routePath("/gauntlet")}>
                <span className="grid size-6 place-items-center rounded-full bg-[#f5e5df]" aria-hidden="true">关</span>过关斩将
              </a>
            </>
          ) : null}
          <button
            className={`neighbor-mode-button inline-flex cursor-pointer items-center gap-2 rounded-full border border-brand-green/25 px-3 py-2 text-xs font-black ${neighborMode ? "is-active bg-brand-green text-white" : "bg-card text-ink"}`}
            type="button"
            aria-pressed={neighborMode}
            onClick={onToggleNeighborMode}
          >
            <span className="grid size-6 place-items-center rounded-full bg-brand-green/10" aria-hidden="true">联</span>
            邻省连城
            {neighborMode ? <i className="rounded-full bg-black/10 px-1.5 py-0.5 text-[9px] not-italic">已开启</i> : null}
          </button>
          <button
            className={`difficulty-button inline-flex cursor-pointer items-center gap-2 rounded-full border border-brand-red/25 px-3 py-2 text-xs font-black ${hardMode ? "is-active bg-brand-red text-white" : "bg-card text-ink"}`}
            type="button"
            aria-pressed={hardMode}
            onClick={onToggleHardMode}
          >
            <span className="grid size-6 place-items-center rounded-full bg-brand-red/10" aria-hidden="true">↑</span>
            难度提升
            {hardMode ? <i className="rounded-full bg-black/10 px-1.5 py-0.5 text-[9px] not-italic">已开启</i> : null}
          </button>
          <div
            className="national-progress min-w-32 rounded-2xl border border-black/10 bg-card px-3 py-2 max-md:col-span-2"
            aria-label={`已完成 ${completedProvinceCodes.size} 个挑战`}
          >
            <span className="text-[10px] font-bold text-ink-soft">{neighborMode ? "联挑战进度" : "全国进度"}</span>
            <strong className="ml-2 text-xl">{completedProvinceCodes.size}<i className="text-xs not-italic text-ink-soft">/34</i></strong>
            <div className="progress-track mt-1 h-1.5 overflow-hidden rounded-full bg-black/10" aria-hidden="true">
              <span
                className="block h-full rounded-full bg-brand-red transition-[width]"
                style={{ width: `${(completedProvinceCodes.size / 34) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <section className="intro-row mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-8 max-md:grid-cols-1 max-md:gap-4">
        <div>
          <p className="eyebrow m-0 text-xs font-black uppercase tracking-[0.18em] text-brand-red">拖动 · 辨认 · 探索</p>
          <h1 className="my-2 max-w-4xl text-[clamp(2rem,5vw,4.7rem)] font-black leading-[1.06] tracking-[-0.055em] [&>span]:text-brand-red">
            {province ? (
              neighborMode ? (
                <><span>{province.shortName}</span>与邻省，连城共答</>
              ) : (
                <><span>{province.shortName}</span>，你认识多少座城？</>
              )
            ) : neighborMode ? (
              <>选一省，连起它周围的每一座城</>
            ) : (
              <>从一省出发，拼出整幅中国城市地图</>
            )}
          </h1>
          <p className="lede m-0 max-w-3xl text-[15px] leading-7 text-ink-soft">
            {province
              ? neighborMode
                ? `当前联合区域包含 ${challengeProvinces.map((item) => item.shortName).join("、")}，共 ${answerCount || "…"} 个城市或区县。${hardMode ? "点击区块并手动输入名称。" : "拖拽或点选名称完成整片区域。"}`
                : hardMode
                  ? `点击地图中的任一区块，手动输入它的名称。完成 ${province.name} 的全部 ${answerCount || "…"} 个区域即可点亮印章。`
                  : province.kind === "直辖市"
                    ? `将下方的区县名称拖到地图中。完成 ${province.name} 的全部 ${answerCount || "…"} 个区县即可点亮印章。`
                    : `将下方的行政区名称拖到地图中。完成 ${province.name} 的全部 ${answerCount || "…"} 个区域即可点亮印章。`
              : hardMode
                ? "省份名称已隐藏。点击地图中的省级行政区，手动输入名称，回答正确后才能解锁省内挑战。"
                : neighborMode
                  ? "点击任一省份，把它和所有陆地接壤省份展开成联合地图，一次填完区域内全部城市。"
                  : "点击地图或省份名进入挑战。红色标出省级边界，进入省内后，绿色标出地市或区县边界。"}
          </p>
        </div>
        <div className="legend-card grid min-w-52 gap-2 rounded-2xl border border-black/10 bg-card/85 p-4 shadow-sm max-md:min-w-0 max-md:grid-cols-3" aria-label="地图图例">
          <p className="m-0 flex items-center gap-2 text-xs font-bold text-ink-soft"><span className="legend-line legend-line--red block h-0.5 w-6 bg-brand-red" />省级边界</p>
          <p className="m-0 flex items-center gap-2 text-xs font-bold text-ink-soft"><span className="legend-line legend-line--green block h-0.5 w-6 bg-brand-green" />地市 / 区县界</p>
          <p className="m-0 flex items-center gap-2 text-xs font-bold text-ink-soft"><span className="legend-fill block size-3 rounded-sm bg-[#f0beb8]" />已正确填入</p>
        </div>
      </section>
    </>
  );
}
