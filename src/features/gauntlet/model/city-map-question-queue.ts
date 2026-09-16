import {
  CITY_MAP_MINIMUM_QUEUE_LENGTH,
} from "../../../domain/game/gauntlet-rules.ts";

export type NamedRegionQuizItem = {
  id: string;
  provinceCode: string;
};

type ShuffleItems = <T>(items: T[]) => T[];

export function cityQuizKey(item: NamedRegionQuizItem) {
  return item.id;
}

function spreadCityQuestions<T extends NamedRegionQuizItem>(
  questions: T[],
  previousProvinceCode: string | null,
  shuffleItems: ShuffleItems,
) {
  const remaining = shuffleItems(questions);
  const result: T[] = [];
  let lastProvinceCode = previousProvinceCode;

  while (remaining.length) {
    const differentProvinceIndex = remaining.findIndex(
      (item) => item.provinceCode !== lastProvinceCode,
    );
    const nextIndex = differentProvinceIndex >= 0 ? differentProvinceIndex : 0;
    const [next] = remaining.splice(nextIndex, 1);
    result.push(next);
    lastProvinceCode = next.provinceCode;
  }

  return result;
}

function spreadRecentQuestions<T extends NamedRegionQuizItem>(
  questions: T[],
  previousProvinceCode: string | null,
  shuffleItems: ShuffleItems,
) {
  const middleIndex = Math.ceil(questions.length / 2);
  const olderQuestions = spreadCityQuestions(
    questions.slice(0, middleIndex),
    previousProvinceCode,
    shuffleItems,
  );
  const newerQuestions = spreadCityQuestions(
    questions.slice(middleIndex),
    olderQuestions.at(-1)?.provinceCode ?? previousProvinceCode,
    shuffleItems,
  );
  return [...olderQuestions, ...newerQuestions];
}

export function createCityMapQuestionQueue<T extends NamedRegionQuizItem>(
  questions: T[],
  recentQuestionKeys: string[],
  shuffleItems: ShuffleItems,
) {
  const uniqueQuestions = Array.from(
    new Map(questions.map((item) => [cityQuizKey(item), item])).values(),
  );
  if (!uniqueQuestions.length) return [];

  const questionByKey = new Map(
    uniqueQuestions.map((item) => [cityQuizKey(item), item]),
  );
  const normalizedRecentKeys = recentQuestionKeys.filter(
    (key, index) =>
      questionByKey.has(key) && recentQuestionKeys.lastIndexOf(key) === index,
  );
  const recentKeySet = new Set(normalizedRecentKeys);
  const unseenQuestions = spreadCityQuestions(
    uniqueQuestions.filter((item) => !recentKeySet.has(cityQuizKey(item))),
    null,
    shuffleItems,
  );
  const recentQuestions = normalizedRecentKeys
    .map((key) => questionByKey.get(key))
    .filter((item): item is T => Boolean(item));
  const queue = [
    ...unseenQuestions,
    ...spreadRecentQuestions(
      recentQuestions,
      unseenQuestions.at(-1)?.provinceCode ?? null,
      shuffleItems,
    ),
  ];
  const targetLength = Math.max(
    uniqueQuestions.length,
    CITY_MAP_MINIMUM_QUEUE_LENGTH,
  );

  while (queue.length < targetLength) {
    const nextCycle = spreadCityQuestions(
      uniqueQuestions,
      queue.at(-1)?.provinceCode ?? null,
      shuffleItems,
    );
    if (
      nextCycle.length > 1 &&
      cityQuizKey(queue.at(-1)!) === cityQuizKey(nextCycle[0])
    ) {
      const replacementIndex = nextCycle.findIndex(
        (item) => cityQuizKey(item) !== cityQuizKey(nextCycle[0]),
      );
      if (replacementIndex > 0) {
        [nextCycle[0], nextCycle[replacementIndex]] = [
          nextCycle[replacementIndex],
          nextCycle[0],
        ];
      }
    }
    queue.push(...nextCycle);
  }

  return queue.slice(0, targetLength);
}
