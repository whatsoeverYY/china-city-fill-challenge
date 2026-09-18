import assert from "node:assert/strict";
import test from "node:test";

import {
  HARD_MODE_KEY,
  MAP_COMPLETION_MARKER,
  NEIGHBOR_PROGRESS_KEY,
  STORAGE_KEY,
  createUserProgressStorage,
  isUserProgressStorageKey,
} from "../src/infrastructure/storage/progress-storage.ts";

function installBrowserStorage() {
  const values = new Map();
  const previousLocalStorage = Object.getOwnPropertyDescriptor(
    globalThis,
    "localStorage",
  );
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const previousCustomEvent = Object.getOwnPropertyDescriptor(
    globalThis,
    "CustomEvent",
  );

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key) => values.get(key) ?? null,
      removeItem: (key) => values.delete(key),
      setItem: (key, value) => values.set(key, value),
    },
  });
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { dispatchEvent: () => true },
  });
  if (typeof globalThis.CustomEvent === "undefined") {
    Object.defineProperty(globalThis, "CustomEvent", {
      configurable: true,
      value: class CustomEvent {
        constructor(type, options) {
          this.type = type;
          this.detail = options?.detail;
        }
      },
    });
  }

  return () => {
    for (const [key, descriptor] of [
      ["localStorage", previousLocalStorage],
      ["window", previousWindow],
      ["CustomEvent", previousCustomEvent],
    ]) {
      if (descriptor) {
        Object.defineProperty(globalThis, key, descriptor);
      } else {
        delete globalThis[key];
      }
    }
  };
}

test("stale tabs merge progress instead of overwriting other provinces", () => {
  const restore = installBrowserStorage();
  try {
    for (const key of [STORAGE_KEY, NEIGHBOR_PROGRESS_KEY]) {
      const firstTab = createUserProgressStorage("player-1");
      const secondTab = createUserProgressStorage("player-1");

      firstTab.setMapProgress(key, "320000", ["320100"]);
      secondTab.setMapProgress(key, "440000", ["440100"]);

      assert.deepEqual(JSON.parse(firstTab.getItem(key) ?? "{}"), {
        "320000": ["320100"],
        "440000": ["440100"],
      });
    }
  } finally {
    restore();
  }
});

test("stale tabs merge answers made in the same province", () => {
  const restore = installBrowserStorage();
  try {
    const firstTab = createUserProgressStorage("player-1");
    const secondTab = createUserProgressStorage("player-1");

    firstTab.setMapProgress(STORAGE_KEY, "320000", ["320100"]);
    secondTab.setMapProgress(STORAGE_KEY, "320000", ["320200"]);

    assert.deepEqual(JSON.parse(firstTab.getItem(STORAGE_KEY) ?? "{}"), {
      "320000": ["320100", "320200"],
    });

    secondTab.setMapProgress(
      STORAGE_KEY,
      "320000",
      [MAP_COMPLETION_MARKER, "320200"],
    );
    assert.deepEqual(JSON.parse(firstTab.getItem(STORAGE_KEY) ?? "{}"), {
      "320000": [MAP_COMPLETION_MARKER, "320100", "320200"],
    });
  } finally {
    restore();
  }
});

test("an explicit province reset still clears that province only", () => {
  const restore = installBrowserStorage();
  try {
    const storage = createUserProgressStorage("player-1");
    storage.setMapProgress(STORAGE_KEY, "320000", ["320100"]);
    storage.setMapProgress(STORAGE_KEY, "440000", ["440100"]);
    storage.setMapProgress(STORAGE_KEY, "320000", []);

    assert.deepEqual(JSON.parse(storage.getItem(STORAGE_KEY) ?? "{}"), {
      "320000": [],
      "440000": ["440100"],
    });
  } finally {
    restore();
  }
});

test("an unrelated write cannot replay a stale empty province", () => {
  const restore = installBrowserStorage();
  try {
    const firstTab = createUserProgressStorage("player-1");
    const staleTab = createUserProgressStorage("player-1");

    staleTab.setMapProgress(STORAGE_KEY, "320000", []);
    firstTab.setMapProgress(STORAGE_KEY, "320000", ["320100"]);
    staleTab.setMapProgress(STORAGE_KEY, "440000", ["440100"]);

    assert.deepEqual(JSON.parse(firstTab.getItem(STORAGE_KEY) ?? "{}"), {
      "320000": ["320100"],
      "440000": ["440100"],
    });
  } finally {
    restore();
  }
});

test("a stale tab only reapplies answers added after another tab reset", () => {
  const restore = installBrowserStorage();
  try {
    const firstTab = createUserProgressStorage("player-1");
    const staleTab = createUserProgressStorage("player-1");

    firstTab.setMapProgress(STORAGE_KEY, "320000", ["320100"]);
    staleTab.getItem(STORAGE_KEY);
    firstTab.setMapProgress(STORAGE_KEY, "320000", []);
    staleTab.setMapProgress(
      STORAGE_KEY,
      "320000",
      ["320100", "320200"],
    );

    assert.deepEqual(JSON.parse(firstTab.getItem(STORAGE_KEY) ?? "{}"), {
      "320000": ["320200"],
    });
  } finally {
    restore();
  }
});

test("a scoped write removes legacy display names from that province", () => {
  const restore = installBrowserStorage();
  try {
    const storage = createUserProgressStorage("player-1");
    storage.setItem(STORAGE_KEY, JSON.stringify({
      "320000": ["南京市", "320100", "不存在"],
    }));
    storage.setMapProgress(STORAGE_KEY, "320000", ["320200"]);

    assert.deepEqual(JSON.parse(storage.getItem(STORAGE_KEY) ?? "{}"), {
      "320000": ["320100", "320200"],
    });
  } finally {
    restore();
  }
});

test("non-map settings retain normal last-write behavior", () => {
  const restore = installBrowserStorage();
  try {
    const storage = createUserProgressStorage("player-1");
    storage.setItem(HARD_MODE_KEY, "true");
    storage.setItem(HARD_MODE_KEY, "false");

    assert.equal(storage.getItem(HARD_MODE_KEY), "false");
  } finally {
    restore();
  }
});

test("cross-tab storage keys are scoped to the active player", () => {
  const storageKey =
    "china-city-fill-user-v1:player-1:china-city-fill-progress-v1";

  assert.equal(isUserProgressStorageKey("player-1", storageKey), true);
  assert.equal(isUserProgressStorageKey("player-2", storageKey), false);
  assert.equal(isUserProgressStorageKey("player-1", null), false);
  assert.equal(
    isUserProgressStorageKey(
      "player-1",
      "china-city-fill-user-v1:player-1:unrelated-key",
    ),
    false,
  );
});
