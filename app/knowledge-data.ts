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
  levelRefs: number[];
  tone: "red" | "green" | "blue" | "gold" | "purple";
};

export const KNOWLEDGE_CATEGORIES: KnowledgeCategory[] = [
  {
    id: "province-profile",
    icon: "省",
    title: "省份全景名片",
    subtitle: "名称、简称、行政中心、类型，一张卡串起来",
    memoryStyle: "名片联想",
    levelRefs: [1, 7, 11, 16, 17, 19],
    tone: "red",
  },
  {
    id: "city-plate",
    icon: "牌",
    title: "城市与车牌密码",
    subtitle: "按省归组，把城市和车牌像扑克牌一样成套记忆",
    memoryStyle: "分组对照",
    levelRefs: [2, 3, 4, 6, 8, 9, 12, 13, 18, 23, 25],
    tone: "blue",
  },
  {
    id: "universities",
    icon: "学",
    title: "985 · 211 名校坐标",
    subtitle: "从省到城再到学校，建立清晰的名校坐标系",
    memoryStyle: "城市集群",
    levelRefs: [20],
    tone: "purple",
  },
  {
    id: "neighbors",
    icon: "邻",
    title: "陆地邻省关系",
    subtitle: "点一个省，看它的邻省像星座一样围成一圈",
    memoryStyle: "星图联想",
    levelRefs: [5, 10, 15],
    tone: "green",
  },
  {
    id: "city-counts",
    icon: "数",
    title: "每省有几座城市",
    subtitle: "用排行榜和长度条，直观看出数量差异",
    memoryStyle: "长短比较",
    levelRefs: [24],
    tone: "gold",
  },
  {
    id: "rivers",
    icon: "川",
    title: "长江 · 黄河路线",
    subtitle: "沿源头到入海口，像坐列车一样顺序记省份",
    memoryStyle: "路线记忆",
    levelRefs: [14],
    tone: "blue",
  },
  {
    id: "territory",
    icon: "界",
    title: "沿海、沿边与疆域集合",
    subtitle: "把散落省份收进几个有地理意义的集合",
    memoryStyle: "集合归纳",
    levelRefs: [14],
    tone: "green",
  },
  {
    id: "confusable",
    icon: "辨",
    title: "易混城市辨析",
    subtitle: "相似城市并排放，抓住那个最关键的不同字",
    memoryStyle: "双城对照",
    levelRefs: [22],
    tone: "red",
  },
  {
    id: "map-reading",
    icon: "路",
    title: "地图落点与路线诀窍",
    subtitle: "轮廓、方位、邻接和最短路线的实战读图方法",
    memoryStyle: "操作口诀",
    levelRefs: [8, 10, 11, 13, 15, 17, 19, 23, 25],
    tone: "gold",
  },
];

export type RiverKnowledge = {
  id: "yangtze" | "yellow";
  name: string;
  label: string;
  source: string;
  mouth: string;
  length: string;
  provinceCodes: string[];
  representativeCities: string[];
  mnemonic: string;
  sourceLabel: string;
  sourceUrl: string;
};

export const RIVER_KNOWLEDGE: RiverKnowledge[] = [
  {
    id: "yangtze",
    name: "长江",
    label: "中国第一大河",
    source: "青海唐古拉山脉",
    mouth: "东海",
    length: "6300余公里",
    provinceCodes: [
      "630000",
      "540000",
      "510000",
      "530000",
      "500000",
      "420000",
      "430000",
      "360000",
      "340000",
      "320000",
      "310000",
    ],
    representativeCities: [
      "宜宾",
      "泸州",
      "重庆",
      "宜昌",
      "荆州",
      "岳阳",
      "武汉",
      "九江",
      "安庆",
      "南京",
      "镇江",
      "上海",
    ],
    mnemonic: "青藏川滇渝，鄂湘赣皖苏沪",
    sourceLabel: "国家发展改革委 · 长江经济带",
    sourceUrl:
      "https://cjjjd.ndrc.gov.cn/zoujinchangjiang/jingjishehuifazhan/201907/t20190713_941469.htm",
  },
  {
    id: "yellow",
    name: "黄河",
    label: "中华民族母亲河",
    source: "青海巴颜喀拉山北麓",
    mouth: "渤海",
    length: "5464公里",
    provinceCodes: [
      "630000",
      "510000",
      "620000",
      "640000",
      "150000",
      "610000",
      "140000",
      "410000",
      "370000",
    ],
    representativeCities: [
      "兰州",
      "银川",
      "乌海",
      "包头",
      "三门峡",
      "洛阳",
      "郑州",
      "济南",
      "东营",
    ],
    mnemonic: "青川甘宁内蒙古，陕晋豫鲁入渤海",
    sourceLabel: "中国人大网 · 黄河流域",
    sourceUrl: "https://www.npc.gov.cn/c2/c30834/202204/t20220421_317601.html",
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
    title: "先用简称锁省，再用字母锁城",
    detail: "车牌第一个汉字确定省级范围，后面的字母再区分城市，分两步比整块死记更稳。",
    mnemonic: "汉字找省，字母找城",
  },
];
