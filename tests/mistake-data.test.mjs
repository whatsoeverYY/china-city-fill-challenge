import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeMistakeList,
  upsertMistake,
} from "../app/mistake-data.ts";
import { MAX_MISTAKE_QUESTIONS } from "../app/progress-config.ts";

function seed(id) {
  return {
    id,
    category: "城市",
    prompt: `题目 ${id}`,
    answers: [id],
    correctAnswer: id,
    explanation: `解释 ${id}`,
  };
}

test("mistakes are bounded and keep the most recent records", () => {
  let mistakes = [];
  for (let index = 0; index < MAX_MISTAKE_QUESTIONS + 20; index += 1) {
    mistakes = upsertMistake(mistakes, seed(String(index)));
  }

  assert.equal(mistakes.length, MAX_MISTAKE_QUESTIONS);
  assert.equal(mistakes[0].id, "20");
  assert.equal(mistakes.at(-1).id, String(MAX_MISTAKE_QUESTIONS + 19));
});

test("repeated mistakes increment and move to the recent end", () => {
  const initial = [
    { ...seed("first"), wrongCount: 1 },
    { ...seed("second"), wrongCount: 1 },
  ];
  const updated = upsertMistake(initial, seed("first"));

  assert.deepEqual(updated.map((item) => item.id), ["second", "first"]);
  assert.equal(updated.at(-1).wrongCount, 2);
});

test("stored mistakes are validated and truncated", () => {
  const values = Array.from(
    { length: MAX_MISTAKE_QUESTIONS + 1 },
    (_, index) => ({ ...seed(String(index)), wrongCount: 1 }),
  );
  values.push({ invalid: true });

  const normalized = normalizeMistakeList(values);

  assert.equal(normalized.length, MAX_MISTAKE_QUESTIONS);
  assert.equal(normalized[0].id, "1");
});
