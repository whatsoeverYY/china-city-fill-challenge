import type { WorldLevelId } from "@/domain/game/world-level-ids";
import { routePath } from "@/shared/lib/app-path";

export function worldGauntletLevelPath(levelId: WorldLevelId) {
  return routePath(`/world/gauntlet/${levelId}`);
}
