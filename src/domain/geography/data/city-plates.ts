import { PROVINCE_ADMINISTRATIVE_PROFILE_DATA } from "./province-administrative-profiles.ts";
import { PROVINCE_BY_CODE } from "./provinces.ts";

export type CityQuizItem = {
  city: string;
  provinceCode: string;
  province: string;
  provinceShort: string;
  plates: string[];
  plate: string;
  plateNote?: string;
  entityType: string;
  mapRegion: boolean;
};

type CityQuizGroup = [
  provinceCode: string,
  cities: Array<[
    city: string,
    plates: string | string[],
    plateNote?: string,
  ]>,
];

const CITY_QUIZ_GROUPS: CityQuizGroup[] = [
  [
    "130000",
    [
      ["石家庄市", "冀A"], ["唐山市", "冀B"], ["秦皇岛市", "冀C"], ["邯郸市", "冀D"], ["邢台市", "冀E"], ["保定市", "冀F"], ["张家口市", "冀G"], ["承德市", "冀H"], ["沧州市", "冀J"], ["廊坊市", "冀R"], ["衡水市", "冀T"],
    ],
  ],

  [
    "140000",
    [
      ["太原市", "晋A"], ["大同市", "晋B"], ["阳泉市", "晋C"], ["长治市", "晋D"], ["晋城市", "晋E"], ["朔州市", "晋F"], ["忻州市", "晋H"], ["吕梁市", "晋J"], ["晋中市", "晋K"], ["临汾市", "晋L"], ["运城市", "晋M"],
    ],
  ],

  [
    "150000",
    [
      ["呼和浩特市", "蒙A"], ["包头市", "蒙B"], ["乌海市", "蒙C"], ["赤峰市", "蒙D"], ["呼伦贝尔市", "蒙E"], ["通辽市", "蒙G"], ["乌兰察布市", "蒙J"], ["鄂尔多斯市", "蒙K"], ["巴彦淖尔市", "蒙L"],
    ],
  ],

  [
    "210000",
    [
      ["沈阳市", "辽A"], ["大连市", "辽B"], ["鞍山市", "辽C"], ["抚顺市", "辽D"], ["本溪市", "辽E"], ["丹东市", "辽F"], ["锦州市", "辽G"], ["营口市", "辽H"], ["阜新市", "辽J"], ["辽阳市", "辽K"], ["盘锦市", "辽L"], ["铁岭市", "辽M"], ["朝阳市", "辽N"], ["葫芦岛市", "辽P"],
    ],
  ],

  [
    "220000",
    [
      ["长春市", "吉A"], ["吉林市", "吉B"], ["四平市", "吉C"], ["辽源市", "吉D"], ["通化市", "吉E"], ["白山市", "吉F"], ["白城市", "吉G"], ["松原市", "吉J"],
    ],
  ],

  [
    "230000",
    [
      ["哈尔滨市", ["黑A", "黑L"], "黑L源自原松花江地区，属行政区划调整后保留的历史号段。"], ["齐齐哈尔市", "黑B"], ["牡丹江市", "黑C"], ["佳木斯市", "黑D"], ["大庆市", "黑E"], ["伊春市", "黑F"], ["鸡西市", "黑G"], ["鹤岗市", "黑H"], ["双鸭山市", "黑J"], ["七台河市", "黑K"], ["绥化市", "黑M"], ["黑河市", "黑N"],
    ],
  ],

  [
    "320000",
    [
      ["南京市", "苏A"], ["无锡市", "苏B"], ["徐州市", "苏C"], ["常州市", "苏D"], ["苏州市", ["苏E", "苏U"], "2019年启用苏U作为补充号牌，与苏E同属苏州籍。"], ["南通市", "苏F"], ["连云港市", "苏G"], ["淮安市", "苏H"], ["盐城市", "苏J"], ["扬州市", "苏K"], ["镇江市", "苏L"], ["泰州市", "苏M"], ["宿迁市", "苏N"],
    ],
  ],

  [
    "330000",
    [
      ["杭州市", ["浙A", "浙M"], "2024年10月29日启用小型汽车浙M号牌，与浙A同属杭州。"], ["宁波市", "浙B"], ["温州市", "浙C"], ["绍兴市", "浙D"], ["湖州市", "浙E"], ["嘉兴市", "浙F"], ["金华市", "浙G"], ["衢州市", "浙H"], ["台州市", "浙J"], ["丽水市", "浙K"], ["舟山市", "浙L"],
    ],
  ],

  [
    "340000",
    [
      ["合肥市", ["皖A", "皖Q"], "皖Q源自原巢湖市，行政区划调整后部分号牌在合肥辖区沿用。"], ["芜湖市", "皖B"], ["蚌埠市", "皖C"], ["淮南市", "皖D"], ["马鞍山市", "皖E"], ["淮北市", "皖F"], ["铜陵市", "皖G"], ["安庆市", "皖H"], ["黄山市", "皖J"], ["阜阳市", "皖K"], ["宿州市", "皖L"], ["滁州市", "皖M"], ["六安市", "皖N"], ["宣城市", "皖P"], ["池州市", "皖R"], ["亳州市", "皖S"],
    ],
  ],

  [
    "350000",
    [
      ["福州市", ["闽A", "闽K"], "闽K主要关联平潭等区域号牌业务，与闽A一并作为福州地区常见前缀学习。"], ["莆田市", "闽B"], ["泉州市", "闽C"], ["厦门市", "闽D"], ["漳州市", "闽E"], ["龙岩市", "闽F"], ["三明市", "闽G"], ["南平市", "闽H"], ["宁德市", "闽J"],
    ],
  ],

  [
    "360000",
    [
      ["南昌市", ["赣A", "赣M"], "赣M是南昌及省直系统沿用的历史、增补号段。"], ["赣州市", "赣B"], ["宜春市", "赣C"], ["吉安市", "赣D"], ["上饶市", "赣E"], ["抚州市", "赣F"], ["九江市", "赣G"], ["景德镇市", "赣H"], ["萍乡市", "赣J"], ["新余市", "赣K"], ["鹰潭市", "赣L"],
    ],
  ],

  [
    "370000",
    [
      ["济南市", ["鲁A", "鲁S"], "鲁S源自原莱芜市，2019年区划调整后随莱芜区、钢城区归入济南。"], ["青岛市", ["鲁B", "鲁U"], "鲁U是青岛的补充号段，与鲁B同属青岛。"], ["淄博市", "鲁C"], ["枣庄市", "鲁D"], ["东营市", "鲁E"], ["烟台市", ["鲁F", "鲁Y"], "鲁Y是烟台的补充号段，与鲁F同属烟台。"], ["潍坊市", ["鲁G", "鲁V"], "鲁V是潍坊的补充号段，与鲁G同属潍坊。"], ["济宁市", "鲁H"], ["泰安市", "鲁J"], ["威海市", "鲁K"], ["日照市", "鲁L"], ["滨州市", "鲁M"], ["德州市", "鲁N"], ["聊城市", "鲁P"], ["临沂市", ["鲁Q", "鲁W"], "2024年3月29日启用小型汽车鲁W号牌，与鲁Q同属临沂。"], ["菏泽市", "鲁R"],
    ],
  ],

  [
    "410000",
    [
      ["郑州市", ["豫A", "豫V"], "2020年9月16日启用小型非新能源汽车豫V号牌，与豫A同属郑州。"], ["开封市", "豫B"], ["洛阳市", "豫C"], ["平顶山市", "豫D"], ["安阳市", "豫E"], ["鹤壁市", "豫F"], ["新乡市", "豫G"], ["焦作市", "豫H"], ["濮阳市", "豫J"], ["许昌市", "豫K"], ["漯河市", "豫L"], ["三门峡市", "豫M"], ["商丘市", "豫N"], ["周口市", "豫P"], ["驻马店市", "豫Q"], ["南阳市", "豫R"], ["信阳市", "豫S"], ["济源市", "豫U"],
    ],
  ],

  [
    "420000",
    [
      ["武汉市", ["鄂A", "鄂W"], "2022年4月26日启用小型非新能源汽车鄂W号牌，与鄂A同属武汉。"], ["黄石市", "鄂B"], ["十堰市", "鄂C"], ["荆州市", "鄂D"], ["宜昌市", "鄂E"], ["襄阳市", "鄂F"], ["鄂州市", "鄂G"], ["荆门市", "鄂H"], ["黄冈市", "鄂J"], ["孝感市", "鄂K"], ["咸宁市", "鄂L"], ["仙桃市", "鄂M"], ["潜江市", "鄂N"], ["天门市", "鄂R"], ["随州市", "鄂S"],
    ],
  ],

  [
    "430000",
    [
      ["长沙市", "湘A"], ["株洲市", "湘B"], ["湘潭市", "湘C"], ["衡阳市", "湘D"], ["邵阳市", "湘E"], ["岳阳市", "湘F"], ["张家界市", "湘G"], ["益阳市", "湘H"], ["常德市", "湘J"], ["娄底市", "湘K"], ["郴州市", "湘L"], ["永州市", "湘M"], ["怀化市", "湘N"],
    ],
  ],

  [
    "440000",
    [
      ["广州市", "粤A"], ["深圳市", "粤B"], ["珠海市", "粤C"], ["汕头市", "粤D"], ["佛山市", ["粤E", "粤X", "粤Y"], "粤X、粤Y分别源自顺德、南海的历史独立号段，佛山因此拥有三组城市前缀。"], ["韶关市", "粤F"], ["湛江市", "粤G"], ["肇庆市", "粤H"], ["江门市", "粤J"], ["茂名市", "粤K"], ["惠州市", "粤L"], ["梅州市", "粤M"], ["汕尾市", "粤N"], ["河源市", "粤P"], ["阳江市", "粤Q"], ["清远市", "粤R"], ["东莞市", "粤S"], ["中山市", "粤T"], ["潮州市", "粤U"], ["揭阳市", "粤V"], ["云浮市", "粤W"],
    ],
  ],

  [
    "450000",
    [
      ["南宁市", ["桂A", "桂F"], "桂F源自原南宁地区；区划调整后部分历史号牌保留，现行城市主前缀为桂A。"], ["柳州市", "桂B"], ["桂林市", ["桂C", "桂H"], "桂H源自原桂林地区，区划调整后与桂C共同成为桂林常见前缀。"], ["梧州市", "桂D"], ["北海市", "桂E"], ["崇左市", "桂F"], ["来宾市", "桂G"], ["贺州市", "桂J"], ["玉林市", "桂K"], ["百色市", "桂L"], ["河池市", "桂M"], ["钦州市", "桂N"], ["防城港市", "桂P"], ["贵港市", "桂R"],
    ],
  ],

  [
    "460000",
    [
      ["海口市", "琼A"], ["三亚市", "琼B"], ["琼海市", "琼C", "琼C由琼海、文昌、万宁及定安、屯昌、澄迈、临高等琼北市县共用。"], ["文昌市", "琼C", "琼C由琼海、文昌、万宁及定安、屯昌、澄迈、临高等琼北市县共用。"], ["万宁市", "琼C", "琼C由琼海、文昌、万宁及定安、屯昌、澄迈、临高等琼北市县共用。"], ["三沙市", "琼CXS", "三沙使用琼C下的XS专门号段；2018年起，原琼CXS号段车辆业务下放至文昌市车辆管理所办理。"], ["东方市", "琼D", "琼D由五指山、东方及白沙、昌江、乐东、陵水、保亭、琼中等中南部市县共用。"], ["五指山市", "琼D", "琼D由五指山、东方及白沙、昌江、乐东、陵水、保亭、琼中等中南部市县共用。"], ["儋州市", "琼F", "2016年7月起，儋州启用琼F发牌机关代号。"],
    ],
  ],

  [
    "510000",
    [
      ["成都市", ["川A", "川G"], "2017年获批启用川G补充号牌，与川A同属成都籍。"], ["绵阳市", "川B"], ["自贡市", "川C"], ["攀枝花市", "川D"], ["泸州市", "川E"], ["德阳市", "川F"], ["广元市", "川H"], ["遂宁市", "川J"], ["内江市", "川K"], ["乐山市", "川L"], ["资阳市", "川M"], ["宜宾市", "川Q"], ["南充市", "川R"], ["达州市", "川S"], ["雅安市", "川T"], ["广安市", "川X"], ["巴中市", "川Y"], ["眉山市", "川Z"],
    ],
  ],

  [
    "520000",
    [
      ["贵阳市", "贵A"], ["六盘水市", "贵B"], ["遵义市", "贵C"], ["铜仁市", "贵D"], ["毕节市", "贵F"], ["安顺市", "贵G"],
    ],
  ],

  [
    "530000",
    [
      ["昆明市", "云A"], ["昭通市", "云C"], ["曲靖市", "云D"], ["玉溪市", "云F"], ["普洱市", "云J"], ["保山市", "云M"], ["丽江市", "云P"], ["临沧市", "云S"],
    ],
  ],

  [
    "540000",
    [
      ["拉萨市", "藏A"], ["昌都市", "藏B"], ["山南市", "藏C"], ["日喀则市", "藏D"], ["那曲市", "藏E"], ["林芝市", "藏G"],
    ],
  ],

  [
    "610000",
    [
      ["西安市", ["陕A", "陕U"], "2020年4月1日启用小型非新能源汽车陕U号牌，与陕A同属西安。"], ["铜川市", "陕B"], ["宝鸡市", "陕C"], ["咸阳市", "陕D"], ["渭南市", "陕E"], ["汉中市", "陕F"], ["安康市", "陕G"], ["商洛市", "陕H"], ["延安市", "陕J"], ["榆林市", "陕K"],
    ],
  ],

  [
    "620000",
    [
      ["兰州市", "甘A"], ["嘉峪关市", "甘B"], ["金昌市", "甘C"], ["白银市", "甘D"], ["天水市", "甘E"], ["酒泉市", "甘F"], ["张掖市", "甘G"], ["武威市", "甘H"], ["定西市", "甘J"], ["陇南市", "甘K"], ["平凉市", "甘L"], ["庆阳市", "甘M"],
    ],
  ],

  [
    "630000",
    [
      ["西宁市", "青A"], ["海东市", "青B"],
    ],
  ],

  [
    "640000",
    [
      ["银川市", "宁A"], ["石嘴山市", "宁B"], ["固原市", "宁D"], ["中卫市", "宁E"],
    ],
  ],

  [
    "650000",
    [
      ["乌鲁木齐市", "新A"], ["石河子市", "新C"], ["克拉玛依市", "新J"], ["吐鲁番市", "新K"], ["哈密市", "新L"],
    ],
  ],
];

