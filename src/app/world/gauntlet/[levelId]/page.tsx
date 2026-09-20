import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WORLD_LEVELS, WORLD_LEVEL_BY_ID } from "@/domain/game/world-levels";
import { isWorldLevelId } from "@/domain/game/world-level-ids";
import WorldGauntletRoute from "@/features/world-gauntlet/world-gauntlet-route";

export const dynamicParams = false;

export function generateStaticParams() {
  return WORLD_LEVELS.map((level) => ({ levelId: level.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ levelId: string }>;
}): Promise<Metadata> {
  const { levelId } = await params;
  const level = isWorldLevelId(levelId) ? WORLD_LEVEL_BY_ID.get(levelId) : null;
  return level ? { title: `${level.title}｜世界地图关卡`, description: level.description } : {};
}

export default async function WorldGauntletLevelPage({
  params,
}: {
  params: Promise<{ levelId: string }>;
}) {
  const { levelId } = await params;
  if (!isWorldLevelId(levelId)) notFound();
  return <WorldGauntletRoute initialLevel={levelId} />;
}
