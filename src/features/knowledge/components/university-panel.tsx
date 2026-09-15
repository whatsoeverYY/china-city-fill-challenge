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
    <div className="knowledge-stack grid gap-5">
      <div className="knowledge-memory-banner is-purple flex items-center gap-4 rounded-2xl bg-[#735285]/10 p-5 max-md:flex-wrap">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#735285] font-black text-white">学</span>
        <div>
          <strong>不要逐所散记：先记“名校城市群”</strong>
          <p className="mb-0 text-xs leading-5 text-ink-soft">北京、上海、南京、武汉、西安、成都等城市聚集较多，再补上每省的单点学校。</p>
        </div>
        <a
          className="ml-auto rounded-full bg-[#735285] px-4 py-3 text-xs font-black text-white no-underline max-md:ml-0"
          href="https://www.moe.gov.cn/srcsite/A22/s7065/200512/t20051223_82762.html"
          target="_blank"
          rel="noreferrer"
        >
          教育部名单来源
        </a>
      </div>
      <div className="knowledge-university-list grid grid-cols-2 gap-3 max-md:grid-cols-1">
        {groups.map(({ province, items }) => (
          <section className="rounded-2xl border border-black/10 bg-card p-4" key={province.code}>
            <header className="mb-3 flex items-end justify-between border-b border-black/10 pb-3">
              <div>
                <p className="m-0 text-[9px] text-ink-soft">{province.kind}</p>
                <h3 className="m-0 text-2xl font-black">{province.shortName}</h3>
              </div>
              <strong className="text-3xl text-[#735285]">{items.length}<small className="text-[10px]">所</small></strong>
            </header>
            <div className="grid gap-2">
              {items.map((item) => (
                <article className="flex items-center gap-3 rounded-xl bg-paper p-3" key={`${item.provinceCode}-${item.name}`}>
                  <span className={`university-tier is-${item.tier} rounded-full bg-[#735285]/10 px-2 py-1 text-[9px] font-black text-[#735285]`}>{item.tier}</span>
                  <div>
                    <h4 className="m-0 text-sm">{item.name}</h4>
                    <p className="m-0 text-[10px] text-ink-soft">
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
