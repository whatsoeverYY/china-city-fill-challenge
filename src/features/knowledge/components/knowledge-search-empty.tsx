export default function KnowledgeSearchEmpty({ query }: { query: string }) {
  return (
    <div className="knowledge-search-empty grid min-h-[360px] place-content-center place-items-center rounded-[20px] border border-dashed border-scholar-500/25 bg-paper-100/70 px-5 py-10 text-center" role="status">
      <span className="mb-4 grid size-14 place-items-center rounded-[17px_17px_17px_5px] bg-scholar-500 font-serif text-[22px] text-white" aria-hidden="true">寻</span>
      <strong className="font-serif text-xl">没有找到“{query}”</strong>
      <p className="mb-0 mt-2 text-[10px] text-ink-500">可以试试省份简称、完整城市名、车牌前缀或学校名称。</p>
    </div>
  );
}
