import type { CityQuizItem } from "../data/city-plate-types.ts";

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
  return value.trim().toUpperCase().split(/[\s,，、/|｜;；+和及]+/u)
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
  return expectedSet.size === actualSet.size &&
    Array.from(expectedSet).every((plate) => actualSet.has(plate));
}

function normalizePlaceAnswer(value: string) {
  return value.trim().replace(/[\s·,，、/|｜;；+和及.-]+/gu, "").replace(/臺/g, "台");
}

function stripPlaceSuffix(value: string) {
  return value.replace(
    /(特别行政区|维吾尔自治区|壮族自治区|回族自治区|自治区|自治州|地区|新区|林区|盟|省|市|区|县)$/u,
    "",
  );
}

export function provinceCityAnswerMatches(
  answer: string,
  item: Pick<CityQuizItem, "province" | "provinceShort" | "city">,
) {
  const candidate = normalizePlaceAnswer(answer);
  if (!candidate) return false;
  const provinceNames = new Set([
    item.province, item.provinceShort, stripPlaceSuffix(item.province),
    stripPlaceSuffix(item.provinceShort),
  ]);
  const cityNames = new Set([item.city, stripPlaceSuffix(item.city)]);
  return Array.from(provinceNames).some((province) =>
    Array.from(cityNames).some(
      (city) => candidate === normalizePlaceAnswer(`${province}${city}`),
    ),
  );
}
