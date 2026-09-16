import { PROVINCE_BY_CODE } from "./provinces.ts";

export type UniversityQuizItem = {
  id: string;
  name: string;
  tier: "985" | "211";
  provinceCode: string;
  province: string;
  provinceShort: string;
  city: string;
  answers: string[];
  note?: string;
};

type UniversityGroup = [
  provinceCode: string,
  universities: Array<[
    id: string,
    city: string,
    name: string,
    tier: "985" | "211",
    alternativeAnswers?: string[],
    note?: string,
  ]>,
];

// 以教育部公布的原“211工程”学校名单为范围；中国矿业大学、
// 中国石油大学和中国地质大学按目前独立办学的两所学校分别出题。
const UNIVERSITY_GROUPS: UniversityGroup[] = [
  ["110000", [
    ["university-001", "北京市", "北京大学", "985"],
    ["university-002", "北京市", "中国人民大学", "985"],
    ["university-003", "北京市", "清华大学", "985"],
    ["university-004", "北京市", "北京交通大学", "211"],
    ["university-005", "北京市", "北京工业大学", "211"],
    ["university-006", "北京市", "北京航空航天大学", "985"],
    ["university-007", "北京市", "北京理工大学", "985"],
    ["university-008", "北京市", "北京科技大学", "211"],
    ["university-009", "北京市", "北京化工大学", "211"],
    ["university-010", "北京市", "北京邮电大学", "211"],
    ["university-011", "北京市", "中国农业大学", "985"],
    ["university-012", "北京市", "北京林业大学", "211"],
    ["university-013", "北京市", "北京中医药大学", "211"],
    ["university-014", "北京市", "北京师范大学", "985"],
    ["university-015", "北京市", "北京外国语大学", "211"],
    ["university-016", "北京市", "中国传媒大学", "211"],
    ["university-017", "北京市", "中央财经大学", "211"],
    ["university-018", "北京市", "对外经济贸易大学", "211"],
    ["university-019", "北京市", "北京体育大学", "211"],
    ["university-020", "北京市", "中央音乐学院", "211"],
    ["university-021", "北京市", "中央民族大学", "985"],
    ["university-022", "北京市", "中国政法大学", "211"],
    ["university-023", "北京市", "华北电力大学", "211", ["保定市"], "学校在北京、保定两地办学，本题两地均判为正确"],
    ["university-024", "北京市", "中国矿业大学（北京）", "211"],
    ["university-025", "北京市", "中国石油大学（北京）", "211"],
    ["university-026", "北京市", "中国地质大学（北京）", "211"],
  ]],
  ["120000", [
    ["university-027", "天津市", "南开大学", "985"],
    ["university-028", "天津市", "天津大学", "985"],
    ["university-029", "天津市", "天津医科大学", "211"],
    ["university-030", "天津市", "河北工业大学", "211"],
  ]],
  ["140000", [
    ["university-031", "太原市", "太原理工大学", "211"],
  ]],
  ["150000", [
    ["university-032", "呼和浩特市", "内蒙古大学", "211"],
  ]],
  ["210000", [
    ["university-033", "沈阳市", "辽宁大学", "211"],
    ["university-034", "大连市", "大连理工大学", "985"],
    ["university-035", "沈阳市", "东北大学", "985"],
    ["university-036", "大连市", "大连海事大学", "211"],
  ]],
  ["220000", [
    ["university-037", "长春市", "吉林大学", "985"],
    ["university-038", "延吉市", "延边大学", "211"],
    ["university-039", "长春市", "东北师范大学", "211"],
  ]],
  ["230000", [
    ["university-040", "哈尔滨市", "哈尔滨工业大学", "985"],
    ["university-041", "哈尔滨市", "哈尔滨工程大学", "211"],
    ["university-042", "哈尔滨市", "东北农业大学", "211"],
    ["university-043", "哈尔滨市", "东北林业大学", "211"],
  ]],
  ["310000", [
    ["university-044", "上海市", "复旦大学", "985"],
    ["university-045", "上海市", "同济大学", "985"],
    ["university-046", "上海市", "上海交通大学", "985"],
    ["university-047", "上海市", "华东理工大学", "211"],
    ["university-048", "上海市", "东华大学", "211"],
    ["university-049", "上海市", "华东师范大学", "985"],
    ["university-050", "上海市", "上海外国语大学", "211"],
    ["university-051", "上海市", "上海财经大学", "211"],
    ["university-052", "上海市", "上海大学", "211"],
    ["university-053", "上海市", "海军军医大学（原第二军医大学）", "211"],
  ]],
  ["320000", [
    ["university-054", "南京市", "南京大学", "985"],
    ["university-055", "苏州市", "苏州大学", "211"],
    ["university-056", "南京市", "东南大学", "985"],
    ["university-057", "南京市", "南京航空航天大学", "211"],
    ["university-058", "南京市", "南京理工大学", "211"],
    ["university-059", "徐州市", "中国矿业大学", "211"],
    ["university-060", "南京市", "河海大学", "211"],
    ["university-061", "无锡市", "江南大学", "211"],
    ["university-062", "南京市", "南京农业大学", "211"],
    ["university-063", "南京市", "中国药科大学", "211"],
    ["university-064", "南京市", "南京师范大学", "211"],
  ]],
  ["330000", [
    ["university-065", "杭州市", "浙江大学", "985"],
  ]],
  ["340000", [
    ["university-066", "合肥市", "安徽大学", "211"],
    ["university-067", "合肥市", "中国科学技术大学", "985"],
    ["university-068", "合肥市", "合肥工业大学", "211"],
  ]],
  ["350000", [
    ["university-069", "厦门市", "厦门大学", "985"],
    ["university-070", "福州市", "福州大学", "211"],
  ]],
  ["360000", [
    ["university-071", "南昌市", "南昌大学", "211"],
  ]],
  ["370000", [
    ["university-072", "济南市", "山东大学", "985"],
    ["university-073", "青岛市", "中国海洋大学", "985"],
    ["university-074", "青岛市", "中国石油大学（华东）", "211"],
  ]],
  ["410000", [
    ["university-075", "郑州市", "郑州大学", "211"],
  ]],
  ["420000", [
    ["university-076", "武汉市", "武汉大学", "985"],
    ["university-077", "武汉市", "华中科技大学", "985"],
    ["university-078", "武汉市", "中国地质大学（武汉）", "211"],
    ["university-079", "武汉市", "武汉理工大学", "211"],
    ["university-080", "武汉市", "华中农业大学", "211"],
    ["university-081", "武汉市", "华中师范大学", "211"],
    ["university-082", "武汉市", "中南财经政法大学", "211"],
  ]],
  ["430000", [
    ["university-083", "长沙市", "湖南大学", "985"],
    ["university-084", "长沙市", "中南大学", "985"],
    ["university-085", "长沙市", "湖南师范大学", "211"],
    ["university-086", "长沙市", "国防科技大学", "985"],
  ]],
  ["440000", [
    ["university-087", "广州市", "中山大学", "985"],
    ["university-088", "广州市", "暨南大学", "211"],
    ["university-089", "广州市", "华南理工大学", "985"],
    ["university-090", "广州市", "华南师范大学", "211"],
  ]],
  ["450000", [
    ["university-091", "南宁市", "广西大学", "211"],
  ]],
  ["460000", [
    ["university-092", "海口市", "海南大学", "211"],
  ]],
  ["500000", [
    ["university-093", "重庆市", "重庆大学", "985"],
    ["university-094", "重庆市", "西南大学", "211"],
  ]],
  ["510000", [
    ["university-095", "成都市", "四川大学", "985"],
    ["university-096", "成都市", "西南交通大学", "211"],
    ["university-097", "成都市", "电子科技大学", "985"],
    ["university-098", "雅安市", "四川农业大学", "211", ["成都市"], "学校在雅安、成都两地设有主要校区，本题两地均判为正确"],
    ["university-099", "成都市", "西南财经大学", "211"],
  ]],
  ["520000", [
    ["university-100", "贵阳市", "贵州大学", "211"],
  ]],
  ["530000", [
    ["university-101", "昆明市", "云南大学", "211"],
  ]],
  ["540000", [
    ["university-102", "拉萨市", "西藏大学", "211"],
  ]],
  ["610000", [
    ["university-103", "西安市", "西北大学", "211"],
    ["university-104", "西安市", "西安交通大学", "985"],
    ["university-105", "西安市", "西北工业大学", "985"],
    ["university-106", "西安市", "西安电子科技大学", "211"],
    ["university-107", "西安市", "长安大学", "211"],
    ["university-108", "咸阳市", "西北农林科技大学", "985", ["杨凌", "杨凌区"], "学校位于咸阳市杨凌示范区"],
    ["university-109", "西安市", "陕西师范大学", "211"],
    ["university-110", "西安市", "空军军医大学（原第四军医大学）", "211"],
  ]],
  ["620000", [
    ["university-111", "兰州市", "兰州大学", "985"],
  ]],
  ["630000", [
    ["university-112", "西宁市", "青海大学", "211"],
  ]],
  ["640000", [
    ["university-113", "银川市", "宁夏大学", "211"],
  ]],
  ["650000", [
    ["university-114", "乌鲁木齐市", "新疆大学", "211"],
    ["university-115", "石河子市", "石河子大学", "211"],
  ]],
];

export const UNIVERSITY_QUIZ_DATA: UniversityQuizItem[] = UNIVERSITY_GROUPS.flatMap(
  ([provinceCode, universities]) => {
    const province = PROVINCE_BY_CODE.get(provinceCode);
    if (!province) return [];
    return universities.map(([id, city, name, tier, alternativeAnswers = [], note]) => ({
      id,
      name,
      tier,
      provinceCode,
      province: province.name,
      provinceShort: province.shortName,
      city,
      answers: [city, ...alternativeAnswers],
      note,
    }));
  },
);
