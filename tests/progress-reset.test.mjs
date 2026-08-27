import assert from "node:assert/strict";
import test from "node:test";

import {
  GAUNTLET_PROGRESS_KEY,
  STORAGE_KEY,
  assertSupportedProgressVersion,
  createResetProgressSnapshot,
  mergeProgressSnapshots,
} from "../app/progress-storage.ts";

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

test("a newer cloud schema is never accepted by an older client", () => {
  assert.throws(
    () => assertSupportedProgressVersion(2, { schemaVersion: 2 }),
    /更新版本/,
  );
});
