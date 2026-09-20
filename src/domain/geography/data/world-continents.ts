export type WorldContinent = {
  id: string;
  name: string;
  englishName: string;
  countryCount: number;
  description: string;
};

export const WORLD_CONTINENTS: readonly WorldContinent[] = [
  {
    id: "asia",
    name: "亚洲",
    englishName: "Asia",
    countryCount: 48,
    description: "面积最大、人口最多的洲，横跨东西半球。",
  },
  {
    id: "africa",
    name: "非洲",
    englishName: "Africa",
    countryCount: 54,
    description: "国家数量最多的洲，赤道横贯其中部。",
  },
  {
    id: "europe",
    name: "欧洲",
    englishName: "Europe",
    countryCount: 44,
    description: "位于亚欧大陆西部，海岸线曲折、半岛众多。",
  },
  {
    id: "north-america",
    name: "北美洲",
    englishName: "North America",
    countryCount: 23,
    description: "包括北美大陆、中美洲和加勒比海岛国。",
  },
  {
    id: "south-america",
    name: "南美洲",
    englishName: "South America",
    countryCount: 12,
    description: "安第斯山脉纵贯西部，亚马孙河流域位于其中。",
  },
  {
    id: "oceania",
    name: "大洋洲",
    englishName: "Oceania",
    countryCount: 14,
    description: "由澳大利亚大陆和太平洋众多岛屿组成。",
  },
  {
    id: "antarctica",
    name: "南极洲",
    englishName: "Antarctica",
    countryCount: 0,
    description: "没有主权国家，依据《南极条约》体系开展和平与科研活动。",
  },
] as const;
