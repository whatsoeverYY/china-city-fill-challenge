import { PROVINCES, type Province } from "@/domain/geography/data/provinces";
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
      <header className="site-header flex min-h-[62px] items-center justify-between border-b border-black/[.13] pb-[22px] max-[1050px]:flex-wrap max-[1050px]:gap-[14px] max-md:gap-5">
        <button className="brand inline-flex min-h-11 cursor-pointer items-center gap-[13px] border-0 bg-transparent p-0 text-left text-ink" type="button" onClick={onBack}>
          <span className="brand-seal grid size-[45px] shrink-0 -rotate-2 place-items-center rounded-[9px_9px_9px_3px] bg-city-500 font-serif text-[25px] font-bold text-gold-100 shadow-[inset_0_0_0_2px_rgba(255,248,231,.24)] max-md:size-[39px]" aria-hidden="true">城</span>
          <span>
            <strong className="block whitespace-nowrap font-serif text-lg font-bold tracking-[0.06em] max-md:text-sm">中国城市填充挑战</strong>
            <small className="mt-[3px] block text-[8px] font-bold tracking-[0.22em] text-ink-500 max-md:hidden">CHINA CITY ATLAS</small>
          </span>
        </button>
        <div className={`header-actions flex flex-wrap items-center justify-end gap-[22px] max-[1050px]:w-full max-[1050px]:gap-2.5 max-[1050px]:border-t max-[1050px]:border-black/[.13] max-[1050px]:pt-3 max-md:grid max-md:gap-1.5 ${province ? "max-md:grid-cols-2" : "max-md:grid-cols-5"}`}>
          {!province ? (
            <>
              <a className="atlas-mode-button inline-flex min-h-[38px] items-center gap-[7px] rounded-full border border-atlas-500/30 bg-atlas-100 px-3 py-[7px] text-[11px] font-extrabold tracking-[0.06em] text-atlas-700 no-underline transition hover:-translate-y-px hover:bg-atlas-300 max-md:min-h-11 max-md:justify-center max-sm:flex-col max-sm:gap-1 max-sm:rounded-xl max-sm:px-1 max-sm:py-2 max-sm:text-[10px] max-sm:tracking-normal" href={routePath("/atlas")}>
                <span className="grid size-5 place-items-center rounded-full bg-atlas-500 font-serif text-white" aria-hidden="true">图</span><span className="max-sm:hidden">全国车牌图鉴</span><span className="hidden max-sm:inline">图鉴</span>
              </a>
              <a className="knowledge-mode-button inline-flex min-h-[38px] items-center gap-[7px] rounded-full border border-scholar-600/30 bg-scholar-100 px-3 py-[7px] text-[11px] font-extrabold tracking-[0.06em] text-scholar-600 no-underline transition hover:-translate-y-px hover:bg-scholar-300 max-md:min-h-11 max-md:justify-center max-sm:flex-col max-sm:gap-1 max-sm:rounded-xl max-sm:px-1 max-sm:py-2 max-sm:text-[10px] max-sm:tracking-normal" href={routePath("/knowledge")}>
                <span className="grid size-5 place-items-center rounded-full bg-scholar-500 font-serif text-white" aria-hidden="true">知</span><span className="max-sm:hidden">地理知识馆</span><span className="hidden max-sm:inline">知识</span>
              </a>
              <a className="gauntlet-mode-button inline-flex min-h-[38px] items-center gap-[7px] rounded-full border border-gold-600/35 bg-gold-200 px-3 py-[7px] text-[11px] font-extrabold tracking-[0.06em] text-gold-900 no-underline transition hover:-translate-y-px hover:bg-gold-300 max-md:min-h-11 max-md:justify-center max-sm:flex-col max-sm:gap-1 max-sm:rounded-xl max-sm:px-1 max-sm:py-2 max-sm:text-[10px] max-sm:tracking-normal" href={routePath("/gauntlet")}>
                <span className="grid size-5 place-items-center rounded-full bg-gold-600 font-serif text-gold-100" aria-hidden="true">关</span><span className="max-sm:hidden">过关斩将</span><span className="hidden max-sm:inline">闯关</span>
              </a>
            </>
          ) : null}
          <button
            className={`neighbor-mode-button inline-flex min-h-[38px] cursor-pointer items-center gap-[7px] rounded-full border px-3 py-[7px] text-[11px] font-extrabold tracking-[0.06em] transition hover:-translate-y-px max-md:min-h-11 max-md:justify-center max-sm:flex-col max-sm:gap-1 max-sm:rounded-xl max-sm:px-1 max-sm:py-2 max-sm:text-[10px] max-sm:tracking-normal ${neighborMode ? "border-jade-700 bg-jade-700 text-jade-100" : "border-jade-500/30 bg-paper-100/70 text-jade-700"}`}
            type="button"
            aria-pressed={neighborMode}
            onClick={onToggleNeighborMode}
          >
            <span className={`grid size-5 place-items-center rounded-full font-serif text-[11px] ${neighborMode ? "bg-jade-100 text-jade-700" : "bg-jade-500 text-white"}`} aria-hidden="true">联</span>
            <span className="max-sm:hidden">邻省连城</span><span className="hidden max-sm:inline">邻省</span>
            {neighborMode ? <i className="border-l border-white/30 pl-[7px] text-[9px] not-italic tracking-[0.08em] max-sm:hidden">已开启</i> : null}
          </button>
          <button
            className={`difficulty-button inline-flex min-h-[38px] cursor-pointer items-center gap-[7px] rounded-full border px-3 py-[7px] text-[11px] font-extrabold tracking-[0.06em] transition hover:-translate-y-px max-md:min-h-11 max-md:justify-center max-sm:flex-col max-sm:gap-1 max-sm:rounded-xl max-sm:px-1 max-sm:py-2 max-sm:text-[10px] max-sm:tracking-normal ${hardMode ? "border-city-900 bg-city-900 text-gold-100" : "border-city-500/30 bg-paper-100/70 text-city-900"}`}
            type="button"
            aria-pressed={hardMode}
            onClick={onToggleHardMode}
          >
            <span className={`grid size-5 place-items-center rounded-full text-[13px] ${hardMode ? "bg-gold-100 text-city-900" : "bg-city-500 text-white"}`} aria-hidden="true">↑</span>
            <span className="max-sm:hidden">难度提升</span><span className="hidden max-sm:inline">难度</span>
            {hardMode ? <i className="border-l border-white/30 pl-[7px] text-[9px] not-italic tracking-[0.08em] max-sm:hidden">已开启</i> : null}
          </button>
          <div
            className={`national-progress grid w-[min(330px,34vw)] grid-cols-[auto_auto] items-baseline gap-x-3 max-[1050px]:w-[min(260px,34vw)] max-md:flex max-md:w-auto max-md:items-center max-md:gap-2 ${province ? "max-md:col-span-2" : "max-md:col-span-5"}`}
            aria-label={`已完成 ${completedProvinceCodes.size} 个挑战`}
          >
            <span className="text-xs font-bold tracking-[0.12em] text-ink-soft max-md:text-[9px]">{neighborMode ? "联挑战进度" : "全国进度"}</span>
            <strong className="justify-self-end font-numeric text-[23px] text-city-500 max-md:text-base">{completedProvinceCodes.size}<i className="text-[.62em] font-medium not-italic text-ink-500">/{PROVINCES.length}</i></strong>
            <div className="progress-track col-span-2 mt-2 h-[5px] overflow-hidden rounded-full bg-stone-300 max-md:mt-0 max-md:flex-1" aria-hidden="true">
              <span
                className="block h-full rounded-full bg-gradient-to-r from-city-500 to-city-400 transition-[width] duration-500"
                style={{ width: `${(completedProvinceCodes.size / PROVINCES.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <section className="intro-row grid grid-cols-[minmax(0,1fr)_auto] items-end gap-14 px-1 pb-[30px] pt-12 max-md:grid-cols-1 max-md:gap-[18px] max-md:pt-[26px]">
        <div>
          <p className="eyebrow mb-3 mt-0 text-[11px] font-extrabold uppercase tracking-[0.24em] text-city-500 max-md:text-[10px]">拖动 · 辨认 · 探索</p>
          <h1 className="mb-4 mt-0 max-w-[940px] font-serif text-[clamp(34px,4.2vw,58px)] font-bold leading-[1.08] tracking-[-0.035em] max-md:text-[clamp(26px,7.5vw,34px)] max-md:leading-[1.16]">
            {province ? (
              neighborMode ? (
                <><span className="text-city-500">{province.shortName}</span>与邻省，连城共答</>
              ) : (
                <><span className="text-city-500">{province.shortName}</span>，你认识多少座城？</>
              )
            ) : neighborMode ? (
              <>选一省，连起它周围的每一座城</>
            ) : (
              <>从一省出发，拼出整幅中国城市地图</>
            )}
          </h1>
          <p className="lede m-0 max-w-[850px] text-[15px] leading-[1.85] text-ink-soft max-md:text-[13px] max-md:leading-[1.7]">
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
        <div className="legend-card min-w-[198px] rounded-[14px] border border-black/[.13] bg-card/70 px-5 py-[18px] shadow-[0_12px_32px_rgba(58,47,30,.05)] max-md:flex max-md:min-w-0 max-md:gap-[15px] max-md:px-[13px] max-md:py-2.5" aria-label="地图图例">
          <p className="m-0 flex items-center gap-[11px] text-xs font-normal leading-[2.1] text-ink-soft max-md:gap-1.5 max-md:text-[9px]"><span className="block h-0.5 w-[27px] bg-city-500 max-md:w-[17px]" />省级边界</p>
          <p className="m-0 flex items-center gap-[11px] text-xs font-normal leading-[2.1] text-ink-soft max-md:gap-1.5 max-md:text-[9px]"><span className="block h-0.5 w-[27px] bg-jade-500 max-md:w-[17px]" />地市 / 区县界</p>
          <p className="m-0 flex items-center gap-[11px] text-xs font-normal leading-[2.1] text-ink-soft max-md:gap-1.5 max-md:text-[9px]"><span className="legend-fill block h-[13px] w-[27px] rounded-[3px] border border-jade-500 bg-jade-400 max-md:w-[17px]" />已正确填入</p>
        </div>
      </section>
    </>
  );
}
