import assert from "node:assert/strict";
import test from "node:test";

import {
  GAUNTLET_LEVEL_13_HISTORY_KEY,
  GAUNTLET_PROVINCE_SCOPE_KEY,
  GAUNTLET_PROGRESS_KEY,
  STORAGE_KEY,
  assertSupportedProgressVersion,
  createResetProgressSnapshot,
  mergeProgressSnapshots,
} from "../app/progress-storage.ts";
import { CITY_MAP_RECENT_QUESTION_LIMIT } from "../app/city-map-question-queue.ts";

const BEFORE_RESET = "2026-08-27T00:00:00.000Z";
const RESET_AT = "2026-08-27T01:00:00.000Z";
const AFTER_RESET = "2026-08-27T02:00:00.000Z";

function staleSnapshot(savedAt = BEFORE_RESET) {
  return {
    schemaVersion: 1,
    savedAt,
    values: {
      [STORAGE_KEY]: JSON.stringify({
        "320000": ["南京市", "__complete__"],
      }),
      [GAUNTLET_PROGRESS_KEY]: JSON.stringify([1, 2, 3]),
    },
    meta: {
      keys: {
        [STORAGE_KEY]: savedAt,
        [GAUNTLET_PROGRESS_KEY]: savedAt,
      },
      scopes: { [`${STORAGE_KEY}:320000`]: savedAt },
      resets: {},
    },
  };
}

test("a global reset discards unacknowledged progress even with a later device clock", () => {
  const merged = mergeProgressSnapshots(
    staleSnapshot(AFTER_RESET),
    createResetProgressSnapshot(RESET_AT),
  );

  assert.deepEqual(JSON.parse(merged.values[STORAGE_KEY] ?? "{}"), {});
  assert.deepEqual(JSON.parse(merged.values[GAUNTLET_PROGRESS_KEY] ?? "[]"), []);
  assert.equal(merged.resetAt, RESET_AT);
});

test("progress created after acknowledging the reset remains available", () => {
  const acknowledged = createResetProgressSnapshot(RESET_AT);
  acknowledged.savedAt = AFTER_RESET;
  acknowledged.values[GAUNTLET_PROGRESS_KEY] = JSON.stringify([4]);
  acknowledged.meta.keys[GAUNTLET_PROGRESS_KEY] = AFTER_RESET;

  const merged = mergeProgressSnapshots(staleSnapshot(), acknowledged);

  assert.deepEqual(JSON.parse(merged.values[GAUNTLET_PROGRESS_KEY] ?? "[]"), [4]);
  assert.deepEqual(JSON.parse(merged.values[STORAGE_KEY] ?? "{}"), {});
  assert.equal(merged.resetAt, RESET_AT);
});

test("a province reset beats stale progress from a device with a future clock", () => {
  const resetDevice = staleSnapshot(RESET_AT);
  resetDevice.values[STORAGE_KEY] = JSON.stringify({ "320000": [] });
  resetDevice.meta.scopes[`${STORAGE_KEY}:320000`] = RESET_AT;
  resetDevice.meta.resets[`${STORAGE_KEY}:320000`] = RESET_AT;

  const merged = mergeProgressSnapshots(
    resetDevice,
    staleSnapshot(AFTER_RESET),
  );

  assert.deepEqual(JSON.parse(merged.values[STORAGE_KEY] ?? "{}"), {
    "320000": [],
  });
});

test("unknown values from the current schema survive a merge", () => {
  const remote = staleSnapshot();
  remote.values["future-compatible-key"] = "future value";
  remote.meta.keys["future-compatible-key"] = AFTER_RESET;

  const merged = mergeProgressSnapshots(null, remote);

  assert.equal(merged.values["future-compatible-key"], "future value");
});

test("unknown values written after an acknowledged reset survive a merge", () => {
  const acknowledged = createResetProgressSnapshot(RESET_AT);
  acknowledged.savedAt = AFTER_RESET;
  acknowledged.values["future-compatible-key"] = "future value";
  acknowledged.meta.keys["future-compatible-key"] = AFTER_RESET;

  const merged = mergeProgressSnapshots(staleSnapshot(), acknowledged);

  assert.equal(merged.values["future-compatible-key"], "future value");
  assert.equal(merged.resetAt, RESET_AT);
});

test("the newest saved gauntlet province scope wins across devices", () => {
  const local = staleSnapshot();
  local.values[GAUNTLET_PROVINCE_SCOPE_KEY] = JSON.stringify(["320000"]);
  local.meta.keys[GAUNTLET_PROVINCE_SCOPE_KEY] = BEFORE_RESET;
  const remote = staleSnapshot();
  remote.values[GAUNTLET_PROVINCE_SCOPE_KEY] = JSON.stringify([
    "440000",
    "450000",
  ]);
  remote.meta.keys[GAUNTLET_PROVINCE_SCOPE_KEY] = AFTER_RESET;

  const merged = mergeProgressSnapshots(local, remote);

  assert.deepEqual(
    JSON.parse(merged.values[GAUNTLET_PROVINCE_SCOPE_KEY] ?? "[]"),
    ["440000", "450000"],
  );
});

test("map question history merge keeps the newest unique questions within the shared limit", () => {
  const local = staleSnapshot(BEFORE_RESET);
  const remote = staleSnapshot(AFTER_RESET);
  local.values[GAUNTLET_LEVEL_13_HISTORY_KEY] = JSON.stringify(
    Array.from({ length: 70 }, (_, index) => `question-${index}`),
  );
  local.meta.keys[GAUNTLET_LEVEL_13_HISTORY_KEY] = BEFORE_RESET;
  remote.values[GAUNTLET_LEVEL_13_HISTORY_KEY] = JSON.stringify(
    Array.from({ length: 70 }, (_, index) => `question-${index + 50}`),
  );
  remote.meta.keys[GAUNTLET_LEVEL_13_HISTORY_KEY] = AFTER_RESET;

  const merged = mergeProgressSnapshots(local, remote);
  const history = JSON.parse(merged.values[GAUNTLET_LEVEL_13_HISTORY_KEY] ?? "[]");

  assert.equal(history.length, CITY_MAP_RECENT_QUESTION_LIMIT);
  assert.equal(history[0], "question-30");
  assert.equal(history.at(-1), "question-119");
  assert.equal(new Set(history).size, history.length);
});

test("a newer cloud schema is never accepted by an older client", () => {
  assert.throws(
    () => assertSupportedProgressVersion(2, { schemaVersion: 2 }),
    /更新版本/,
  );
});
