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
      <div className="knowledge-memory-banner grid grid-cols-[50px_minmax(0,1fr)_auto] items-center gap-4 rounded-[17px] border border-scholar-500/20 bg-scholar-200 px-5 py-[18px] text-scholar-600 max-md:grid-cols-[50px_1fr]">
        <span className="grid size-[50px] shrink-0 place-items-center rounded-[50%_50%_50%_15px] bg-current font-serif text-xl font-black text-white shadow-[inset_0_0_0_4px_rgba(255,255,255,.15)]">学</span>
        <div>
          <strong className="font-serif text-base">不要逐所散记：先记“名校城市群”</strong>
          <p className="mb-0 mt-1 text-[10px] leading-[1.7] text-ink-600">北京、上海、南京、武汉、西安、成都等城市聚集较多，再补上每省的单点学校。</p>
        </div>
        <a
          className="rounded-full border border-current bg-white/50 px-[13px] py-[9px] text-[9px] font-black text-current no-underline max-md:col-span-2 max-md:justify-self-start"
          href="https://www.moe.gov.cn/srcsite/A22/s7065/200512/t20051223_82762.html"
          target="_blank"
          rel="noreferrer"
        >
          教育部名单来源
        </a>
      </div>
      <div className="knowledge-university-list grid grid-cols-3 items-start gap-3.5 max-lg:grid-cols-2 max-md:grid-cols-1">
        {groups.map(({ province, items }) => (
          <section className="overflow-hidden rounded-[17px] border border-scholar-500/20 bg-paper-100/90" key={province.code}>
            <header className="flex items-end justify-between gap-[15px] bg-scholar-200 px-[18px] py-4 text-scholar-600">
              <div>
                <p className="m-0 text-[8px]">{province.kind}</p>
                <h3 className="mb-0 mt-[3px] font-serif text-lg">{province.shortName}</h3>
              </div>
              <strong className="font-numeric text-[25px]">{items.length}<small className="ml-[3px] text-[9px]">所</small></strong>
            </header>
            <div className="grid px-[15px] pb-[13px] pt-2">
              {items.map((item) => (
                <article className="grid grid-cols-[38px_minmax(0,1fr)] items-center gap-2.5 border-b border-black/[.13] py-2.5 last:border-b-0" key={item.id}>
                  <span className={`university-tier grid h-[25px] w-[38px] place-items-center rounded-[7px] border font-numeric text-[9px] font-black ${item.tier === "985" ? "border-city-500/25 bg-city-200 text-city-600" : "border-scholar-500/25 bg-scholar-100 text-scholar-600"}`}>{item.tier}</span>
                  <div>
                    <h4 className="m-0 text-[11px]">{item.name}</h4>
                    <p className="mb-0 mt-1 text-[8px] leading-[1.5] text-stone-600">
                      <b className="text-scholar-600">{plainPlaceName(item.city)}</b>
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