export const CITY_QUIZ_DATA: CityQuizItem[] = CITY_QUIZ_GROUPS.flatMap(
  ([provinceCode, cities]) => {
    const province = PROVINCE_BY_CODE.get(provinceCode);
    if (!province) return [];
    return cities.map(([city, plateValue, plateNote]) => {
      const plates = typeof plateValue === "string" ? [plateValue] : plateValue;
      return {
        city,
        provinceCode,
        province: province.name,
        provinceShort: province.shortName,
        plates,
        plate: plates.join(" / "),
        plateNote,
        entityType: "城市",
        mapRegion: true,
      };
    });
  },
);

const NON_ENTITY_PLATE_REGION_TYPES = new Set(["省直辖号段"]);
const NON_MAP_PLATE_REGION_TYPES = new Set([
  "国家级新区",
  "保护开发区",
  "示范区",
  "开发区历史独立号段",
  "自治州辖县级市",
]);
const CITY_QUIZ_NAMES = new Set(CITY_QUIZ_DATA.map((item) => item.city));

/**
 * All named areas in the knowledge profiles that have their own plate prefix.
 * Aggregate labels such as “琼C号段市县” stay in the profile, while real
 * administrative areas and special zones join the plate quiz pool.
 */
export const SPECIAL_PLATE_QUIZ_DATA: CityQuizItem[] =
  PROVINCE_ADMINISTRATIVE_PROFILE_DATA.flatMap((profile) => {
    const province = PROVINCE_BY_CODE.get(profile.code);
    if (!province) return [];
    return profile.plateRegions
      .filter(
        (item) =>
          !CITY_QUIZ_NAMES.has(item.name) &&
          !NON_ENTITY_PLATE_REGION_TYPES.has(item.type),
      )
      .map((item) => ({
        city: item.name,
        provinceCode: province.code,
        province: province.name,
        provinceShort: province.shortName,
        plates: [item.plate],
        plate: item.plate,
        plateNote:
          item.note ?? `${item.name}是${item.type}，使用 ${item.plate} 号牌前缀。`,
        entityType: item.type,
        mapRegion: !NON_MAP_PLATE_REGION_TYPES.has(item.type),
      }));
  });

