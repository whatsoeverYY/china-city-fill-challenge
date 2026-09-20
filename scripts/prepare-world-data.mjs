import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import process from "node:process";

const root = process.cwd();
const countriesSource = resolve(
  process.argv[2] ?? "/tmp/ne_50m_admin_0_countries.geojson",
);
const capitalsSource = resolve(
  process.argv[3] ?? "/tmp/ne_50m_populated_places.geojson",
);
const m49Source = resolve(process.argv[4] ?? "/tmp/un_m49_overview.html");
const capitalAuditSource = resolve(
  process.argv[5] ?? "/tmp/wikidata_capitals_current.json",
);
const suppliedBoundarySources = process.argv.slice(6).map((path) => resolve(path));
const boundarySources = suppliedBoundarySources.length > 0
  ? suppliedBoundarySources
  : (await readdir("/tmp"))
      .filter((name) => /^un_boundaries_\d{3}_\d{3}\.geojson$/u.test(name))
      .sort()
      .map((name) => resolve("/tmp", name));
const catalogOutput = resolve(
  root,
  "src/domain/geography/data/world-countries.json",
);
const mapOutput = resolve(root, "public/data/maps/world/50m.json");

const countryMapCodes = new Set([
  "USA",
  "GBR",
  "NZL",
  "NLD",
  "FRA",
  "FIN",
  "DNK",
  "CHN",
  "AUS",
]);

const countryNameOverrides = {
  CHN: { name: "中国", aliases: ["中华人民共和国"] },
  GBR: { name: "英国", aliases: ["联合王国", "大不列颠及北爱尔兰联合王国"] },
  KOR: { name: "韩国", aliases: ["大韩民国"] },
  PRK: { name: "朝鲜", aliases: ["朝鲜民主主义人民共和国"] },
  RUS: { name: "俄罗斯", aliases: ["俄罗斯联邦"] },
  USA: { name: "美国", aliases: ["美利坚合众国"] },
};

const capitalOverrides = {
  BDI: [{ name: "基特加", englishName: "Gitega", role: "首都" }],
  BEN: [
    { name: "波多诺伏", englishName: "Porto-Novo", role: "法定首都" },
    { name: "科托努", englishName: "Cotonou", role: "政府所在地" },
  ],
  BOL: [
    { name: "苏克雷", englishName: "Sucre", role: "宪法首都" },
    { name: "拉巴斯", englishName: "La Paz", role: "政府所在地" },
  ],
  BWA: [{ name: "哈博罗内", englishName: "Gaborone", role: "首都" }],
  CIV: [
    { name: "亚穆苏克罗", englishName: "Yamoussoukro", role: "法定首都" },
    { name: "阿比让", englishName: "Abidjan", role: "政府主要驻地" },
  ],
  CPV: [{ name: "普拉亚", englishName: "Praia", role: "首都" }],
  CRI: [{ name: "圣何塞", englishName: "San Jose", role: "首都" }],
  DJI: [{ name: "吉布提", englishName: "Djibouti", role: "首都" }],
  GMB: [{ name: "班珠尔", englishName: "Banjul", role: "首都" }],
  GNQ: [
    {
      name: "和平城",
      englishName: "Ciudad de la Paz",
      role: "2026 年起为首都",
    },
  ],
  GTM: [{ name: "危地马拉城", englishName: "Guatemala City", role: "首都" }],
  IDN: [
    {
      name: "雅加达",
      englishName: "Jakarta",
      role: "现首都；努山塔拉迁都建设中",
    },
  ],
  ISR: [
    {
      name: "耶路撒冷",
      englishName: "Jerusalem",
      role: "首都地位存在国际争议",
    },
  ],
  KAZ: [{ name: "阿斯塔纳", englishName: "Astana", role: "首都" }],
  LKA: [
    {
      name: "斯里贾亚瓦德纳普拉科特",
      englishName: "Sri Jayawardenepura Kotte",
      role: "立法首都",
    },
    { name: "科伦坡", englishName: "Colombo", role: "行政与商业中心" },
  ],
  MYS: [
    { name: "吉隆坡", englishName: "Kuala Lumpur", role: "法定首都" },
    { name: "布城", englishName: "Putrajaya", role: "联邦行政中心" },
  ],
  NLD: [
    { name: "阿姆斯特丹", englishName: "Amsterdam", role: "法定首都" },
    { name: "海牙", englishName: "The Hague", role: "政府所在地" },
  ],
  NIC: [{ name: "马那瓜", englishName: "Managua", role: "首都" }],
  NRU: [
    {
      name: "亚伦",
      englishName: "Yaren District",
      role: "无正式首都；政府机关所在地",
    },
  ],
  PSX: [
    { name: "拉姆安拉", englishName: "Ramallah", role: "行政中心" },
    {
      name: "东耶路撒冷",
      englishName: "East Jerusalem",
      role: "主张的首都",
    },
  ],
  PLW: [{ name: "恩吉鲁穆德", englishName: "Ngerulmud", role: "首都" }],
  RWA: [{ name: "基加利", englishName: "Kigali", role: "首都" }],
  SDS: [{ name: "朱巴", englishName: "Juba", role: "首都" }],
  SWZ: [
    { name: "姆巴巴内", englishName: "Mbabane", role: "行政首都" },
    { name: "洛班巴", englishName: "Lobamba", role: "王室与立法首都" },
  ],
  SYC: [{ name: "维多利亚", englishName: "Victoria", role: "首都" }],
  TZA: [{ name: "多多马", englishName: "Dodoma", role: "首都" }],
  USA: [
    {
      name: "华盛顿",
      englishName: "Washington, D.C.",
      role: "首都",
    },
  ],
  YEM: [
    { name: "萨那", englishName: "Sanaa", role: "法定首都" },
    {
      name: "亚丁",
      englishName: "Aden",
      role: "国际承认政府的临时所在地",
    },
  ],
  ZAF: [
    { name: "比勒陀利亚", englishName: "Pretoria", role: "行政首都" },
    { name: "开普敦", englishName: "Cape Town", role: "立法首都" },
    { name: "布隆方丹", englishName: "Bloemfontein", role: "司法首都" },
  ],
};

