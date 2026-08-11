import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the city challenge shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>中国城市填充挑战<\/title>/i);
  assert.match(html, /中国城市填充挑战/);
  assert.match(html, /从一省出发/);
  assert.match(html, /34 个省级行政区/);
  assert.doesNotMatch(html, /codex-preview/);
});

test("includes map and interaction affordances", async () => {
  const [game, css, layout] = await Promise.all([
    readFile(new URL("../app/CityGame.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(game, /draggable=\{!isPlaced\}/);
  assert.match(game, /data-region-name/);
  assert.match(game, /PROVINCES/);
  assert.match(game, /难度提升/);
  assert.match(game, /邻省连城/);
  assert.match(game, /PROVINCE_NEIGHBORS/);
  assert.match(game, /PROVINCE_OUTLINE_COLORS/);
  assert.match(game, /显示全部城市/);
  assert.match(game, /useMapCollection/);
  assert.match(game, /submitManualAnswer/);
  assert.match(game, /manual-answer/);
  assert.match(css, /--red:\s*#b43b32/i);
  assert.match(css, /--green:\s*#2d7d5f/i);
  assert.match(css, /province-outline\.is-color-coded/);
  assert.match(layout, /lang="zh-CN"/);
});
