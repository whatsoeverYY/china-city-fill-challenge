import {
  CONFUSABLE_CITY_PAIRS,
  type ConfusableCityPair,
} from "@/domain/geography/data/confusable-cities";
import {
  PROVINCE_BY_CODE,
  PROVINCE_CAPITALS,
  PROVINCE_NEIGHBORS,
  PROVINCES,
  type Province,
} from "@/domain/geography/data/provinces";
import {
  ALL_GAUNTLET_PROVINCE_CODES,
  FINAL_BOSS_QUESTION_COUNT,
} from "@/features/gauntlet/config/gauntlet-config";
import {
  CITY_QUIZ_DATA,
  PLATE_QUIZ_DATA,
  type CityQuizItem,
} from "@/domain/geography/data/city-plates";
import { plateCollectionsOverlap } from "@/domain/geography/lib/city-plate-answer";
import {
  type BossQuestion,
  ConfusableCityQuestion,
  DualIntruderQuestion,
  PlateFaultQuestion,
  TruthQuestion,
  UndercoverQuestion,
} from "@/features/gauntlet/model/gauntlet-types";
import { BOSS_SKILL_ID } from "@/features/gauntlet/model/boss-stats";
import { normalizePlaceName } from "@/shared/lib/place-name";
import { randomShuffle } from "@/shared/lib/random";

const FALLBACK_PROVINCE_CODE = "110000";

export function createConfusableCityQuestions() {
  const cityOptions = (pair: ConfusableCityPair) => [
    { id: `${pair.id}:left-city`, label: pair.left.city },
    { id: `${pair.id}:right-city`, label: pair.right.city },
  ];
  const provinceOptions = (pair: ConfusableCityPair) => [
    { id: pair.left.provinceCode, label: pair.left.provinceShort },
    { id: pair.right.provinceCode, label: pair.right.provinceShort },
  ];
  return randomShuffle(
    CONFUSABLE_CITY_PAIRS.flatMap(
      (pair: ConfusableCityPair): ConfusableCityQuestion[] => [
        {
          id: `${pair.id}-left-city`,
          pair: [pair.left.city, pair.right.city],
          prompt: pair.left.province,
          instruction: "这对易混城市中，哪座属于这个省份？",
          options: randomShuffle(cityOptions(pair)),
          answerId: `${pair.id}:left-city`,
          explanation: pair.memoryTip,
        },
        {
          id: `${pair.id}-right-city`,
          pair: [pair.left.city, pair.right.city],
          prompt: pair.right.province,
          instruction: "这对易混城市中，哪座属于这个省份？",
          options: randomShuffle(cityOptions(pair)),
          answerId: `${pair.id}:right-city`,
          explanation: pair.memoryTip,
        },
        {
          id: `${pair.id}-left-province`,
          pair: [pair.left.city, pair.right.city],
          prompt: pair.left.city,
          instruction: "这座城市属于哪个省级行政区？",
          options: randomShuffle(provinceOptions(pair)),
          answerId: pair.left.provinceCode,
          explanation: pair.memoryTip,
        },
        {
          id: `${pair.id}-right-province`,
          pair: [pair.left.city, pair.right.city],
          prompt: pair.right.city,
          instruction: "这座城市属于哪个省级行政区？",
          options: randomShuffle(provinceOptions(pair)),
          answerId: pair.right.provinceCode,
          explanation: pair.memoryTip,
        },
      ],
    ),
  );
}

export function normalizePlate(value: string) {
  return normalizePlaceName(value).replace(/[·.-]/g, "").toUpperCase();
}

function cityGroups(pool: CityQuizItem[]) {
  return Array.from(
    pool.reduce((groups, item) => {
      const current = groups.get(item.provinceCode) ?? [];
      current.push(item);
      groups.set(item.provinceCode, current);
      return groups;
    }, new Map<string, CityQuizItem[]>()).entries(),
  );
}

