import type { GauntletLevelId } from "@/domain/game/gauntlet-level-ids";
import { routePath } from "@/shared/lib/app-path";

export function gauntletLevelPath(levelId: GauntletLevelId) {
  return routePath(`/gauntlet/${levelId}`);
}
