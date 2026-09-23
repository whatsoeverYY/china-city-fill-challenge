import assert from "node:assert/strict";
import test from "node:test";

import {
  appPath,
  clientRoutePath,
  routePath,
} from "../src/shared/lib/app-path.ts";

test("GitHub Pages paths remain directly addressable and use client routes", () => {
  const previousBasePath = process.env.NEXT_PUBLIC_BASE_PATH;
  process.env.NEXT_PUBLIC_BASE_PATH = "/china-city-fill-challenge";

  try {
    assert.equal(appPath("/"), "/china-city-fill-challenge/");
    assert.equal(
      routePath("/world/knowledge"),
      "/china-city-fill-challenge/world/knowledge/",
    );
    assert.equal(
      clientRoutePath("/china-city-fill-challenge/world/knowledge/"),
      "/world/knowledge/",
    );
    assert.equal(
      clientRoutePath(
        "/china-city-fill-challenge/city-fill/440000/?answer=manual",
      ),
      "/city-fill/440000/?answer=manual",
    );
  } finally {
    if (previousBasePath === undefined) {
      delete process.env.NEXT_PUBLIC_BASE_PATH;
    } else {
      process.env.NEXT_PUBLIC_BASE_PATH = previousBasePath;
    }
  }
});
