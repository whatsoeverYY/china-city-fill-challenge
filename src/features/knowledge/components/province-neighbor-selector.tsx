import type { KnowledgeProvince } from "@/features/knowledge/model/knowledge-types";

function ProvinceButtons({
  compact,
  onToggleProvince,
  provinces,
  selectedCodes,
}: {
  compact: boolean;
  onToggleProvince: (provinceCode: string) => void;
  provinces: KnowledgeProvince[];
  selectedCodes: ReadonlySet<string>;
}) {
  return provinces.map((province) => {
    const selected = selectedCodes.has(province.code);
    const onlyCenter = selected && selectedCodes.size === 1;
    return (
      <button
        key={province.code}
        type="button"
        className={`${compact ? "min-h-11" : "min-h-[38px]"} cursor-pointer rounded-lg border px-2 py-1.5 text-meta ${selected ? "border-jade-500 bg-jade-500 font-black text-white" : "border-jade-500/15 bg-white/55 text-ink-600"}`}
        aria-pressed={selected}
        aria-label={onlyCenter
          ? `${province.name}，已选，至少保留一个中心省份`
          : `${selected ? "取消选择" : "选择"}${province.name}`}
        onClick={() => onToggleProvince(province.code)}
      >
        {province.shortName}
      </button>
    );
  });
}

export default function ProvinceNeighborSelector({
  onToggleProvince,
  provinces,
  selectedCodes,
}: {
  onToggleProvince: (provinceCode: string) => void;
  provinces: KnowledgeProvince[];
  selectedCodes: ReadonlySet<string>;
}) {
  const selectedNames = provinces
    .filter((province) => selectedCodes.has(province.code))
    .map((province) => province.shortName);

  return (
    <>
      <p className="mb-3.5 mt-0 text-meta font-black tracking-[.1em] text-moss-500">
        选择中心省份 · 可多选
      </p>
      <details className="rounded-xl border border-jade-500/20 bg-paper-100/75 sm:hidden">
        <summary className="min-h-11 cursor-pointer px-3 py-3 text-compact font-bold text-ink">
          已选 {selectedCodes.size} 个 · {selectedNames.join("、")}
        </summary>
        <div className="grid max-h-[252px] grid-cols-4 gap-1.5 overflow-y-auto border-t border-jade-500/15 p-2.5">
          <ProvinceButtons
            compact
            onToggleProvince={onToggleProvince}
            provinces={provinces}
            selectedCodes={selectedCodes}
          />
        </div>
      </details>
      <div className="knowledge-province-selector grid grid-cols-3 gap-1.5 max-lg:grid-cols-6 max-sm:hidden">
        <ProvinceButtons
          compact={false}
          onToggleProvince={onToggleProvince}
          provinces={provinces}
          selectedCodes={selectedCodes}
        />
      </div>
    </>
  );
}
