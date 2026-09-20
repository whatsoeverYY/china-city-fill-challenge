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
    title: "世界落名",
    badge: "地图",
    description: "在世界地图上点击国家区块，填写对应的国家名称。",
    target: "累计正确填写 30 个不同国家",
  },
  {
    id: WORLD_LEVEL_ID.COUNTRY_SHAPES,
    title: "国形辨影",
    badge: "轮廓",
    description: "观察单独展示的国界轮廓，填写国家名称。",
    target: "连续答对 20 题",
  },
] as const;

export const WORLD_LEVEL_BY_ID = new Map(
  WORLD_LEVELS.map((level) => [level.id, level]),
);
