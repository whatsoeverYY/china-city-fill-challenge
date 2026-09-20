import assert from "node:assert/strict";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${path}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the city challenge shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>中国城市填充挑战<\/title>/i);
  assert.match(html, /中国城市填充挑战/);
  assert.match(html, /34 个省级行政区/);
  assert.match(html, /地理知识馆/);
  assert.doesNotMatch(html, /href="\/world"/);
  assert.doesNotMatch(html, /codex-preview/);
});

test("server-renders the protected administrator route", async () => {
  const response = await render("/admin");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /管理员后台｜中国城市填充挑战/);
  assert.match(html, /正在确认管理员身份|请先登录管理员账号/);
});

test("server-renders independently addressable nested routes", async () => {
  const cases = [
    ["/city-fill/440000", /广东城市填图｜中国城市填充挑战/, /广东城市填图/],
    ["/gauntlet/province-shape", /辨形识省｜过关斩将｜中国城市填充挑战/, /第 1 关/],
    ["/knowledge/province-profile", /省份全景名片｜地理知识馆｜中国城市填充挑战/, /省份全景名片/],
  ];

  for (const [path, title, content] of cases) {
    const response = await render(path);
    assert.equal(response.status, 200, `${path} should render successfully`);
    const html = await response.text();
    assert.match(html, title);
    assert.match(html, content);
    assert.match(html, /面包屑导航/);
  }
});

test("server-renders the gated world route without exposing world content", async () => {
  for (const [path, title] of [
    ["/world", /世界地理｜中国城市填充挑战/],
    ["/world/knowledge", /世界地理知识｜中国城市填充挑战/],
    [
      "/world/gauntlet/world-country-shapes",
      /国形辨影｜世界地图关卡｜中国城市填充挑战/,
    ],
  ]) {
    const response = await render(path);
    assert.equal(response.status, 200, `${path} should render successfully`);
    const html = await response.text();
    const visibleHtml = html.split("</head>")[1]?.split('<script type="module"')[0] ?? "";
    assert.match(html, title);
    assert.match(visibleHtml, /正在核验世界篇资格/);
    assert.doesNotMatch(visibleHtml, /国家、首都与七大洲/);
  }
});
