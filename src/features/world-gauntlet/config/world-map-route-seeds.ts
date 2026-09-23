export type WorldMapRouteSeed = {
  id: string;
  name: string;
  continentId:
    | "africa"
    | "asia"
    | "europe"
    | "north-america"
    | "south-america"
    | "oceania";
  continentName: string;
  subregions: readonly string[];
  briefing: string;
};

export const WORLD_MAP_ROUTE_SEEDS: readonly WorldMapRouteSeed[] = [
  {
    id: "eastern-asia",
    name: "东亚",
    continentId: "asia",
    continentName: "亚洲",
    subregions: ["Eastern Asia"],
    briefing: "从亚洲东部开始，辨认大陆边缘、半岛与岛弧上的国家。",
  },
  {
    id: "south-eastern-asia",
    name: "东南亚",
    continentId: "asia",
    continentName: "亚洲",
    subregions: ["South-eastern Asia"],
    briefing: "沿中南半岛与马来群岛前进，留意狭长国土和群岛国。",
  },
  {
    id: "southern-central-asia",
    name: "南亚与中亚",
    continentId: "asia",
    continentName: "亚洲",
    subregions: ["Southern Asia", "Central Asia"],
    briefing: "从喜马拉雅山脉两侧延伸到中亚腹地，观察内陆国家的相对位置。",
  },
  {
    id: "western-asia",
    name: "西亚",
    continentId: "asia",
    continentName: "亚洲",
    subregions: ["Western Asia"],
    briefing: "聚焦地中海东岸、阿拉伯半岛和高加索周边的国家。",
  },
  {
    id: "northern-africa",
    name: "北非",
    continentId: "africa",
    continentName: "非洲",
    subregions: ["Northern Africa"],
    briefing: "沿地中海南岸和撒哈拉北缘，点亮非洲北部国家。",
  },
  {
    id: "western-africa",
    name: "西非",
    continentId: "africa",
    continentName: "非洲",
    subregions: ["Western Africa"],
    briefing: "围绕几内亚湾与萨赫勒地区，辨认密集分布的国家。",
  },
  {
    id: "eastern-africa",
    name: "东非",
    continentId: "africa",
    continentName: "非洲",
    subregions: ["Eastern Africa"],
    briefing: "沿非洲之角、东非高原与印度洋岛屿完成探索。",
  },
  {
    id: "middle-southern-africa",
    name: "中非与南部非洲",
    continentId: "africa",
    continentName: "非洲",
    subregions: ["Middle Africa", "Southern Africa"],
    briefing: "从刚果盆地一路向南，观察内陆国与沿海国的边界。",
  },
  {
    id: "northern-western-europe",
    name: "北欧与西欧",
    continentId: "europe",
    continentName: "欧洲",
    subregions: ["Northern Europe", "Western Europe"],
    briefing: "从北大西洋岛屿到欧洲西部，识别海岸线曲折的国家。",
  },
  {
    id: "eastern-europe",
    name: "东欧",
    continentId: "europe",
    continentName: "欧洲",
    subregions: ["Eastern Europe"],
    briefing: "在欧洲东部的大平原上，根据面积与邻接关系寻找国家。",
  },
  {
    id: "southern-europe",
    name: "南欧",
    continentId: "europe",
    continentName: "欧洲",
    subregions: ["Southern Europe"],
    briefing: "沿伊比利亚、亚平宁和巴尔干半岛辨认国家。",
  },
  {
    id: "northern-central-america",
    name: "北美大陆与中美洲",
    continentId: "north-america",
    continentName: "北美洲",
    subregions: ["Northern America", "Central America"],
    briefing: "从北美大陆向南穿过中美洲地峡，按位置逐国点亮。",
  },
  {
    id: "caribbean",
    name: "加勒比地区",
    continentId: "north-america",
    continentName: "北美洲",
    subregions: ["Caribbean"],
    briefing: "放大加勒比海，在大、小安的列斯群岛之间寻找岛国。",
  },
  {
    id: "south-america",
    name: "南美洲",
    continentId: "south-america",
    continentName: "南美洲",
    subregions: ["South America"],
    briefing: "以安第斯山脉与大西洋海岸为线索，点亮南美洲国家。",
  },
  {
    id: "oceania-pacific",
    name: "大洋洲与太平洋岛国",
    continentId: "oceania",
    continentName: "大洋洲",
    subregions: [
      "Australia and New Zealand",
      "Melanesia",
      "Micronesia",
      "Polynesia",
    ],
    briefing: "放大太平洋区域，在澳新与三大岛群之间完成探索。",
  },
] as const;

export const DEFAULT_WORLD_MAP_ROUTE_ID = "eastern-asia";
