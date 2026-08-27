export type AdministrativeCategory = {
  label: string;
  count: number;
};

export type SpecialPlateRegion = {
  name: string;
  type: string;
  plate: string;
  note?: string;
};

export type ProvinceAdministrativeProfile = {
  code: string;
  totalUnitCount: number;
  categories: AdministrativeCategory[];
  plateRegions: SpecialPlateRegion[];
  note?: string;
};

const profile = (
  code: string,
  totalUnitCount: number,
  categories: AdministrativeCategory[],
  plateRegions: SpecialPlateRegion[],
  note?: string,
): ProvinceAdministrativeProfile => ({
  code,
  totalUnitCount,
  categories,
  plateRegions,
  note,
});

const region = (
  name: string,
  type: string,
  plate: string,
  note?: string,
): SpecialPlateRegion => ({ name, type, plate, note });

/**
 * “综合总量”用于省份名片记忆：地级及以上城市数，加上另列的州、地区、盟、
 * 省直辖县级单位等。雄安新区、杨凌示范区按独立号牌学习单元纳入，但不改变
 * 《中国统计年鉴》的城市数量口径。
 */
export const PROVINCE_ADMINISTRATIVE_PROFILE_DATA: ProvinceAdministrativeProfile[] = [
  profile(
    "130000",
    12,
    [{ label: "国家级新区", count: 1 }],
    [region("雄安新区", "国家级新区", "冀X")],
    "雄安新区按独立号牌学习单元纳入综合总量。",
  ),
  profile(
    "150000",
    12,
    [{ label: "盟", count: 3 }],
    [
      region("兴安盟", "盟", "蒙F"),
      region("锡林郭勒盟", "盟", "蒙H"),
      region("阿拉善盟", "盟", "蒙M"),
    ],
  ),
  profile(
    "220000",
    9,
    [{ label: "自治州", count: 1 }],
    [region("延边朝鲜族自治州", "自治州", "吉H")],
  ),
  profile(
    "230000",
    13,
    [{ label: "地区", count: 1 }],
    [region("大兴安岭地区", "地区", "黑P")],
  ),
  profile(
    "410000",
    18,
    [{ label: "省直辖县级市", count: 1 }],
    [region("济源市", "省直辖县级市", "豫U")],
  ),
  profile(
    "420000",
    17,
    [
      { label: "自治州", count: 1 },
      { label: "省直辖县级市", count: 3 },
      { label: "林区", count: 1 },
    ],
    [
      region("恩施土家族苗族自治州", "自治州", "鄂Q"),
      region("仙桃市", "省直辖县级市", "鄂M"),
      region("潜江市", "省直辖县级市", "鄂N"),
      region("天门市", "省直辖县级市", "鄂R"),
      region("神农架林区", "林区", "鄂P"),
    ],
  ),
  profile(
    "430000",
    14,
    [{ label: "自治州", count: 1 }],
    [region("湘西土家族苗族自治州", "自治州", "湘U")],
  ),
  profile(
    "460000",
    19,
    [
      { label: "省直辖县级市", count: 5 },
      { label: "省直辖县", count: 4 },
      { label: "省直辖自治县", count: 6 },
    ],
    [
      region(
        "琼C号段市县",
        "省直辖号段",
        "琼C",
        "琼海、文昌、万宁、定安、屯昌、澄迈、临高",
      ),
      region(
        "琼D号段市县",
        "省直辖号段",
        "琼D",
        "五指山、东方、白沙、昌江、乐东、陵水、保亭、琼中",
      ),
      region("洋浦经济开发区", "开发区保留号段", "琼E"),
    ],
    "海南另有15个省直辖县级单位，车牌按琼C、琼D两大片区记忆。",
  ),
  profile(
    "510000",
    21,
    [{ label: "自治州", count: 3 }],
    [
      region("阿坝藏族羌族自治州", "自治州", "川U"),
      region("甘孜藏族自治州", "自治州", "川V"),
      region("凉山彝族自治州", "自治州", "川W"),
    ],
  ),
  profile(
    "520000",
    9,
    [{ label: "自治州", count: 3 }],
    [
      region("黔西南布依族苗族自治州", "自治州", "贵E"),
      region("黔东南苗族侗族自治州", "自治州", "贵H"),
      region("黔南布依族苗族自治州", "自治州", "贵J"),
    ],
  ),
  profile(
    "530000",
    16,
    [{ label: "自治州", count: 8 }],
    [
      region("楚雄彝族自治州", "自治州", "云E"),
      region("红河哈尼族彝族自治州", "自治州", "云G"),
      region("文山壮族苗族自治州", "自治州", "云H"),
      region("西双版纳傣族自治州", "自治州", "云K"),
      region("大理白族自治州", "自治州", "云L"),
      region("德宏傣族景颇族自治州", "自治州", "云N"),
      region("怒江傈僳族自治州", "自治州", "云Q"),
      region("迪庆藏族自治州", "自治州", "云R"),
    ],
  ),
  profile(
    "540000",
    7,
    [{ label: "地区", count: 1 }],
    [region("阿里地区", "地区", "藏F")],
  ),
  profile(
    "610000",
    11,
    [{ label: "示范区", count: 1 }],
    [region("杨凌农业高新技术产业示范区", "示范区", "陕V")],
    "杨凌示范区按独立号牌学习单元纳入综合总量。",
  ),
  profile(
    "620000",
    14,
    [{ label: "自治州", count: 2 }],
    [
      region("临夏回族自治州", "自治州", "甘N"),
      region("甘南藏族自治州", "自治州", "甘P"),
    ],
  ),
  profile(
    "630000",
    8,
    [{ label: "自治州", count: 6 }],
    [
      region("海北藏族自治州", "自治州", "青C"),
      region("黄南藏族自治州", "自治州", "青D"),
      region("海南藏族自治州", "自治州", "青E"),
      region("果洛藏族自治州", "自治州", "青F"),
      region("玉树藏族自治州", "自治州", "青G"),
      region("海西蒙古族藏族自治州", "自治州", "青H"),
    ],
  ),
  profile(
    "650000",
    27,
    [
      { label: "自治州", count: 5 },
      { label: "地区", count: 5 },
      { label: "自治区直辖县级市", count: 13 },
    ],
    [
      region("昌吉回族自治州", "自治州", "新B"),
      region("石河子市", "自治区直辖县级市", "新C"),
      region("奎屯市", "自治州辖县级市", "新D"),
      region("博尔塔拉蒙古自治州", "自治州", "新E"),
      region("伊犁哈萨克自治州", "自治州", "新F"),
      region("塔城地区", "地区", "新G"),
      region("阿勒泰地区", "地区", "新H"),
      region("巴音郭楞蒙古自治州", "自治州", "新M"),
      region("阿克苏地区", "地区", "新N"),
      region("克孜勒苏柯尔克孜自治州", "自治州", "新P"),
      region("喀什地区", "地区", "新Q"),
      region("和田地区", "地区", "新R"),
      region("昆玉市", "自治区直辖县级市", "新S"),
    ],
    "已含2026年4月设立的草湖市；其余自治区直辖县级市沿用所在片区号段，奎屯虽隶属伊犁州，因新D独立列出。",
  ),
  profile(
    "710000",
    22,
    [{ label: "县", count: 13 }],
    [],
    "当地机动车号牌不采用大陆省级简称加区域字母的分配方式。",
  ),
  profile(
    "810000",
    18,
    [{ label: "分区", count: 18 }],
    [],
    "香港机动车号牌不按18区分配固定区域前缀。",
  ),
  profile(
    "820000",
    8,
    [
      { label: "堂区", count: 7 },
      { label: "路凼填海区", count: 1 },
    ],
    [],
    "地图按7个传统堂区和路凼填海区共8个学习区块展示；澳门机动车号牌不按这些区域分配固定前缀。",
  ),
];

const PROFILE_BY_CODE = new Map(
  PROVINCE_ADMINISTRATIVE_PROFILE_DATA.map((item) => [item.code, item]),
);

export function getProvinceAdministrativeProfile(
  code: string,
  cityCount: number,
): ProvinceAdministrativeProfile {
  return PROFILE_BY_CODE.get(code) ?? {
    code,
    totalUnitCount: cityCount,
    categories: [],
    plateRegions: [],
  };
}
