export type ConfusableCity = {
  city: string;
  provinceCode: string;
  province: string;
  provinceShort: string;
};

export type ConfusableCityPair = {
  id: string;
  left: ConfusableCity;
  right: ConfusableCity;
  memoryTip: string;
};

export const CONFUSABLE_CITY_PAIRS: ConfusableCityPair[] = [
  {
    id: "suzhou-suzhou",
    left: { city: "苏州市", provinceCode: "320000", province: "江苏省", provinceShort: "江苏" },
    right: { city: "宿州市", provinceCode: "340000", province: "安徽省", provinceShort: "安徽" },
    memoryTip: "苏州在江苏，宿州在安徽；两座城市读音相同，首字不同。",
  },
  {
    id: "taizhou-taizhou",
    left: { city: "泰州市", provinceCode: "320000", province: "江苏省", provinceShort: "江苏" },
    right: { city: "台州市", provinceCode: "330000", province: "浙江省", provinceShort: "浙江" },
    memoryTip: "泰州在江苏，台州在浙江；两地都位于长三角地区。",
  },
  {
    id: "yulin-yulin",
    left: { city: "榆林市", provinceCode: "610000", province: "陕西省", provinceShort: "陕西" },
    right: { city: "玉林市", provinceCode: "450000", province: "广西壮族自治区", provinceShort: "广西" },
    memoryTip: "榆林在陕西北部，玉林在广西东南部。",
  },
  {
    id: "fuzhou-fuzhou",
    left: { city: "抚州市", provinceCode: "360000", province: "江西省", provinceShort: "江西" },
    right: { city: "福州市", provinceCode: "350000", province: "福建省", provinceShort: "福建" },
    memoryTip: "抚州在江西，福州是福建省行政中心。",
  },
  {
    id: "jingzhou-jinzhou",
    left: { city: "荆州市", provinceCode: "420000", province: "湖北省", provinceShort: "湖北" },
    right: { city: "锦州市", provinceCode: "210000", province: "辽宁省", provinceShort: "辽宁" },
    memoryTip: "荆州在湖北，锦州在辽宁；两字读音相近。",
  },
  {
    id: "dezhou-dazhou",
    left: { city: "德州市", provinceCode: "370000", province: "山东省", provinceShort: "山东" },
    right: { city: "达州市", provinceCode: "510000", province: "四川省", provinceShort: "四川" },
    memoryTip: "德州在山东西北部，达州在四川东北部。",
  },
  {
    id: "changzhou-cangzhou",
    left: { city: "常州市", provinceCode: "320000", province: "江苏省", provinceShort: "江苏" },
    right: { city: "沧州市", provinceCode: "130000", province: "河北省", provinceShort: "河北" },
    memoryTip: "常州在江苏，沧州在河北；注意常与沧的字形和声调。",
  },
  {
    id: "huaian-huainan",
    left: { city: "淮安市", provinceCode: "320000", province: "江苏省", provinceShort: "江苏" },
    right: { city: "淮南市", provinceCode: "340000", province: "安徽省", provinceShort: "安徽" },
    memoryTip: "淮安在江苏，淮南在安徽；两地都因淮河得名。",
  },
  {
    id: "zhangjiakou-zhangjiajie",
    left: { city: "张家口市", provinceCode: "130000", province: "河北省", provinceShort: "河北" },
    right: { city: "张家界市", provinceCode: "430000", province: "湖南省", provinceShort: "湖南" },
    memoryTip: "张家口在河北，张家界在湖南；一个以“口”结尾，一个以“界”结尾。",
  },
  {
    id: "yichun-yichang",
    left: { city: "宜春市", provinceCode: "360000", province: "江西省", provinceShort: "江西" },
    right: { city: "宜昌市", provinceCode: "420000", province: "湖北省", provinceShort: "湖北" },
    memoryTip: "宜春在江西，宜昌在湖北；两座城市首字相同。",
  },
  {
    id: "changzhi-changchun",
    left: { city: "长治市", provinceCode: "140000", province: "山西省", provinceShort: "山西" },
    right: { city: "长春市", provinceCode: "220000", province: "吉林省", provinceShort: "吉林" },
    memoryTip: "长治在山西，长春是吉林省行政中心。",
  },
  {
    id: "huangshan-huangshi",
    left: { city: "黄山市", provinceCode: "340000", province: "安徽省", provinceShort: "安徽" },
    right: { city: "黄石市", provinceCode: "420000", province: "湖北省", provinceShort: "湖北" },
    memoryTip: "黄山在安徽，黄石在湖北；末字分别是“山”和“石”。",
  },
];