const capitalAuditAliases = {
  ATG: ["Saint John's"],
  NRU: ["Yaren District"],
  USA: ["Washington, D.C."],
};

const continentBySource = {
  Africa: ["africa", "非洲"],
  Asia: ["asia", "亚洲"],
  Europe: ["europe", "欧洲"],
  "North America": ["north-america", "北美洲"],
  "South America": ["south-america", "南美洲"],
  Oceania: ["oceania", "大洋洲"],
};

function isStudyCountry(properties) {
  if (
    properties.TYPE === "Sovereign country" &&
    !["TWN", "SOL", "CYN"].includes(properties.ADM0_A3)
  ) {
    return true;
  }
  if (
    properties.TYPE === "Country" &&
    countryMapCodes.has(properties.ADM0_A3)
  ) {
    return true;
  }
  if (
    properties.TYPE === "Sovereignty" &&
    ["KAZ", "CUB"].includes(properties.ADM0_A3)
  ) {
    return true;
  }
  if (properties.TYPE === "Disputed" && properties.ADM0_A3 === "ISR") {
    return true;
  }
  return properties.TYPE === "Indeterminate" && properties.ADM0_A3 === "PSX";
}

function normalizedCode(value, fallback) {
  return typeof value === "string" && !value.startsWith("-")
    ? value
    : fallback;
}

function normalizedM49(properties) {
  return normalizedCode(
    properties.UN_A3,
    normalizedCode(properties.ISO_N3, properties.ISO_N3_EH),
  );
}

function normalizedIsoAlpha3(properties) {
  return normalizedCode(properties.ISO_A3, properties.ISO_A3_EH);
}

function continentFor(properties) {
  if (["SYC", "MUS"].includes(properties.ADM0_A3)) {
    return ["africa", "非洲"];
  }
  if (properties.ADM0_A3 === "MDV") return ["asia", "亚洲"];
  const continent = continentBySource[properties.CONTINENT];
  if (!continent) throw new Error(`无法识别洲别：${properties.NAME}`);
  return continent;
}

function countryCapitalList(properties, capitalsByMapCode) {
  const override = capitalOverrides[properties.ADM0_A3];
  if (override) return override;
  const capitals = capitalsByMapCode.get(properties.ADM0_A3) ?? [];
  if (capitals.length === 0) {
    throw new Error(`${properties.NAME} 缺少首都资料`);
  }
  return capitals.map((capital) => ({
    name: capital.properties.NAME_ZH || capital.properties.NAME,
    englishName: capital.properties.NAME_EN || capital.properties.NAME,
    role: "首都",
  }));
}

function decodeHtmlEntities(value) {
  const namedEntities = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };
  return value
    .replace(/&#x([0-9a-f]+);/giu, (_, code) =>
      String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/gu, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&([a-z]+);/giu, (entity, name) => namedEntities[name] ?? entity);
}

function parseM49Rows(html, languageCode) {
  const tablePattern = new RegExp(
    `<table id\\s*=\\s*"downloadTable${languageCode}"[\\s\\S]*?<tbody>([\\s\\S]*?)<\\/tbody>`,
    "u",
  );
  const table = html.match(tablePattern)?.[1];
  if (!table) throw new Error(`无法解析联合国 M49 ${languageCode} 完整表格`);
  return Array.from(table.matchAll(/<tr>([\s\S]*?)<\/tr>/gu)).map((row) => {
    const cells = Array.from(row[1].matchAll(/<td>([\s\S]*?)<\/td>/gu))
      .map((cell) => decodeHtmlEntities(
        cell[1].replace(/<[^>]+>/gu, "").trim(),
      ));
    return {
      region: cells[3],
      subregion: cells[5],
      intermediateRegion: cells[7],
      name: cells[8],
      m49Code: cells[9],
      isoAlpha3: cells[11],
    };
  }).filter((row) => row.m49Code && row.isoAlpha3);
}

