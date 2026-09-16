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
      <div className="knowledge-memory-banner flex items-center gap-4 rounded-2xl bg-brand-green/10 p-5 max-md:flex-wrap">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-brand-green font-black text-white">记</span>
        <div>
          <strong>先看汉字锁定省，再把同城全部字母成套记住</strong>
          <p className="mb-0 text-xs leading-5 text-ink-soft">
            按含历史、区域沿用号段的广义口径，共收录 {MULTI_PLATE_CITY_COUNT}
            个多号牌城市或地区；高亮卡片会列出全部前缀和形成原因，关卡中必须全部答出。
          </p>
        </div>
        <button className="ml-auto cursor-pointer rounded-full border-0 bg-brand-green px-4 py-3 text-xs font-black text-white max-md:ml-0" type="button" onClick={onOpenAtlas}>去全国图鉴看地图</button>
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
            <section className="knowledge-city-group mb-6 rounded-2xl border border-black/10 bg-card/80 p-5" key={province.code}>
              <header className="mb-4 flex items-center gap-3">
                <b className="grid size-11 place-items-center rounded-xl bg-brand-red text-white">{provincePlatePrefixes[province.code]}</b>
                <div>
                  <h3 className="m-0 text-2xl font-black">{province.shortName}车牌组</h3>
                  <p className="m-0 text-xs text-ink-soft">
                    {items.length} 个城市/地区 · {plateCount} 个前缀
                    {multiPlateCount > 0 ? ` · ${multiPlateCount} 个多号牌区域` : ""}
                    {` · 行政中心 ${plainPlaceName(provinceCapitals[province.code])}`}
                  </p>
                </div>
              </header>
              <div className="knowledge-plate-grid grid grid-cols-4 gap-2 max-lg:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1">
                {items.map((item) => (
                  <article
                    className={`rounded-xl border p-3 ${item.plates.length > 1 ? "border-brand-gold/40 bg-brand-gold/10" : "border-black/10 bg-white/70"}`}
                    key={item.id}
                  >
                    <span className="block text-xs">
                      {plainPlaceName(item.city)}
                      {item.plates.length > 1 ? (
                        <em className="ml-2 rounded-full bg-brand-gold/20 px-1.5 py-0.5 text-[8px] not-italic">
                          {item.plates.length === 2
                            ? "双号牌"
                            : `${item.plates.length} 号牌`}
                        </em>
                      ) : null}
                    </span>
                    <strong className="my-1 block text-xl text-brand-red-dark">{item.plate}</strong>
                    {item.plateNote ? <small className="text-[9px] leading-4 text-ink-soft">{item.plateNote}</small> : null}
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
