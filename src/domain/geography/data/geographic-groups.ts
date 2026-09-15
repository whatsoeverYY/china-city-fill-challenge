export const RIVER_ID = {
  YANGTZE: "yangtze",
  YELLOW: "yellow",
} as const;

export type RiverId = (typeof RIVER_ID)[keyof typeof RIVER_ID];

export type RiverKnowledge = {
  id: RiverId;
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

export type ProvinceGroup = {
  title: string;
  description: string;
  codes: string[];
};

export const RIVER_KNOWLEDGE: RiverKnowledge[] = [
  {
    id: RIVER_ID.YANGTZE,
    name: "长江",
    label: "中国第一大河",
    source: "青海唐古拉山脉",
    mouth: "东海",
    length: "6300余公里",
    provinceCodes: [
      "630000", "540000", "510000", "530000", "500000", "420000",
      "430000", "360000", "340000", "320000", "310000",
    ],
    representativeCities: [
      "宜宾", "泸州", "重庆", "宜昌", "荆州", "岳阳",
      "武汉", "九江", "安庆", "南京", "镇江", "上海",
    ],
    mnemonic: "青藏川滇渝，鄂湘赣皖苏沪",
    sourceLabel: "国家发展改革委 · 长江经济带",
    sourceUrl:
      "https://cjjjd.ndrc.gov.cn/zoujinchangjiang/jingjishehuifazhan/201907/t20190713_941469.htm",
  },
  {
    id: RIVER_ID.YELLOW,
    name: "黄河",
    label: "中华民族母亲河",
    source: "青海巴颜喀拉山北麓",
    mouth: "渤海",
    length: "5464公里",
    provinceCodes: [
      "630000", "510000", "620000", "640000", "150000",
      "610000", "140000", "410000", "370000",
    ],
    representativeCities: [
      "兰州", "银川", "乌海", "包头", "三门峡",
      "洛阳", "郑州", "济南", "东营",
    ],
    mnemonic: "青川甘宁内蒙古，陕晋豫鲁入渤海",
    sourceLabel: "中国人大网 · 黄河流域",
    sourceUrl: "https://www.npc.gov.cn/c2/c30834/202204/t20220421_317601.html",
  },
];

export const RIVER_BY_ID = new Map(
  RIVER_KNOWLEDGE.map((river) => [river.id, river]),
);

export const PROVINCE_GROUPS: ProvinceGroup[] = [
  {
    title: "沿海省级行政区",
    description: "选择所有拥有海岸线的省级行政区",
    codes: [
      "120000", "130000", "210000", "310000", "320000", "330000",
      "350000", "370000", "440000", "450000", "460000", "710000",
      "810000", "820000",
    ],
  },
  {
    title: "陆地边境省级行政区",
    description: "选择所有与其他国家存在陆地边界的省级行政区",
    codes: [
      "150000", "210000", "220000", "230000", "450000", "530000",
      "540000", "620000", "650000",
    ],
  },
  {
    title: "长江干流流经省级行政区",
    description: "选择长江干流流经或作为省界经过的省级行政区",
    codes: RIVER_BY_ID.get(RIVER_ID.YANGTZE)?.provinceCodes ?? [],
  },
];

export const YELLOW_RIVER_PROVINCE_GROUP: ProvinceGroup = {
  title: "黄河干流流经省级行政区",
  description: "从青海出发，经过9个省区后在山东注入渤海",
  codes: RIVER_BY_ID.get(RIVER_ID.YELLOW)?.provinceCodes ?? [],
};
