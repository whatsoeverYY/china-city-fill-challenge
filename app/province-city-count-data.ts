export type ProvinceCityCountItem = {
  code: string;
  name: string;
  shortName: string;
  cityCount: number;
  explanation: string;
};

const mainlandSource = "按《中国统计年鉴2025》‘全部地级及以上城市数（2024年）’口径";

function mainland(
  code: string,
  name: string,
  shortName: string,
  cityCount: number,
  note = "",
): ProvinceCityCountItem {
  return {
    code,
    name,
    shortName,
    cityCount,
    explanation: `${mainlandSource}，${name}有 ${cityCount} 座地级及以上城市${note ? `；${note}` : ""}。`,
  };
}

export const PROVINCE_CITY_COUNT_DATA: ProvinceCityCountItem[] = [
  mainland("110000", "北京市", "北京", 1, "直辖市自身计为1座城市"),
  mainland("120000", "天津市", "天津", 1, "直辖市自身计为1座城市"),
  mainland("130000", "河北省", "河北", 11),
  mainland("140000", "山西省", "山西", 11),
  mainland("150000", "内蒙古自治区", "内蒙古", 9, "另有3个盟，盟不计入本题的城市数"),
  mainland("210000", "辽宁省", "辽宁", 14),
  mainland("220000", "吉林省", "吉林", 8, "另有延边朝鲜族自治州"),
  mainland("230000", "黑龙江省", "黑龙江", 12, "另有大兴安岭地区"),
  mainland("310000", "上海市", "上海", 1, "直辖市自身计为1座城市"),
  mainland("320000", "江苏省", "江苏", 13),
  mainland("330000", "浙江省", "浙江", 11),
  mainland("340000", "安徽省", "安徽", 16),
  mainland("350000", "福建省", "福建", 9),
  mainland("360000", "江西省", "江西", 11),
  mainland("370000", "山东省", "山东", 16),
  mainland("410000", "河南省", "河南", 17, "济源是省直辖县级市，不计入地级及以上城市数"),
  mainland("420000", "湖北省", "湖北", 12, "另有恩施土家族苗族自治州；省直辖县级市不计入本题"),
  mainland("430000", "湖南省", "湖南", 13, "另有湘西土家族苗族自治州"),
  mainland("440000", "广东省", "广东", 21),
  mainland("450000", "广西壮族自治区", "广西", 14),
  mainland("460000", "海南省", "海南", 4, "省直辖县级市不计入地级及以上城市数"),
  mainland("500000", "重庆市", "重庆", 1, "直辖市自身计为1座城市"),
  mainland("510000", "四川省", "四川", 18, "另有阿坝、甘孜、凉山3个自治州"),
  mainland("520000", "贵州省", "贵州", 6, "另有黔西南、黔东南、黔南3个自治州"),
  mainland("530000", "云南省", "云南", 8, "另有8个自治州"),
  mainland("540000", "西藏自治区", "西藏", 6, "另有阿里地区"),
  mainland("610000", "陕西省", "陕西", 10),
  mainland("620000", "甘肃省", "甘肃", 12, "另有临夏、甘南2个自治州"),
  mainland("630000", "青海省", "青海", 2, "另有6个自治州"),
  mainland("640000", "宁夏回族自治区", "宁夏", 5),
  mainland("650000", "新疆维吾尔自治区", "新疆", 4, "另有5个自治州和5个地区；自治区直辖县级市不计入本题"),
  {
    code: "710000",
    name: "台湾省",
    shortName: "台湾",
    cityCount: 9,
    explanation: "按当地现行第一层级地方自治单位口径，台湾地区有6个‘直辖市’和3个市，共9座城市；另有13个县。",
  },
  {
    code: "810000",
    name: "香港特别行政区",
    shortName: "香港",
    cityCount: 0,
    explanation: "香港特别行政区现行划分为18区，不以‘市’作为下辖行政区划单位，因此本题计0座。",
  },
  {
    code: "820000",
    name: "澳门特别行政区",
    shortName: "澳门",
    cityCount: 0,
    explanation: "澳门特别行政区现行不以‘市’作为下辖行政区划单位，因此本题计0座。",
  },
];
