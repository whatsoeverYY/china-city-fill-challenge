import type { UniversityQuizItem } from "@/domain/geography/data/universities";
import KnowledgeSearchEmpty from "@/features/knowledge/components/knowledge-search-empty";
import type { KnowledgeProvince } from "@/features/knowledge/model/knowledge-types";
import { plainPlaceName } from "@/features/knowledge/model/knowledge-format";

type UniversityGroup = {
  province: KnowledgeProvince;
  items: UniversityQuizItem[];
};

export default function UniversityPanel({
  groups,
  query,
}: {
  groups: UniversityGroup[];
  query: string;
}) {
  if (groups.length === 0) return <KnowledgeSearchEmpty query={query} />;

  return (
    <div className="knowledge-stack">
      <div className="knowledge-memory-banner is-purple">
        <span>学</span>
        <div>
          <strong>不要逐所散记：先记“名校城市群”</strong>
          <p>北京、上海、南京、武汉、西安、成都等城市聚集较多，再补上每省的单点学校。</p>
        </div>
        <a
          href="https://www.moe.gov.cn/srcsite/A22/s7065/200512/t20051223_82762.html"
          target="_blank"
          rel="noreferrer"
        >
          教育部名单来源
        </a>
      </div>
      <div className="knowledge-university-list">
        {groups.map(({ province, items }) => (
          <section key={province.code}>
            <header>
              <div>
                <p>{province.kind}</p>
                <h3>{province.shortName}</h3>
              </div>
              <strong>{items.length}<small>所</small></strong>
            </header>
            <div>
              {items.map((item) => (
                <article key={`${item.provinceCode}-${item.name}`}>
                  <span className={`university-tier is-${item.tier}`}>{item.tier}</span>
                  <div>
                    <h4>{item.name}</h4>
                    <p>
                      <b>{plainPlaceName(item.city)}</b>
                      {item.note ? ` · ${item.note}` : ""}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
