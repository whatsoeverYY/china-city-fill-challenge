import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const exportRoot = new URL("../dist/client/", import.meta.url);

test("exports a GitHub Pages entry document", async () => {
  const html = await readFile(new URL("index.html", exportRoot), "utf8");

  assert.match(html, /<title>中国城市填充挑战<\/title>/i);
  assert.match(html, /中国城市填充挑战/);
  assert.match(html, /\/china-city-fill-challenge\//);
  assert.doesNotMatch(html, /http:\/\/localhost/);
});

test("exports the administrator dashboard route", async () => {
  const html = await readFile(new URL("admin.html", exportRoot), "utf8");

  assert.match(html, /<title>管理员后台｜中国城市填充挑战<\/title>/i);
  assert.match(html, /玩家与进度中心|正在确认管理员身份/);
});

test("copies static maps and disables Jekyll processing", async () => {
  await Promise.all([
    access(new URL(".nojekyll", exportRoot)),
    access(new URL("data/maps/100000.json", exportRoot)),
    access(new URL("data/maps/820000.json", exportRoot)),
    access(new URL("favicon.svg", exportRoot)),
    access(new URL("og.png", exportRoot)),
  ]);
});
