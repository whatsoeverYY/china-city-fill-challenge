export default function DataVintageNotice({
  lines,
  compact = false,
}: {
  lines: readonly string[];
  compact?: boolean;
}) {
  return (
    <aside
      className={`rounded-[16px_16px_16px_5px] border border-clay-500/25 bg-clay-100/75 text-clay-900 ${
        compact ? "px-3 py-2 text-meta" : "px-4 py-3 text-compact"
      }`}
      aria-label="数据统计时间说明"
    >
      <strong className="mr-2 font-black">数据时间说明</strong>
      {lines.map((line, index) => (
        <span key={line}>
          {index > 0 ? <span aria-hidden="true"> · </span> : null}
          {line}
        </span>
      ))}
    </aside>
  );
}
