import { MAP_HEIGHT, MAP_WIDTH } from "@/features/map/lib/map-geometry";
import type { AtlasView } from "@/features/atlas/model/atlas-types";

const ATLAS_MOBILE_INITIAL_SCALE = 1.22;

export const DESKTOP_ATLAS_VIEW: AtlasView = { scale: 1, x: 0, y: 0 };

export function initialAtlasView(isMobile: boolean): AtlasView {
  if (!isMobile) return DESKTOP_ATLAS_VIEW;
  return {
    scale: ATLAS_MOBILE_INITIAL_SCALE,
    x: (MAP_WIDTH * (1 - ATLAS_MOBILE_INITIAL_SCALE)) / 2,
    y: (MAP_HEIGHT * (1 - ATLAS_MOBILE_INITIAL_SCALE)) / 2,
  };
}
