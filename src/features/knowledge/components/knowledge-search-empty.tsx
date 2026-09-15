export default function KnowledgeSearchEmpty({ query }: { query: string }) {
  return (
    <div className="knowledge-search-empty grid justify-items-center gap-3 rounded-2xl bg-card p-10 text-center" role="status">
      <span className="grid size-14 place-items-center rounded-full bg-[#735285] text-xl font-black text-white" aria-hidden="true">寻</span>
      <strong className="text-xl">没有找到“{query}”</strong>
      <p className="m-0 text-xs text-ink-soft">可以试试省份简称、完整城市名、车牌前缀或学校名称。</p>
    </div>
  );
}
