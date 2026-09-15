import type {
  BossSkill,
  BossSkillStat,
} from "@/features/gauntlet/model/boss-stats";
import { BOSS_SKILL_CATALOG } from "@/features/gauntlet/model/boss-stats";

export default function BossSkillSummary({
  stats,
}: {
  stats: Record<BossSkill, BossSkillStat>;
}) {
  return (
    <div className="boss-skill-summary grid w-full grid-cols-3 gap-2" aria-label="终极混战能力统计">
      {BOSS_SKILL_CATALOG.map(({ id, label }) => {
        const stat = stats[id];
        const accuracy = stat.total
          ? Math.round((stat.correct / stat.total) * 100)
          : 0;
        return (
          <div className="rounded-xl bg-paper p-3" key={id}>
            <span className="block text-[9px] text-ink-soft">{label}</span>
            <strong className="block text-xl">{accuracy}%</strong>
            <small className="text-[9px]">{stat.correct} / {stat.total}</small>
          </div>
        );
      })}
    </div>
  );
}