export const PLATE_QUIZ_DATA: CityQuizItem[] = [
  ...CITY_QUIZ_DATA,
  ...SPECIAL_PLATE_QUIZ_DATA,
];

export const CITY_PLATE_PREFIX_COUNT = PLATE_QUIZ_DATA.reduce(
  (total, item) => total + item.plates.length,
  0,
);

export const MULTI_PLATE_CITY_COUNT = PLATE_QUIZ_DATA.filter(
  (item) => item.plates.length > 1,
).length;

function normalizePlateToken(value: string) {
  return value.trim().replace(/[·.-]/g, "").toUpperCase();
}

function plateLetterCode(value: string) {
  return normalizePlateToken(value).replace(/^\p{Script=Han}/u, "");
}

export function plateCollectionsOverlap(
  left: readonly string[],
  right: readonly string[],
) {
  const normalizedLeft = new Set(left.map(normalizePlateToken));
  return right.some((plate) => normalizedLeft.has(normalizePlateToken(plate)));
}

/**
 * Reverse plate questions must identify exactly one city. Shared plate prefixes,
 * such as 琼C and 琼D, remain valid for forward city-to-plate questions but are
 * excluded when several cities in the current pool have the same complete set.
 */
export function uniqueReversePlateItems(items: readonly CityQuizItem[]) {
  const collectionKey = (item: CityQuizItem) =>
    item.plates.map(normalizePlateToken).sort().join("|");
  const counts = new Map<string, number>();

  for (const item of items) {
    const key = collectionKey(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return items.filter((item) => counts.get(collectionKey(item)) === 1);
}

function splitPlateAnswer(value: string) {
  return value
    .trim()
    .toUpperCase()
    .split(/[\s,，、/|｜;；+和及]+/u)
    .flatMap((part) => {
      const normalized = normalizePlateToken(part);
      if (!normalized) return [];
      const completePlates = normalized.match(/[\p{Script=Han}][A-Z]/gu);
      if (completePlates?.join("") === normalized) return completePlates;
      if (/^[A-Z]+$/.test(normalized)) return normalized.split("");
      return [normalized];
    });
}

export function plateAnswerMatches(
  answer: string,
  expectedPlates: string[],
  lettersOnly = false,
) {
  const expected = expectedPlates.map((plate) => lettersOnly
    ? plateLetterCode(plate)
    : normalizePlateToken(plate));
  const actual = expectedPlates.length === 1 && lettersOnly
    ? [plateLetterCode(answer)]
    : splitPlateAnswer(answer).map((plate) => lettersOnly
      ? plateLetterCode(plate)
      : plate);
  const expectedSet = new Set(expected);
  const actualSet = new Set(actual);
  return (
    expectedSet.size === actualSet.size &&
    Array.from(expectedSet).every((plate) => actualSet.has(plate))
  );
}

function normalizePlaceAnswer(value: string) {
  return value
    .trim()
    .replace(/[\s·,，、/|｜;；+和及.-]+/gu, "")
    .replace(/臺/g, "台");
}

function stripPlaceSuffix(value: string) {
  return value.replace(
    /(特别行政区|维吾尔自治区|壮族自治区|回族自治区|自治区|自治州|地区|新区|林区|盟|省|市|区|县)$/u,
    "",
  );
}

/**
 * Reverse plate questions accept the province and city in one field. Both full
 * administrative names and their common short forms are valid, with optional
 * separators, for example “浙江宁波” and “浙江省 宁波市”.
 */
export function provinceCityAnswerMatches(
  answer: string,
  item: Pick<CityQuizItem, "province" | "provinceShort" | "city">,
) {
  const candidate = normalizePlaceAnswer(answer);
  if (!candidate) return false;

  const provinceNames = new Set([
    item.province,
    item.provinceShort,
    stripPlaceSuffix(item.province),
    stripPlaceSuffix(item.provinceShort),
  ]);
  const cityNames = new Set([
    item.city,
    stripPlaceSuffix(item.city),
  ]);

  return Array.from(provinceNames).some((province) =>
    Array.from(cityNames).some(
      (city) => candidate === normalizePlaceAnswer(`${province}${city}`),
    ),
  );
}