function continentForM49(row) {
  if (row.region === "Americas") {
    return row.intermediateRegion === "South America"
      ? ["south-america", "南美洲"]
      : ["north-america", "北美洲"];
  }
  const continent = continentBySource[row.region];
  if (!continent) throw new Error(`无法识别联合国 M49 洲别：${row.name}`);
  return continent;
}

function normalizeAuditName(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/gu, "")
    .toLowerCase().replace(/[^a-z0-9]/gu, "");
}

const [countrySource, capitalSource, m49Html, capitalAudit, ...boundaryData] = await Promise.all([
  readFile(countriesSource, "utf8").then(JSON.parse),
  readFile(capitalsSource, "utf8").then(JSON.parse),
  readFile(m49Source, "utf8"),
  readFile(capitalAuditSource, "utf8").then(JSON.parse),
  ...boundarySources.map((path) => readFile(path, "utf8").then(JSON.parse)),
]);

if (boundaryData.length === 0) {
  throw new Error("必须提供 2026-09-20 当日下载的联合国国家边界分片");
}

const selectedFeatures = countrySource.features.filter((feature) =>
  isStudyCountry(feature.properties)
);
if (selectedFeatures.length !== 195) {
  throw new Error(`国家学习口径应为 195，当前为 ${selectedFeatures.length}`);
}

const capitalsByMapCode = new Map();
for (const capital of capitalSource.features.filter(
  (feature) => feature.properties.ADM0CAP === 1,
)) {
  const mapCode = capital.properties.ADM0_A3;
  capitalsByMapCode.set(mapCode, [
    ...(capitalsByMapCode.get(mapCode) ?? []),
    capital,
  ]);
}

const countries = selectedFeatures.map((feature) => {
  const properties = feature.properties;
  const [continentId, continentName] = continentFor(properties);
  const override = countryNameOverrides[properties.ADM0_A3];
  const m49Code = normalizedM49(properties);
  const isoAlpha3 = normalizedIsoAlpha3(properties);
  if (!/^\d{3}$/.test(m49Code) || !/^[A-Z]{3}$/.test(isoAlpha3)) {
    throw new Error(`${properties.NAME} 缺少稳定国家代码`);
  }
  return {
    id: `country:${m49Code}`,
    m49Code,
    isoAlpha3,
    mapCode: properties.ADM0_A3,
    name: override?.name ?? properties.NAME_ZH,
    englishName: properties.NAME_EN || properties.NAME,
    aliases: override?.aliases ?? [],
    continentId,
    continentName,
    subregion: properties.SUBREGION,
    capitals: countryCapitalList(properties, capitalsByMapCode),
    label: [properties.LABEL_X, properties.LABEL_Y],
    shapeEligible: properties.TINY === -99,
  };
});

const duplicateIds = countries.filter(
  (country, index) => countries.findIndex((item) => item.id === country.id) !== index,
);
if (duplicateIds.length > 0) {
  throw new Error(`国家 ID 重复：${duplicateIds.map((item) => item.id).join(", ")}`);
}

const m49Rows = parseM49Rows(m49Html, "EN");
const localizedM49Rows = parseM49Rows(m49Html, "ZH");
const m49ByIso = new Map(m49Rows.map((row) => [row.isoAlpha3, row]));
const localizedM49ByIso = new Map(
  localizedM49Rows.map((row) => [row.isoAlpha3, row]),
);
for (const country of countries) {
  const current = m49ByIso.get(country.isoAlpha3);
  const currentLocalized = localizedM49ByIso.get(country.isoAlpha3);
  if (
    !current ||
    current.m49Code !== country.m49Code ||
    !currentLocalized ||
    currentLocalized.m49Code !== country.m49Code
  ) {
    throw new Error(`${country.name} 未通过 2026-09-20 联合国 M49 快照校验`);
  }
  country.aliases = Array.from(new Set([
    ...country.aliases,
    ...(country.englishName === current.name ? [] : [country.englishName]),
    ...(country.name === currentLocalized.name ? [] : [currentLocalized.name]),
  ]));
  const [continentId, continentName] = continentForM49(current);
  country.englishName = current.name;
  country.continentId = continentId;
  country.continentName = continentName;
  country.subregion = current.intermediateRegion || current.subregion;
}

