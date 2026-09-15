export default function KnowledgeSearchEmpty({ query }: { query: string }) {
  return (
    <div className="knowledge-search-empty" role="status">
      <span aria-hidden="true">寻</span>
      <strong>没有找到“{query}”</strong>
      <p>可以试试省份简称、完整城市名、车牌前缀或学校名称。</p>
    </div>
  );
}
