import {
  GAUNTLET_LEVEL_ID,
  type GauntletLevelId,
} from "@/domain/game/gauntlet-level-ids";

export type KnowledgeCategoryId =
  | "province-profile"
  | "city-plate"
  | "universities"
  | "neighbors"
  | "city-counts"
  | "rivers"
  | "territory"
  | "confusable"
  | "map-reading";

export type KnowledgeCategory = {
  id: KnowledgeCategoryId;
  icon: string;
  title: string;
  subtitle: string;
  memoryStyle: string;
  levelRefs: GauntletLevelId[];
};

export const KNOWLEDGE_CATEGORIES: KnowledgeCategory[] = [
  {
    id: "province-profile",
    icon: "省",
    title: "省份全景名片",
    subtitle: "城市、州盟、直辖单位与独立车牌，一张卡串起来",
    memoryStyle: "名片联想",
    levelRefs: [
      GAUNTLET_LEVEL_ID.PROVINCE_SHAPE,
      GAUNTLET_LEVEL_ID.GEOGRAPHY_ELIMINATION,
    ],
  },
  {
    id: "city-plate",
    icon: "牌",
    title: "城市与车牌密码",
    subtitle: "按省归组，特别标出双号牌、三号牌城市及全部前缀",
    memoryStyle: "分组对照",
    levelRefs: [
      GAUNTLET_LEVEL_ID.CITY_PROVINCE,
      GAUNTLET_LEVEL_ID.PLATE_PLACE,
      GAUNTLET_LEVEL_ID.PLATE_COMPLETION,
      GAUNTLET_LEVEL_ID.CITY_MAP,
      GAUNTLET_LEVEL_ID.TRUTH_FLASH,
      GAUNTLET_LEVEL_ID.CITY_UNDERCOVER,
      GAUNTLET_LEVEL_ID.REGION_MAP,
      GAUNTLET_LEVEL_ID.PLATE_FAULT,
      GAUNTLET_LEVEL_ID.PLATE_CITY_MAP,
    ],
  },
  {
    id: "universities",
    icon: "学",
    title: "985 · 211 名校坐标",
    subtitle: "从省到城再到学校，建立清晰的名校坐标系",
    memoryStyle: "城市集群",
    levelRefs: [GAUNTLET_LEVEL_ID.UNIVERSITY_CITY],
  },
  {
    id: "neighbors",
    icon: "邻",
    title: "陆地邻省关系",
    subtitle: "点一个省，看它的邻省像星座一样围成一圈",
    memoryStyle: "星图联想",
    levelRefs: [
      GAUNTLET_LEVEL_ID.PROVINCE_NEIGHBORS,
      GAUNTLET_LEVEL_ID.NEIGHBOR_CHAIN,
    ],
  },
  {
    id: "city-counts",
    icon: "数",
    title: "每省有几座城市",
    subtitle: "用排行榜和长度条，直观看出数量差异",
    memoryStyle: "长短比较",
    levelRefs: [GAUNTLET_LEVEL_ID.PROVINCE_CITY_COUNT],
  },
  {
    id: "rivers",
    icon: "川",
    title: "长江 · 黄河路线",
    subtitle: "沿源头到入海口，像坐列车一样顺序记省份",
    memoryStyle: "路线记忆",
    levelRefs: [GAUNTLET_LEVEL_ID.TERRITORY_GROUPS],
  },
  {
    id: "territory",
    icon: "界",
    title: "沿海、沿边与疆域集合",
    subtitle: "把散落省份收进几个有地理意义的集合",
    memoryStyle: "集合归纳",
    levelRefs: [GAUNTLET_LEVEL_ID.TERRITORY_GROUPS],
  },
  {
    id: "confusable",
    icon: "辨",
    title: "易混城市辨析",
    subtitle: "相似城市并排放，抓住那个最关键的不同字",
    memoryStyle: "双城对照",
    levelRefs: [GAUNTLET_LEVEL_ID.CONFUSABLE_CITIES],
  },
  {
    id: "map-reading",
    icon: "路",
    title: "地图落点与路线诀窍",
    subtitle: "轮廓、方位、邻接和最短路线的实战读图方法",
    memoryStyle: "操作口诀",
    levelRefs: [
      GAUNTLET_LEVEL_ID.CITY_MAP,
      GAUNTLET_LEVEL_ID.NEIGHBOR_CHAIN,
      GAUNTLET_LEVEL_ID.REGION_MAP,
      GAUNTLET_LEVEL_ID.PROVINCE_SHAPE,
      GAUNTLET_LEVEL_ID.PLATE_CITY_MAP,
    ],
  },
];

export const MAP_READING_TIPS = [
  {
    mark: "形",
    title: "先看外轮廓，再看所在方位",
    detail: "轮廓相似时，把它放回东北、沿海、西北或西南的大方位里，答案会迅速缩小。",
    mnemonic: "形状定候选，方位做排除",
  },
  {
    mark: "边",
    title: "红省界，绿市界",
    detail: "先沿红色省界确认题目范围，再在绿色市界里判断目标区块，避免被细碎边界带跑。",
    mnemonic: "先红后绿，由大到小",
  },
  {
    mark: "邻",
    title: "接壤必须真正共边",
    detail: "只在一点相碰不算可通行；路线题只沿共享边界前进，海上相望也不算陆地邻省。",
    mnemonic: "共线才算邻，隔海不能走",
  },
  {
    mark: "路",
    title: "最短路线要逐层扩散",
    detail: "从起点开始，一圈圈检查尚未访问的邻区；第一次到达终点时，就是最少步数。",
    mnemonic: "一圈一圈找，首次到达最短",
  },
  {
    mark: "牌",
    title: "先用简称锁省，再把同城字母成套记住",
    detail: "车牌第一个汉字确定省级范围，后面的字母再区分城市；遇到多号牌城市，要把全部前缀作为一个答案集合记忆。",
    mnemonic: "汉字找省，多牌成套",
  },
];