function cityGroupsWithMinimum(pool: CityQuizItem[], minimum: number) {
  const selectedGroups = cityGroups(pool).filter(
    ([, items]) => items.length >= minimum,
  );
  return selectedGroups.length
    ? selectedGroups
    : cityGroups(CITY_QUIZ_DATA).filter(([, items]) => items.length >= minimum);
}

export function hasCityGroupWithMinimum(
  pool: CityQuizItem[],
  minimum: number,
) {
  return cityGroups(pool).some(([, items]) => items.length >= minimum);
}

export function createUndercoverQuestions(pool: CityQuizItem[]) {
  const groups = cityGroupsWithMinimum(pool, 3);
  return Array.from({ length: 80 }, (_, index): UndercoverQuestion => {
    const [provinceCode, items] = groups[index % groups.length];
    const homeCities = randomShuffle(items).slice(0, 3);
    const outsider = randomShuffle(CITY_QUIZ_DATA).find(
      (item) => item.provinceCode !== provinceCode,
    )!;
    return {
      id: `undercover:${[...homeCities, outsider].map((item) => item.id).sort().join(":")}`,
      province: items[0].provinceShort,
      options: randomShuffle([...homeCities, outsider]),
      answerId: outsider.id,
      explanation: `${outsider.city}属于${outsider.province}，其余城市属于${homeCities[0].province}`,
    };
  });
}

export function createDualIntruderQuestions(pool: CityQuizItem[]) {
  const groups = cityGroupsWithMinimum(pool, 3);
  const questions: DualIntruderQuestion[] = [];
  for (let index = 0; index < 80; index += 1) {
    const [provinceCode, items] = groups[index % groups.length];
    const province = PROVINCE_BY_CODE.get(provinceCode);
    if (index % 4 === 0) {
      const homeCities = randomShuffle(items).slice(0, 3);
      const outsider = randomShuffle(CITY_QUIZ_DATA).find(
        (item) => item.provinceCode !== provinceCode,
      )!;
      questions.push({
        id: `city-intruder:${[...homeCities, outsider].map((item) => item.id).sort().join(":")}`,
        prompt: province?.shortName ?? homeCities[0].provinceShort,
        instruction: "找出不属于这个省份的城市",
        options: randomShuffle([...homeCities, outsider].map((item) => ({
          id: item.id,
          label: item.city,
        }))),
        answerId: outsider.id,
        explanation: `${outsider.city}属于${outsider.province}`,
      });
    } else if (index % 4 === 1) {
      const city = randomShuffle(items)[0];
      const otherProvinces = randomShuffle(
        PROVINCES.filter(
          (item) =>
            ALL_GAUNTLET_PROVINCE_CODES.has(item.code) &&
            item.code !== city.provinceCode,
        ),
      ).slice(0, 3);
      questions.push({
        id: `province-choice:${city.id}`,
        prompt: city.city,
        instruction: "找出它真正所属的省份",
        options: randomShuffle([
          { id: city.provinceCode, label: city.provinceShort },
          ...otherProvinces.map((item) => ({ id: item.code, label: item.shortName })),
        ]),
        answerId: city.provinceCode,
        explanation: `${city.city}属于${city.province}`,
      });
    } else if (index % 4 === 2 && province) {
      const capital = PROVINCE_CAPITALS[province.code];
      const otherProvinces = randomShuffle(
        PROVINCES.filter((item) => item.code !== province.code),
      ).slice(0, 3);
      questions.push({
        id: `capital-choice:${province.code}`,
        prompt: province.name,
        instruction: "找出它正确的行政中心",
        options: randomShuffle([
          { id: province.code, label: capital },
          ...otherProvinces.map((item) => ({
            id: item.code,
            label: PROVINCE_CAPITALS[item.code],
          })),
        ]),
        answerId: province.code,
        explanation: `${province.name}的行政中心是${capital}`,
      });
    } else {
      const pairProvinces = province
        ? [
            province,
            ...randomShuffle(
              PROVINCES.filter((item) => item.code !== province.code),
            ).slice(0, 3),
          ]
        : randomShuffle(PROVINCES).slice(0, 4);
      const wrongIndex = index % pairProvinces.length;
      const replacementProvince = PROVINCES.find(
        (item) =>
          item.code !== pairProvinces[wrongIndex].code &&
          !pairProvinces.some(
            (candidate) =>
              PROVINCE_CAPITALS[candidate.code] === PROVINCE_CAPITALS[item.code],
          ),
      );
      const wrongCapital = replacementProvince
        ? PROVINCE_CAPITALS[replacementProvince.code]
        : PROVINCE_CAPITALS[FALLBACK_PROVINCE_CODE];
      const options = pairProvinces.map((item, optionIndex) => ({
        id: item.code,
        label: `${item.shortName} · ${optionIndex === wrongIndex ? wrongCapital : PROVINCE_CAPITALS[item.code]}`,
      }));
      questions.push({
        id: `capital-pair:${pairProvinces.map((item) => item.code).sort().join(":")}:${replacementProvince?.code ?? FALLBACK_PROVINCE_CODE}`,
        prompt: "省级行政区 · 行政中心",
        instruction: "找出对应错误的一组",
        options: randomShuffle(options),
        answerId: pairProvinces[wrongIndex].code,
        explanation: `${pairProvinces[wrongIndex].name}的行政中心是${PROVINCE_CAPITALS[pairProvinces[wrongIndex].code]}`,
      });
    }
  }
  return questions;
}

