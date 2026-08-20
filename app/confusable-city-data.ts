export type ConfusableCity = {
  city: string;
  province: string;
  provinceShort: string;
};

export type ConfusableCityPair = {
  left: ConfusableCity;
  right: ConfusableCity;
  memoryTip: string;
};

export const CONFUSABLE_CITY_PAIRS: ConfusableCityPair[] = [
  {
    left: { city: "苏州市", province: "江苏省", provinceShort: "江苏" },
    right: { city: "宿州市", province: "安徽省", provinceShort: "安徽" },
    memoryTip: "苏州在江苏，宿州在安徽；两座城市读音相同，首字不同。",
  },
  {
    left: { city: "泰州市", province: "江苏省", provinceShort: "江苏" },
    right: { city: "台州市", province: "浙江省", provinceShort: "浙江" },
    memoryTip: "泰州在江苏，台州在浙江；两地都位于长三角地区。",
  },
  {
    left: { city: "榆林市", province: "陕西省", provinceShort: "陕西" },
    right: { city: "玉林市", province: "广西壮族自治区", provinceShort: "广西" },
    memoryTip: "榆林在陕西北部，玉林在广西东南部。",
  },
  {
    left: { city: "抚州市", province: "江西省", provinceShort: "江西" },
    right: { city: "福州市", province: "福建省", provinceShort: "福建" },
    memoryTip: "抚州在江西，福州是福建省行政中心。",
  },
  {
    left: { city: "荆州市", province: "湖北省", provinceShort: "湖北" },
    right: { city: "锦州市", province: "辽宁省", provinceShort: "辽宁" },
    memoryTip: "荆州在湖北，锦州在辽宁；两字读音相近。",
  },
  {
    left: { city: "德州市", province: "山东省", provinceShort: "山东" },
    right: { city: "达州市", province: "四川省", provinceShort: "四川" },
    memoryTip: "德州在山东西北部，达州在四川东北部。",
  },
  {
    left: { city: "常州市", province: "江苏省", provinceShort: "江苏" },
    right: { city: "沧州市", province: "河北省", provinceShort: "河北" },
    memoryTip: "常州在江苏，沧州在河北；注意常与沧的字形和声调。",
  },
  {
    left: { city: "淮安市", province: "江苏省", provinceShort: "江苏" },
    right: { city: "淮南市", province: "安徽省", provinceShort: "安徽" },
    memoryTip: "淮安在江苏，淮南在安徽；两地都因淮河得名。",
  },
  {
    left: { city: "张家口市", province: "河北省", provinceShort: "河北" },
    right: { city: "张家界市", province: "湖南省", provinceShort: "湖南" },
    memoryTip: "张家口在河北，张家界在湖南；一个以“口”结尾，一个以“界”结尾。",
  },
  {
    left: { city: "宜春市", province: "江西省", provinceShort: "江西" },
    right: { city: "宜昌市", province: "湖北省", provinceShort: "湖北" },
    memoryTip: "宜春在江西，宜昌在湖北；两座城市首字相同。",
  },
  {
    left: { city: "长治市", province: "山西省", provinceShort: "山西" },
    right: { city: "长春市", province: "吉林省", provinceShort: "吉林" },
    memoryTip: "长治在山西，长春是吉林省行政中心。",
  },
  {
    left: { city: "黄山市", province: "安徽省", provinceShort: "安徽" },
    right: { city: "黄石市", province: "湖北省", provinceShort: "湖北" },
    memoryTip: "黄山在安徽，黄石在湖北；末字分别是“山”和“石”。",
  },
];
