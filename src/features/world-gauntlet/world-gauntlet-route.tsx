"use client";

import type { WorldLevelId } from "@/domain/game/world-level-ids";
import { WORLD_LEVEL_ID } from "@/domain/game/world-level-ids";
import {
  WORLD_COUNTRY_DATA_NOTICE,
  WORLD_BOUNDARY_DISCLAIMER,
  WORLD_MAP_DATA_NOTICE,
} from "@/domain/geography/data/world-data-policy";
import WorldCountryShapeLevel from "./components/world-country-shape-level";
import WorldGauntletLobby from "./components/world-gauntlet-lobby";
import WorldMapCountryLevel from "./components/world-map-country-level";
import { useWorldGauntletProgress } from "./model/use-world-gauntlet-progress";
import { useWorldMapData } from "@/features/map/model/world-map-data";
import DataVintageNotice from "@/shared/components/data-vintage-notice";
import PageBreadcrumbs from "@/shared/components/page-breadcrumbs";
import { routePath } from "@/shared/lib/app-path";

export default function WorldGauntletRoute({
  initialLevel = null,
}: {
  initialLevel?: WorldLevelId | null;
}) {
  const { data: map, error } = useWorldMapData();
  const { completedLevels, completeLevel } = useWorldGauntletProgress();

  if (!initialLevel) {
    return <WorldGauntletLobby completedLevels={completedLevels} />;
  }

  return (
    <main className="mx-auto min-h-dvh w-[min(1320px,calc(100%_-_48px))] pb-20 pt-8 text-ink max-md:w-[min(760px,calc(100%_-_24px))] max-md:pt-4">
      <PageBreadcrumbs items={[
        { label: "世界篇", href: routePath("/world") },
        { label: "世界地图关卡", href: routePath("/world/gauntlet") },
        { label: initialLevel === WORLD_LEVEL_ID.MAP_COUNTRY_NAMES ? "世界落名" : "国形辨影" },
      ]} />
      <div className="mb-6 mt-5">
        <DataVintageNotice compact lines={[WORLD_MAP_DATA_NOTICE, WORLD_COUNTRY_DATA_NOTICE, WORLD_BOUNDARY_DISCLAIMER]} />
      </div>
      {error ? (
        <section className="rounded-2xl border border-city-500/20 bg-card p-8 text-center">
          <h1 className="font-serif text-section font-bold">世界地图加载失败</h1>
          <p className="text-body text-ink-soft">请检查网络或刷新页面后重试。</p>
        </section>
      ) : !map ? (
        <p className="rounded-2xl bg-card p-8 text-center text-body text-ink-soft" role="status">正在铺开世界地图…</p>
      ) : initialLevel === WORLD_LEVEL_ID.MAP_COUNTRY_NAMES ? (
        <WorldMapCountryLevel map={map} onComplete={completeLevel} />
      ) : (
        <WorldCountryShapeLevel map={map} onComplete={completeLevel} />
      )}
    </main>
  );
}
