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
    <div className="boss-skill-summary" aria-label="终极混战能力统计">
      {BOSS_SKILL_CATALOG.map(({ id, label }) => {
        const stat = stats[id];
        const accuracy = stat.total
          ? Math.round((stat.correct / stat.total) * 100)
          : 0;
        return (
          <div key={id}>
            <span>{label}</span>
            <strong>{accuracy}%</strong>
            <small>{stat.correct} / {stat.total}</small>
          </div>
        );
      })}
    </div>
  );
}