const auditCapitalsByIso = new Map();
for (const binding of capitalAudit.results?.bindings ?? []) {
  const iso = binding.iso3?.value;
  const capital = binding.capitalLabel?.value;
  if (!iso || !capital) continue;
  auditCapitalsByIso.set(iso, [
    ...(auditCapitalsByIso.get(iso) ?? []),
    capital,
  ]);
}
for (const country of countries) {
  const auditNames = [
    ...(auditCapitalsByIso.get(country.isoAlpha3) ?? []),
    ...(capitalAuditAliases[country.isoAlpha3] ?? []),
  ];
  const matched = country.capitals.some((capital) => auditNames.some(
    (auditName) => normalizeAuditName(capital.englishName) ===
      normalizeAuditName(auditName),
  ));
  if (!matched) {
    throw new Error(
      `${country.name} 的首都未通过 2026-09-20 当日关系校验：${auditNames.join("、")}`,
    );
  }
}

const boundaryFeatures = boundaryData.flatMap((collection) => collection.features ?? []);
const boundaryByIso = new Map(
  boundaryFeatures.map((feature) => [feature.properties.iso3cd, feature]),
);
for (const country of countries) {
  if (!boundaryByIso.has(country.isoAlpha3)) {
    throw new Error(`${country.name} 缺少联合国 2026 边界几何`);
  }
}

const playableFeatures = countries.map((country) => ({
  type: "Feature",
  properties: {
    id: country.id,
    name: country.name,
    englishName: country.englishName,
    m49Code: country.m49Code,
    isoAlpha3: country.isoAlpha3,
    continentId: country.continentId,
    label: country.label,
    playable: true,
    shapeEligible: country.shapeEligible,
  },
  geometry: boundaryByIso.get(country.isoAlpha3).geometry,
}));

const studyIsoCodes = new Set(countries.map((country) => country.isoAlpha3));
const backgroundFeatures = boundaryFeatures
  .filter((feature) => !studyIsoCodes.has(feature.properties.iso3cd))
  .map((feature) => ({
    type: "Feature",
    properties: {
      id: `map:${feature.properties.iso3cd}`,
      name: feature.properties.romnam || feature.properties.maplab,
      playable: false,
    },
    geometry: feature.geometry,
  }));

const catalog = {
  schemaVersion: 1,
  countryDataAsOf: "2026-09-20",
  capitalDataAsOf: "2026-09-20",
  countryCount: countries.length,
  definition: "193 个联合国会员国，加巴勒斯坦与梵蒂冈两个观察员国",
  sourceVersions: {
    countryRegister: "United Nations Statistics Division M49 live register (codes, current English and Chinese names, and regions)",
    countryBoundaries: "UN Compliant Boundaries feature service (modified 2026-06-19)",
    capitalPlaces: "Natural Earth Populated Places 5.1.2, fully audited 2026-09-20",
    capitalAudit: "Wikidata current capital statements plus official change notices",
  },
  audit: {
    checkedAt: "2026-09-20",
    m49CountryCodesMatched: countries.length,
    currentCountryNamesMatched: countries.length,
    currentLocalizedCountryNamesMatched: countries.length,
    capitalRecordsMatched: countries.length,
  },
  sources: [
    "https://unstats.un.org/unsd/methodology/m49/",
    "https://data-gis.unep-wcmc.org/server/rest/services/Hosted/UN_Boundaries/FeatureServer/6",
    "https://www.naturalearthdata.com/",
    "https://query.wikidata.org/",
    "https://www.guineaecuatorialpress.com/noticias/el_presidente_de_la_republica_proclama_la_ciudad_de_la_paz_como_capital_de_la_republica_de_guinea_ecuatorial_con_la_firma_de_un_decreto_ley",
  ],
  countries,
};
const map = {
  type: "FeatureCollection",
  mapDataAsOf: "2026-09-20",
  sourceVersion: "UN Compliant Boundaries (modified 2026-06-19)",
  sourceRetrievedAt: "2026-09-20",
  sourceItemId: "add1f3d789fd44aa86fc09502e9e065d",
  sourceUrl: "https://data-gis.unep-wcmc.org/server/rest/services/Hosted/UN_Boundaries/FeatureServer/6",
  audit: {
    studyCountryGeometryCount: countries.length,
    sourceFeatureCount: boundaryFeatures.length,
  },
  features: [...backgroundFeatures, ...playableFeatures],
};

await Promise.all([
  mkdir(dirname(catalogOutput), { recursive: true }),
  mkdir(dirname(mapOutput), { recursive: true }),
]);
await Promise.all([
  writeFile(catalogOutput, `${JSON.stringify(catalog)}\n`),
  writeFile(mapOutput, `${JSON.stringify(map)}\n`),
]);

console.log(`生成 ${countries.length} 个国家资料：${catalogOutput}`);
console.log(`生成 ${map.features.length} 个地图区块：${mapOutput}`);
