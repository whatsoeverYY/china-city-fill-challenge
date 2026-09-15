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
    <div className="knowledge-stack">
      <div className="knowledge-memory-banner">
        <span>记</span>
        <div>
          <strong>先看汉字锁定省，再把同城全部字母成套记住</strong>
          <p>
            按含历史、区域沿用号段的广义口径，共收录 {MULTI_PLATE_CITY_COUNT}
            个多号牌城市或地区；高亮卡片会列出全部前缀和形成原因，关卡中必须全部答出。
          </p>
        </div>
        <button type="button" onClick={onOpenAtlas}>去全国图鉴看地图</button>
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
            <section className="knowledge-city-group" key={province.code}>
              <header>
                <b>{provincePlatePrefixes[province.code]}</b>
                <div>
                  <h3>{province.shortName}车牌组</h3>
                  <p>
                    {items.length} 个城市/地区 · {plateCount} 个前缀
                    {multiPlateCount > 0 ? ` · ${multiPlateCount} 个多号牌区域` : ""}
                    {` · 行政中心 ${plainPlaceName(provinceCapitals[province.code])}`}
                  </p>
                </div>
              </header>
              <div className="knowledge-plate-grid">
                {items.map((item) => (
                  <article
                    className={item.plates.length > 1 ? "is-multi-plate" : undefined}
                    key={`${item.provinceCode}-${item.city}`}
                  >
                    <span>
                      {plainPlaceName(item.city)}
                      {item.plates.length > 1 ? (
                        <em>
                          {item.plates.length === 2
                            ? "双号牌"
                            : `${item.plates.length} 号牌`}
                        </em>
                      ) : null}
                    </span>
                    <strong>{item.plate}</strong>
                    {item.plateNote ? <small>{item.plateNote}</small> : null}
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
