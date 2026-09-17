import type { CityQuizItem } from "@/domain/geography/data/city-plates";
import { MULTI_PLATE_CITY_COUNT } from "@/domain/geography/data/city-plates";
import KnowledgeSearchEmpty from "@/features/knowledge/components/knowledge-search-empty";
import type { KnowledgeProvince } from "@/features/knowledge/model/knowledge-types";
import { plainPlaceName } from "@/features/knowledge/model/knowledge-format";

type CityGroup = { province: KnowledgeProvince; items: CityQuizItem[] };

export default function CityPlatePanel({
  groups,
  query,
  provinceCapitals,
  provincePlatePrefixes,
  onOpenAtlas,
}: {
  groups: CityGroup[];
  query: string;
  provinceCapitals: Record<string, string>;
  provincePlatePrefixes: Record<string, string>;
  onOpenAtlas: () => void;
}) {
  if (groups.length === 0) return <KnowledgeSearchEmpty query={query} />;

  return (
    <div className="knowledge-stack grid gap-5">
      <div className="knowledge-memory-banner grid grid-cols-[50px_minmax(0,1fr)_auto] items-center gap-4 rounded-[17px] border border-atlas-500/20 bg-atlas-200 px-5 py-[18px] text-atlas-600 max-md:grid-cols-[50px_1fr]">
        <span className="grid size-[50px] shrink-0 place-items-center rounded-[50%_50%_50%_15px] bg-current font-serif text-xl font-black text-white shadow-[inset_0_0_0_4px_rgba(255,255,255,.15)]">记</span>
        <div>
          <strong className="font-serif text-base">先看汉字锁定省，再把同城全部字母成套记住</strong>
          <p className="mb-0 mt-1 text-meta text-ink-600">
            按含历史、区域沿用号段的广义口径，共收录 {MULTI_PLATE_CITY_COUNT}
            个多号牌城市或地区；高亮卡片会列出全部前缀和形成原因，关卡中必须全部答出。
          </p>
        </div>
        <button className="min-h-10 cursor-pointer rounded-full border border-current bg-white/50 px-[13px] py-2 text-compact font-black text-current max-md:col-span-2 max-md:min-h-11 max-md:justify-self-start" type="button" onClick={onOpenAtlas}>去全国图鉴看地图</button>
      </div>
      <div className="knowledge-group-list">
        {groups.map(({ province, items }) => {
          const plateCount = items.reduce(
            (total, item) => total + item.plates.length,
            0,
          );
          const multiPlateCount = items.filter(
            (item) => item.plates.length > 1,
          ).length;
          return (
            <section className="knowledge-city-group grid grid-cols-[190px_minmax(0,1fr)] overflow-hidden rounded-[18px] border border-atlas-500/20 bg-paper-100/85 max-md:grid-cols-1" key={province.code}>
              <header className="grid content-start gap-[15px] border-r border-atlas-500/15 bg-atlas-200 p-[22px] text-atlas-600 max-md:grid-cols-[52px_1fr] max-md:border-b max-md:border-r-0">
                <b className="grid size-[52px] place-items-center rounded-[15px_15px_15px_5px] bg-atlas-500 font-serif text-[23px] text-white">{provincePlatePrefixes[province.code]}</b>
                <div>
                  <h3 className="m-0 font-serif text-card-title-mobile">{province.shortName}车牌组</h3>
                  <p className="mb-0 mt-1.5 text-meta text-ink-500">
                    {items.length} 个城市/地区 · {plateCount} 个前缀
                    {multiPlateCount > 0 ? ` · ${multiPlateCount} 个多号牌区域` : ""}
                    {` · 行政中心 ${plainPlaceName(provinceCapitals[province.code])}`}
                  </p>
                </div>
              </header>
              <div className="knowledge-plate-grid grid grid-cols-5 gap-2 p-[15px] max-xl:grid-cols-4 max-lg:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1">
                {items.map((item) => (
                  <article
                    className={`flex min-h-12 items-center justify-between gap-2 rounded-[10px] border px-[11px] py-[9px] ${item.plates.length > 1 ? "col-span-2 flex-wrap border-atlas-500/30 bg-gradient-to-br from-atlas-100 to-paper-100 shadow-atlas-inset max-sm:col-span-1" : "border-black/[.12] bg-paper-100"}`}
                    key={item.id}
                  >
                    <span className={`min-w-0 text-meta [overflow-wrap:anywhere] ${item.plates.length > 1 ? "flex items-center gap-1.5 font-bold" : ""}`}>
                      {plainPlaceName(item.city)}
                      {item.plates.length > 1 ? (
                        <em className="rounded-full bg-atlas-500 px-[5px] py-0.5 text-meta font-bold not-italic text-white">
                          {item.plates.length === 2
                            ? "双号牌"
                            : `${item.plates.length} 号牌`}
                        </em>
                      ) : null}
                    </span>
                    <strong className={`shrink-0 font-numeric text-atlas-500 ${item.plates.length > 1 ? "text-sm" : "text-[13px]"}`}>{item.plate}</strong>
                    {item.plateNote ? <small className="basis-full text-meta text-ink-600">{item.plateNote}</small> : null}
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