export function createPlateFaultQuestions(pool: CityQuizItem[]) {
  const source = pool.length >= 4 ? pool : PLATE_QUIZ_DATA;
  return Array.from({ length: 80 }, (_, index): PlateFaultQuestion => {
    const items = randomShuffle(source).slice(0, 4);
    const wrongIndex = index % items.length;
    const wrongPlateItem = randomShuffle(PLATE_QUIZ_DATA).find(
      (item) => !plateCollectionsOverlap(item.plates, items[wrongIndex].plates),
    )!;
    const wrongPlate = wrongPlateItem.plate;
    const options = items.map((item, optionIndex) => ({
      id: item.id,
      label: `${item.city} · ${optionIndex === wrongIndex ? wrongPlate : item.plate}`,
    }));
    return {
      id: `plate-fault:${items.map((item) => item.id).sort().join(":")}:${items[wrongIndex].id}:${wrongPlateItem.id}`,
      options: randomShuffle(options),
      answerId: items[wrongIndex].id,
      explanation: `${items[wrongIndex].city}正确的车牌前缀是 ${items[wrongIndex].plate}`,
    };
  });
}

export function createBossQuestions() {
  const cities = randomShuffle(CITY_QUIZ_DATA).slice(0, FINAL_BOSS_QUESTION_COUNT);
  const provinces = randomShuffle(PROVINCES);
  const connectedProvinces = randomShuffle(
    PROVINCES.filter(
      (province) => (PROVINCE_NEIGHBORS[province.code]?.length ?? 0) > 0,
    ),
  );
  const questions = Array.from(
    { length: FINAL_BOSS_QUESTION_COUNT },
    (_, index): BossQuestion => {
    const city = cities[index];
    const province = provinces[index % provinces.length];
    if (index % 6 === 0) {
      return {
        id: `boss-city-province:${city.id}`,
        skill: BOSS_SKILL_ID.CITY_PROVINCE,
        kind: "text",
        badge: "城",
        prompt: "写出这座城市所属的省份",
        value: city.city,
        targets: [city.province, city.provinceShort],
        explanation: `${city.city}属于${city.province}`,
      };
    }
    if (index % 6 === 1) {
      return {
        id: `boss-plate:${city.id}`,
        skill: BOSS_SKILL_ID.PLATE,
        kind: "text",
        badge: "牌",
        prompt: "写出这座城市的车牌前缀",
        value: city.city,
        targets: city.plates,
        explanation: `${city.city}的车牌前缀是 ${city.plate}`,
        matchAllTargets: true,
      };
    }
    if (index % 6 === 2) {
      const origin = connectedProvinces[index % connectedProvinces.length];
      const neighborNames = (PROVINCE_NEIGHBORS[origin.code] ?? [])
        .map((code) => PROVINCE_BY_CODE.get(code))
        .filter((item): item is Province => Boolean(item));
      return {
        id: `boss-neighbor:${origin.code}`,
        skill: BOSS_SKILL_ID.PROVINCE_NEIGHBORS,
        kind: "text",
        badge: "邻",
        prompt: "写出这个省级行政区的任意一个陆地邻省",
        value: origin.name,
        targets: neighborNames.map((item) => item.name),
        explanation: `${origin.shortName}的陆地邻省包括：${neighborNames.map((item) => item.shortName).join("、")}`,
      };
    }
    if (index % 6 === 3) {
      const isTrue = index % 4 === 3;
      const alternative = randomShuffle(CITY_QUIZ_DATA).find(
        (item) => item.provinceCode !== city.provinceCode,
      )!;
      return {
        id: `boss-truth:${city.id}:${alternative.id}`,
        skill: BOSS_SKILL_ID.TRUTH,
        kind: "truth",
        badge: "判",
        prompt: "判断城市与省份的对应关系",
        value: `${city.city}属于${isTrue ? city.province : alternative.province}`,
        isTrue,
        explanation: `${city.city}属于${city.province}`,
      };
    }
    if (index % 6 === 4) {
      return {
        id: `boss-map:${city.id}`,
        skill: BOSS_SKILL_ID.MAP,
        kind: "map",
        badge: "点",
        prompt: "在地图上点击这座城市所属的省份",
        value: city.city,
        provinceCode: city.provinceCode,
        explanation: `${city.city}属于${city.province}`,
      };
    }
    return {
      id: `boss-shape:${province.code}`,
      skill: BOSS_SKILL_ID.SHAPE,
      kind: "shape",
      badge: "形",
      prompt: "写出这个旋转轮廓的省份名称",
      provinceCode: province.code,
      targets: [province.name, province.shortName],
      explanation: `这个轮廓是${province.name}`,
    };
    },
  );
  return randomShuffle(questions);
}

