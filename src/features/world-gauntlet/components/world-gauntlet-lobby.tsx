import { WORLD_LEVELS } from "@/domain/game/world-levels";
import type { WorldLevelId } from "@/domain/game/world-level-ids";
import { worldGauntletLevelPath } from "../config/world-gauntlet-routes";
import AppLink from "@/shared/components/app-link";
import DataVintageNotice from "@/shared/components/data-vintage-notice";
import PageBreadcrumbs from "@/shared/components/page-breadcrumbs";
import { routePath } from "@/shared/lib/app-path";
import {
  WORLD_COUNTRY_DATA_NOTICE,
  WORLD_BOUNDARY_DISCLAIMER,
  WORLD_MAP_DATA_NOTICE,
} from "@/domain/geography/data/world-data-policy";

export default function WorldGauntletLobby({
  completedLevels,
}: {
  completedLevels: Set<WorldLevelId>;
}) {
  return (
    <main className="mx-auto min-h-dvh w-[min(1180px,calc(100%_-_48px))] pb-20 pt-8 text-ink max-md:w-[min(700px,calc(100%_-_24px))] max-md:pt-4">
      <PageBreadcrumbs items={[
        { label: "中国篇", href: routePath("/") },
        { label: "世界篇", href: routePath("/world") },
        { label: "世界地图关卡" },
      ]} />
      <header className="mt-7 rounded-[28px_28px_28px_8px] border border-gold-600/25 bg-gold-100/70 px-7 py-9 max-sm:px-5">
        <p className="m-0 text-meta font-black uppercase tracking-[0.22em] text-gold-900">WORLD GAUNTLET</p>
        <h1 className="mb-3 mt-2 font-serif text-display font-black max-sm:text-display-mobile">世界地图，开始落名</h1>
        <p className="m-0 max-w-[760px] text-body text-ink-soft">第一批开放两关：在完整世界地图上填写国家名称，或只凭国界轮廓辨认国家。后续关卡会继续补充。</p>
      </header>
      <div className="mt-5">
        <DataVintageNotice lines={[WORLD_MAP_DATA_NOTICE, WORLD_COUNTRY_DATA_NOTICE, WORLD_BOUNDARY_DISCLAIMER]} />
      </div>
      <section className="mt-8 grid grid-cols-2 gap-5 max-md:grid-cols-1" aria-label="世界篇关卡">
        {WORLD_LEVELS.map((level, index) => {
          const completed = completedLevels.has(level.id);
          return (
            <article key={level.id} className="rounded-[24px_24px_24px_7px] border border-atlas-500/20 bg-card/85 p-6 shadow-lg">
              <div className="flex items-start justify-between gap-4">
                <span className={`grid size-16 place-items-center rounded-[19px_19px_19px_6px] font-serif text-xl font-black text-white ${index === 0 ? "bg-atlas-700" : "bg-clay-600"}`} aria-hidden="true">{level.badge}</span>
                {completed ? <span className="rounded-full border border-jade-500/25 bg-jade-100 px-3 py-1 text-meta font-black text-jade-800">已通关</span> : null}
              </div>
              <p className="mb-1 mt-5 text-meta font-black text-atlas-700">第 {index + 1} 关</p>
              <h2 className="m-0 font-serif text-section font-bold">{level.title}</h2>
              <p className="mb-3 mt-3 text-body text-ink-soft">{level.description}</p>
              <p className="mb-5 mt-0 text-compact font-black text-clay-800">目标：{level.target}</p>
              <AppLink className="inline-flex min-h-11 items-center rounded-full bg-atlas-700 px-5 py-2.5 text-compact font-black text-white no-underline" href={worldGauntletLevelPath(level.id)}>{completed ? "再次挑战" : "开始挑战"}</AppLink>
            </article>
          );
        })}
      </section>
      <div className="mt-7 text-center">
        <AppLink className="text-compact font-black text-scholar-700" href={routePath("/world/knowledge")}>先回知识馆复习国家与首都</AppLink>
      </div>
    </main>
  );
}
