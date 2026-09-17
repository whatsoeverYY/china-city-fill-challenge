export default function ChallengeSettings({
  neighborMode,
  hardMode,
  onToggleNeighborMode,
  onToggleHardMode,
}: {
  neighborMode: boolean;
  hardMode: boolean;
  onToggleNeighborMode: () => void;
  onToggleHardMode: () => void;
}) {
  return (
    <section
      className="challenge-settings mb-5 grid grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 rounded-[15px] border border-black/[.13] bg-card/65 px-4 py-3 shadow-[0_12px_28px_rgba(58,47,30,.04)] max-[820px]:grid-cols-[auto_minmax(0,1fr)] max-sm:px-3"
      aria-label="挑战设置"
    >
      <span className="text-meta font-extrabold tracking-[0.12em] text-ink-500">
        挑战范围
      </span>
      <div className="grid grid-cols-2 rounded-xl bg-paper-700/60 p-1" role="group" aria-label="选择挑战范围">
        <button
          className={`min-h-10 cursor-pointer rounded-[9px] border-0 px-3 py-2 text-compact font-extrabold transition max-sm:min-h-11 ${
            neighborMode
              ? "bg-transparent text-ink-500 hover:text-jade-700"
              : "bg-card text-city-900 shadow-sm"
          }`}
          type="button"
          aria-pressed={!neighborMode}
          onClick={neighborMode ? onToggleNeighborMode : undefined}
        >
          单省
        </button>
        <button
          className={`min-h-10 cursor-pointer rounded-[9px] border-0 px-3 py-2 text-compact font-extrabold transition max-sm:min-h-11 ${
            neighborMode
              ? "bg-jade-700 text-jade-100 shadow-sm"
              : "bg-transparent text-ink-500 hover:text-jade-700"
          }`}
          type="button"
          aria-pressed={neighborMode}
          onClick={!neighborMode ? onToggleNeighborMode : undefined}
        >
          邻省连城
        </button>
      </div>

      <span className="text-meta font-extrabold tracking-[0.12em] text-ink-500">
        作答方式
      </span>
      <div className="grid grid-cols-2 rounded-xl bg-paper-700/60 p-1" role="group" aria-label="选择作答方式">
        <button
          className={`min-h-10 cursor-pointer rounded-[9px] border-0 px-3 py-2 text-compact font-extrabold transition max-sm:min-h-11 ${
            hardMode
              ? "bg-transparent text-ink-500 hover:text-city-700"
              : "bg-card text-city-900 shadow-sm"
          }`}
          type="button"
          aria-pressed={!hardMode}
          onClick={hardMode ? onToggleHardMode : undefined}
        >
          拖拽填充
        </button>
        <button
          className={`min-h-10 cursor-pointer rounded-[9px] border-0 px-3 py-2 text-compact font-extrabold transition max-sm:min-h-11 ${
            hardMode
              ? "bg-city-900 text-gold-100 shadow-sm"
              : "bg-transparent text-ink-500 hover:text-city-700"
          }`}
          type="button"
          aria-pressed={hardMode}
          onClick={!hardMode ? onToggleHardMode : undefined}
        >
          手动填写 <small className="font-bold opacity-70">· 更难</small>
        </button>
      </div>
    </section>
  );
}