export function createTruthQuestions(pool: CityQuizItem[]) {
  if (!pool.length) return [];
  const fallbackPool = PLATE_QUIZ_DATA;
  return Array.from({ length: Math.max(80, pool.length) }, (_, index): TruthQuestion => {
    const item = pool[index % pool.length];
    const provinceQuestion = index % 2 === 0;
    const isTrue = index % 3 !== 1;
    if (provinceQuestion) {
      const alternative = randomShuffle(fallbackPool).find(
        (candidate) => candidate.provinceCode !== item.provinceCode,
      );
      const shownProvince = isTrue
        ? item.province
        : alternative?.province ?? PROVINCES[0].name;
      return {
        id: `truth-province:${item.id}:${isTrue ? item.provinceCode : alternative?.provinceCode ?? PROVINCES[0].code}`,
        statement: `${item.city}属于${shownProvince}`,
        isTrue,
        explanation: `${item.city}属于${item.province}`,
      };
    }

    const alternative = randomShuffle(fallbackPool).find(
      (candidate) => !plateCollectionsOverlap(candidate.plates, item.plates),
    );
    const shownPlate = isTrue ? item.plate : alternative?.plate ?? item.plate;
    return {
      id: `truth-plate:${item.id}:${isTrue ? item.id : alternative?.id ?? item.id}`,
      statement: `${item.city}的车牌前缀是 ${shownPlate}`,
      isTrue,
      explanation: `${item.city}的车牌前缀是 ${item.plate}`,
    };
  });
}
