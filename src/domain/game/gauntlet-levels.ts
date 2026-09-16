import {
  GAUNTLET_LEVEL_ID,
  isGauntletLevelId,
  type GauntletLevelId,
} from "./gauntlet-level-ids.ts";

export type GauntletLevelDefinition = {
  id: GauntletLevelId;
  title: string;
  badge: string;
  description: string;
  target: string;
  openingFeedback: string;
  roundHeading: string;
};

/**
 * Array position controls presentation only. A level ID is permanent: moving or
 * retiring an entry must never change or recycle another entry's ID.
 */
export const GAUNTLET_LEVELS: readonly GauntletLevelDefinition[] = [
  {
    id: GAUNTLET_LEVEL_ID.PROVINCE_SHAPE,
    title: "辨形识省",
    badge: "省形",
    description: "先辨认正常方向的省份轮廓，再进入随机旋转轮廓挑战。",
    target: "普通轮廓全覆盖＋旋转轮廓 20 连胜",
    openingFeedback: "第一阶段：观察正常方向轮廓，写出省级行政区名称",
    roundHeading: "先认原形，再战旋转轮廓",
  },
  {
    id: GAUNTLET_LEVEL_ID.CITY_PROVINCE,
    title: "城归何处",
    badge: "城市",
    description: "根据随机出现的城市名称，写出所属省级行政区。",
    target: "连续答对 30 题",
    openingFeedback: "写出这座城市所属的省级行政区",
    roundHeading: "看城市，答归属",
  },
  {
    id: GAUNTLET_LEVEL_ID.PLATE_PLACE,
    title: "牌归省市",
    badge: "识牌",
    description: "根据随机车牌，在一个输入框中写出对应的省份与城市或地区，例如“浙江宁波”。",
    target: "连续答对 20 题",
    openingFeedback: "在同一个输入框中写出省份和对应城市或地区",
    roundHeading: "看车牌，连写省份与城市",
  },
  {
    id: GAUNTLET_LEVEL_ID.PROVINCE_NEIGHBORS,
    title: "邻省包围圈",
    badge: "邻省",
    description: "根据指定省份，从文字选项中选出所有与它陆地接壤的省份。",
    target: "连续答对 10 题",
    openingFeedback: "从文字选项中选出全部陆地邻省，再确认答案",
    roundHeading: "圈出全部陆地邻省",
  },
  {
    id: GAUNTLET_LEVEL_ID.PLATE_COMPLETION,
    title: "车牌补全",
    badge: "补牌",
    description: "根据城市或地区和车牌简称，补出全部车牌字母；多号牌区域必须答全。",
    target: "连续答对 20 题",
    openingFeedback: "补出车牌简称后缺失的全部字母",
    roundHeading: "看城市或地区，补车牌字母",
  },
  {
    id: GAUNTLET_LEVEL_ID.CITY_MAP,
    title: "城市落点",
    badge: "落点",
    description: "看到城市名称后，在无名称全国地图上点击它所属的省份。",
    target: "连续答对 30 题",
    openingFeedback: "直接点击城市所属的省级行政区",
    roundHeading: "看城市，在地图上落点",
  },
  {
    id: GAUNTLET_LEVEL_ID.TRUTH_FLASH,
    title: "真假闪电",
    badge: "真假",
    description: "快速判断城市与省份或车牌前缀的对应关系是否正确。",
    target: "连续答对 30 题",
    openingFeedback: "判断屏幕上的对应关系是真是假",
    roundHeading: "辨真伪，拼反应",
  },
  {
    id: GAUNTLET_LEVEL_ID.NEIGHBOR_CHAIN,
    title: "邻省连锁",
    badge: "连锁",
    description: "从随机省份出发，每一步只能前往未走过的陆地邻省。",
    target: "连续走过 10 个省份",
    openingFeedback: "从起点出发，只能走向未走过的陆地邻省",
    roundHeading: "沿陆地邻省连成路线",
  },
  {
    id: GAUNTLET_LEVEL_ID.CITY_UNDERCOVER,
    title: "谁是卧底",
    badge: "卧底",
    description: "四座城市中有三座来自同一省份，找出唯一的异类。",
    target: "连续答对 20 题",
    openingFeedback: "观察四座城市，找出唯一不属于同一省份的城市",
    roundHeading: "四座城市，找出唯一卧底",
  },
  {
    id: GAUNTLET_LEVEL_ID.REGION_MAP,
    title: "市域落点",
    badge: "市域",
    description: "在无名称省内地图上，点击随机城市、自治州、地区或区县对应的区块。",
    target: "连续答对 30 题",
    openingFeedback: "在省内无名称地图上点击目标行政区块",
    roundHeading: "在省内地图精准落点",
  },
  {
    id: GAUNTLET_LEVEL_ID.TERRITORY_GROUPS,
    title: "沿海与沿边",
    badge: "疆域",
    description: "选出全部沿海、陆地边境或长江流经省级行政区。",
    target: "完成 3 组疆域题",
    openingFeedback: "三组疆域题各完成一次即可过关",
    roundHeading: "沿海、沿边与长江疆域",
  },
  {
    id: GAUNTLET_LEVEL_ID.GEOGRAPHY_ELIMINATION,
    title: "地理排除",
    badge: "排除",
    description: "在城市、省份与行政中心之间找出唯一正确项或错误项。",
    target: "连续答对 16 题",
    openingFeedback: "综合判断城市、省份与行政中心的对应关系",
    roundHeading: "城市、省份与行政中心综合排除",
  },
  {
    id: GAUNTLET_LEVEL_ID.PLATE_FAULT,
    title: "车牌找茬",
    badge: "找茬",
    description: "四组城市/地区与车牌组合中，找出对应错误的一组。",
    target: "连续答对 20 题",
    openingFeedback: "找出城市/地区与车牌对应错误的一组",
    roundHeading: "四组车牌，找出错误对应",
  },
  {
    id: GAUNTLET_LEVEL_ID.UNIVERSITY_CITY,
    title: "名校坐标",
    badge: "高校",
    description: "根据随机出现的 985、211 大学名称，写出它所在的城市。",
    target: "连续答对 20 题",
    openingFeedback: "看到 985、211 大学名称，写出它所在的城市",
    roundHeading: "名校在哪里，城市见分晓",
  },
  {
    id: GAUNTLET_LEVEL_ID.CONFUSABLE_CITIES,
    title: "双城迷阵",
    badge: "易混",
    description: "在苏州与宿州、泰州与台州等易混城市之间辨清名称和省份。",
    target: "连续答对 20 题",
    openingFeedback: "辨清读音、字形相近的城市及其所属省份",
    roundHeading: "相似城名，也要分得一清二楚",
  },
  {
    id: GAUNTLET_LEVEL_ID.PROVINCE_CITY_COUNT,
    title: "省市点兵",
    badge: "市数",
    description: "根据省级行政区名称，写出其中有多少座地级及以上城市。",
    target: "连续答对 20 题",
    openingFeedback: "看到省级行政区，写出其中有多少座地级及以上城市",
    roundHeading: "一个省级行政区，究竟有多少座城市",
  },
  {
    id: GAUNTLET_LEVEL_ID.CITY_NEIGHBORS,
    title: "邻市包围圈",
    badge: "邻市",
    description: "写出与指定行政区陆地接壤的全部省内行政区；自治州、盟及无邻市题都会出现，答错可看市界图重答。",
    target: "连续答对 20 题",
    openingFeedback: "写出与目标城市或地区陆地接壤的全部省内行政区",
    roundHeading: "看一个行政区，答出全部省内邻市",
  },
  {
    id: GAUNTLET_LEVEL_ID.PLATE_CITY_MAP,
    title: "车牌落城",
    badge: "牌位",
    description: "根据随机车牌，在所选省份地图墙中点击对应的城市或地区区块。",
    target: "连续答对 30 题",
    openingFeedback: "根据车牌，在所选省份地图墙中点击对应城市或地区",
    roundHeading: "看车牌，在多省地图墙中精准落点",
  },
  {
    id: GAUNTLET_LEVEL_ID.MISTAKE_REVENGE,
    title: "错题复仇赛",
    badge: "错题",
    description: "集中重答历史错题，答对后从错题库移除，清空本轮错题即可过关。",
    target: "清空全部历史错题",
    openingFeedback: "逐个击破历史错题，答对后从错题库移除",
    roundHeading: "把曾经答错的题一一赢回来",
  },
  {
    id: GAUNTLET_LEVEL_ID.FINAL_BOSS,
    title: "终极混战",
    badge: "终极",
    description: "六类题型随机混合，带着三条生命完成最终考验。",
    target: "3 条生命完成 30 题",
    openingFeedback: "三条生命、三十道均衡混合题，每十题通过一个检查点",
    roundHeading: "三条生命闯过三段终极混战",
  },
];

export const GAUNTLET_LEVEL_COUNT = GAUNTLET_LEVELS.length;
export const GAUNTLET_LEVEL_BY_ID = new Map(
  GAUNTLET_LEVELS.map((level) => [level.id, level]),
);
const GAUNTLET_LEVEL_NUMBER_BY_ID = new Map(
  GAUNTLET_LEVELS.map((level, index) => [level.id, index + 1]),
);

export function gauntletLevelNumber(levelId: GauntletLevelId) {
  return GAUNTLET_LEVEL_NUMBER_BY_ID.get(levelId) ?? 0;
}

export function activeGauntletCompletionCount(levelIds: readonly string[]) {
  return new Set(levelIds.filter(isGauntletLevelId)).size;
}
