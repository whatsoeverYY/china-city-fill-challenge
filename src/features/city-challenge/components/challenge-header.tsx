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
      <header className="site-header">
        <button className="brand" type="button" onClick={onBack}>
          <span className="brand-seal" aria-hidden="true">城</span>
          <span>
            <strong>中国城市填充挑战</strong>
            <small>CHINA CITY ATLAS</small>
          </span>
        </button>
        <div className="header-actions">
          {!province ? (
            <>
              <a className="atlas-mode-button" href={routePath("/atlas")}>
                <span aria-hidden="true">图</span>全国车牌图鉴
              </a>
              <a className="knowledge-mode-button" href={routePath("/knowledge")}>
                <span aria-hidden="true">知</span>地理知识馆
              </a>
              <a className="gauntlet-mode-button" href={routePath("/gauntlet")}>
                <span aria-hidden="true">关</span>过关斩将
              </a>
            </>
          ) : null}
          <button
            className={`neighbor-mode-button ${neighborMode ? "is-active" : ""}`}
            type="button"
            aria-pressed={neighborMode}
            onClick={onToggleNeighborMode}
          >
            <span aria-hidden="true">联</span>
            邻省连城
            {neighborMode ? <i>已开启</i> : null}
          </button>
          <button
            className={`difficulty-button ${hardMode ? "is-active" : ""}`}
            type="button"
            aria-pressed={hardMode}
            onClick={onToggleHardMode}
          >
            <span aria-hidden="true">↑</span>
            难度提升
            {hardMode ? <i>已开启</i> : null}
          </button>
          <div
            className="national-progress"
            aria-label={`已完成 ${completedProvinceCodes.size} 个挑战`}
          >
            <span>{neighborMode ? "联挑战进度" : "全国进度"}</span>
            <strong>{completedProvinceCodes.size}<i>/34</i></strong>
            <div className="progress-track" aria-hidden="true">
              <span
                style={{ width: `${(completedProvinceCodes.size / 34) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <section className="intro-row">
        <div>
          <p className="eyebrow">拖动 · 辨认 · 探索</p>
          <h1>
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
          <p className="lede">
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
        <div className="legend-card" aria-label="地图图例">
          <p><span className="legend-line legend-line--red" />省级边界</p>
          <p><span className="legend-line legend-line--green" />地市 / 区县边界</p>
          <p><span className="legend-fill" />已正确填入</p>
        </div>
      </section>
    </>
  );
}
