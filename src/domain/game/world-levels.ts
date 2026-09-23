import { WORLD_LEVEL_ID, type WorldLevelId } from "./world-level-ids.ts";

export type WorldLevelDefinition = {
  id: WorldLevelId;
  title: string;
  badge: string;
  description: string;
  target: string;
};

export const WORLD_LEVELS: readonly WorldLevelDefinition[] = [
  {
    id: WORLD_LEVEL_ID.MAP_COUNTRY_NAMES,
    title: "点亮世界",
    badge: "路线",
    description: "选择一条地区探索路线，逐国填写名称并点亮地图。",
    target: "完整点亮任意一条地区路线",
  },
  {
    id: WORLD_LEVEL_ID.COUNTRY_SHAPES,
    title: "轮廓侦察",
    badge: "侦察",
    description: "选择洲别观察国家轮廓，按需解锁洲别、地区与首都线索。",
    target: "完成任意一个侦察范围的识别任务",
  },
] as const;

export const WORLD_LEVEL_BY_ID = new Map(
  WORLD_LEVELS.map((level) => [level.id, level]),
);
