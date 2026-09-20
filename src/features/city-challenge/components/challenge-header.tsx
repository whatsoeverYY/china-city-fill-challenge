import { PROVINCES, type Province } from "@/domain/geography/data/provinces";
import { cityChallengePath } from "@/features/city-challenge/config/city-challenge-routes";
import AppLink from "@/shared/components/app-link";
import PageBreadcrumbs from "@/shared/components/page-breadcrumbs";
import { routePath } from "@/shared/lib/app-path";

export default function ChallengeHeader({
  province,
  neighborMode,
  hardMode,
  completedProvinceCodes,
  challengeProvinces,
  answerCount,
  worldUnlocked,
}: {
  province: Province | null;
  neighborMode: boolean;
  hardMode: boolean;
  completedProvinceCodes: Set<string>;
  challengeProvinces: Province[];
  answerCount: number;
  worldUnlocked: boolean;
}) {
  const homePath = cityChallengePath(null, { hardMode, neighborMode });

  return (
    <>
      <header className={`site-header flex min-h-[62px] items-center justify-between border-b border-black/[.13] pb-[22px] max-[1050px]:flex-wrap max-[1050px]:gap-[14px] max-md:ml-[calc((100%-100vw)/2)] max-md:w-screen max-md:bg-card/95 max-md:px-3 max-md:pt-2 ${province ? "max-md:sticky max-md:top-0 max-md:z-40 max-md:gap-0 max-md:pb-0 max-md:backdrop-blur-xl" : "max-md:gap-5 max-md:pb-4"}`}>
        <div className="brand inline-flex min-h-11 min-w-0 items-center gap-[13px] text-left text-ink">
          <span className="brand-seal grid size-[45px] shrink-0 -rotate-2 place-items-center rounded-[9px_9px_9px_3px] bg-city-500 font-serif text-[25px] font-bold text-gold-100 shadow-[inset_0_0_0_2px_rgba(255,248,231,.24)] max-md:size-[39px]" aria-hidden="true">城</span>
          {province ? (
            <PageBreadcrumbs
              className="max-w-[min(620px,55vw)] max-md:max-w-[calc(100vw_-_92px)]"
              items={[
                { label: "首页", href: homePath },
                { label: `${province.shortName}城市填图`, mobileLabel: province.shortName },
              ]}
            />
          ) : (
            <span>
              <strong className="block whitespace-nowrap font-serif text-lg font-bold tracking-[0.06em] max-md:text-sm">中国城市填充挑战</strong>
              <small className="mt-[3px] block text-meta font-bold tracking-[0.22em] text-ink-500 max-md:hidden">CHINA CITY ATLAS</small>
            </span>
          )}
        </div>
        <div className="header-actions flex flex-wrap items-center justify-end gap-[22px] max-[1050px]:w-full max-[1050px]:gap-2.5 max-[1050px]:border-t max-[1050px]:border-black/[.13] max-[1050px]:pt-3 max-md:grid max-md:grid-cols-2 max-md:gap-1.5">
          {!province ? (
            <>
              <AppLink className="atlas-mode-button inline-flex min-h-[38px] items-center gap-[7px] rounded-full border border-atlas-500/30 bg-atlas-100 px-3 py-2 text-compact font-extrabold tracking-[0.06em] text-atlas-700 no-underline transition hover:-translate-y-px hover:bg-atlas-300 max-md:hidden" href={routePath("/atlas")}>
                <span className="grid size-5 place-items-center rounded-full bg-atlas-500 font-sans text-[10px] font-bold leading-none tracking-normal text-white" aria-hidden="true">图</span><span className="max-sm:hidden">全国车牌图鉴</span><span className="hidden max-sm:inline">图鉴</span>
              </AppLink>
              <AppLink className="knowledge-mode-button inline-flex min-h-[38px] items-center gap-[7px] rounded-full border border-scholar-600/30 bg-scholar-100 px-3 py-2 text-compact font-extrabold tracking-[0.06em] text-scholar-600 no-underline transition hover:-translate-y-px hover:bg-scholar-300 max-md:min-h-11 max-md:justify-center max-sm:flex-col max-sm:gap-1 max-sm:rounded-xl max-sm:px-1 max-sm:py-2 max-sm:text-meta max-sm:tracking-normal" href={routePath("/knowledge")}>
                <span className="grid size-5 place-items-center rounded-full bg-scholar-500 font-sans text-[10px] font-bold leading-none tracking-normal text-white" aria-hidden="true">知</span><span className="max-sm:hidden">地理知识馆</span><span className="hidden max-sm:inline">知识</span>
              </AppLink>
              <AppLink className="gauntlet-mode-button inline-flex min-h-[38px] items-center gap-[7px] rounded-full border border-gold-600/35 bg-gold-200 px-3 py-2 text-compact font-extrabold tracking-[0.06em] text-gold-900 no-underline transition hover:-translate-y-px hover:bg-gold-300 max-md:min-h-11 max-md:justify-center max-sm:flex-col max-sm:gap-1 max-sm:rounded-xl max-sm:px-1 max-sm:py-2 max-sm:text-meta max-sm:tracking-normal" href={routePath("/gauntlet")}>
                <span className="grid size-5 place-items-center rounded-full bg-gold-600 font-sans text-[10px] font-bold leading-none tracking-normal text-gold-100" aria-hidden="true">关</span><span className="max-sm:hidden">过关斩将</span><span className="hidden max-sm:inline">闯关</span>
              </AppLink>
              {worldUnlocked ? (
                <AppLink className="inline-flex min-h-[38px] items-center gap-[7px] rounded-full border border-atlas-600/30 bg-atlas-200 px-3 py-2 text-compact font-extrabold tracking-[0.06em] text-atlas-800 no-underline transition hover:-translate-y-px hover:bg-atlas-300 max-md:min-h-11 max-md:justify-center max-sm:flex-col max-sm:gap-1 max-sm:rounded-xl max-sm:px-1 max-sm:py-2 max-sm:text-meta max-sm:tracking-normal" href={routePath("/world")}>
                  <span className="grid size-5 place-items-center rounded-full bg-atlas-700 font-sans text-[10px] font-bold leading-none tracking-normal text-white" aria-hidden="true">世</span><span className="max-sm:hidden">世界地理</span><span className="hidden max-sm:inline">世界</span>
                </AppLink>
              ) : null}
            </>
          ) : null}
          <div
            className="national-progress grid w-[min(330px,34vw)] grid-cols-[auto_auto] items-baseline gap-x-3 max-[1050px]:w-[min(260px,34vw)] max-md:col-span-2 max-md:flex max-md:w-auto max-md:items-center max-md:gap-2"
            aria-label={`已完成 ${completedProvinceCodes.size} 个挑战`}
          >
            <span className="text-xs font-bold tracking-[0.12em] text-ink-soft max-md:text-meta">{neighborMode ? "联挑战进度" : "全国进度"}</span>
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

      <section className={`intro-row grid grid-cols-[minmax(0,1fr)_auto] items-end gap-10 px-1 pb-6 pt-9 max-md:grid-cols-1 max-md:gap-4 max-md:pb-5 ${province ? "max-md:pt-4" : "max-md:pt-6"}`}>
        <div>
          <p className="eyebrow mb-3 mt-0 text-[11px] font-extrabold uppercase tracking-[0.24em] text-city-500 max-md:text-[10px]">拖动 · 辨认 · 探索</p>
          <h1 className="mb-3 mt-0 max-w-[940px] font-serif text-page font-bold tracking-[-0.025em] max-md:text-page-mobile">
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
          <p className="lede m-0 max-w-[850px] text-body text-ink-soft max-md:text-body-mobile">
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
          <p className="m-0 flex items-center gap-[11px] text-compact font-normal text-ink-soft max-md:gap-1.5 max-md:text-meta"><span className="block h-0.5 w-[27px] bg-city-500 max-md:w-[17px]" />省级边界</p>
          <p className="m-0 flex items-center gap-[11px] text-compact font-normal text-ink-soft max-md:gap-1.5 max-md:text-meta"><span className="block h-0.5 w-[27px] bg-jade-500 max-md:w-[17px]" />地市 / 区县界</p>
          <p className="m-0 flex items-center gap-[11px] text-compact font-normal text-ink-soft max-md:gap-1.5 max-md:text-meta"><span className="legend-fill block h-[13px] w-[27px] rounded-[3px] border border-jade-500 bg-jade-400 max-md:w-[17px]" />已正确填入</p>
        </div>
      </section>
    </>
  );
}
