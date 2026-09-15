import assert from "node:assert/strict";
import test from "node:test";

import {
  CITY_MAP_MINIMUM_QUEUE_LENGTH,
  cityQuizKey,
  createCityMapQuestionQueue,
} from "../app/city-map-question-queue.ts";

const identityShuffle = (items) => [...items];
const reverseShuffle = (items) => [...items].reverse();
const question = (city, provinceShort = "甲省") => ({ city, provinceShort });

test("unseen map questions are always placed before recent questions", () => {
  const questions = [question("甲市"), question("乙市"), question("丙市"), question("丁市")];
  const queue = createCityMapQuestionQueue(
    questions,
    [cityQuizKey(questions[1]), cityQuizKey(questions[2])],
    identityShuffle,
  );

  assert.deepEqual(queue.slice(0, 2).map(cityQuizKey), [
    cityQuizKey(questions[0]),
    cityQuizKey(questions[3]),
  ]);
});

test("recent questions retain age priority without replaying a fixed order", () => {
  const questions = [question("甲市"), question("乙市"), question("丙市"), question("丁市")];
  const history = questions.map(cityQuizKey);
  const queue = createCityMapQuestionQueue(questions, history, reverseShuffle);

  assert.deepEqual(new Set(queue.slice(0, 2).map(cityQuizKey)), new Set(history.slice(0, 2)));
  assert.deepEqual(new Set(queue.slice(2, 4).map(cityQuizKey)), new Set(history.slice(2, 4)));
  assert.notDeepEqual(queue.slice(0, 4).map(cityQuizKey), history);
});

test("small pools exhaust every unique question before starting another cycle", () => {
  const questions = [question("甲市"), question("乙市"), question("丙市")];
  const queue = createCityMapQuestionQueue(questions, [], reverseShuffle);

  assert.equal(queue.length, CITY_MAP_MINIMUM_QUEUE_LENGTH);
  for (let index = 0; index < queue.length; index += questions.length) {
    assert.equal(
      new Set(queue.slice(index, index + questions.length).map(cityQuizKey)).size,
      questions.length,
    );
  }
  for (let index = 1; index < queue.length; index += 1) {
    assert.notEqual(cityQuizKey(queue[index]), cityQuizKey(queue[index - 1]));
  }
});

test("duplicate inputs and stale history keys do not enter the queue", () => {
  const first = question("甲市");
  const second = question("乙市");
  const queue = createCityMapQuestionQueue(
    [first, first, second],
    ["已删除省:旧题", cityQuizKey(first), cityQuizKey(first)],
    identityShuffle,
  );

  assert.equal(new Set(queue.map(cityQuizKey)).size, 2);
  assert.equal(cityQuizKey(queue[0]), cityQuizKey(second));
});
