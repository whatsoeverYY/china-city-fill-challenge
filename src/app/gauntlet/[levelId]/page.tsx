import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  GAUNTLET_LEVEL_BY_ID,
  GAUNTLET_LEVELS,
} from "@/domain/game/gauntlet-levels";
import {
  isGauntletLevelId,
} from "@/domain/game/gauntlet-level-ids";
import GauntletRoute from "@/features/gauntlet/gauntlet-route";

export const dynamicParams = false;

export function generateStaticParams() {
  return GAUNTLET_LEVELS.map((level) => ({ levelId: level.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ levelId: string }>;
}): Promise<Metadata> {
  const { levelId } = await params;
  const level = isGauntletLevelId(levelId)
    ? GAUNTLET_LEVEL_BY_ID.get(levelId)
    : null;
  return level
    ? {
        title: `${level.title}｜过关斩将`,
        description: level.description,
      }
    : {};
}

export default async function GauntletLevelPage({
  params,
}: {
  params: Promise<{ levelId: string }>;
}) {
  const { levelId } = await params;
  if (!isGauntletLevelId(levelId)) notFound();
  return <GauntletRoute initialLevel={levelId} />;
}
