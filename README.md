# 中国城市填充挑战

一个可在浏览器中运行的中国行政区划拖拽游戏。先从全国地图选择省级行政区，再把城市、地级行政区或直辖市区县名称放到地图中的正确位置。

## 功能

- 覆盖 23 个省、4 个直辖市、5 个自治区和 2 个特别行政区
- 共 34 个省级行政区、497 个待归位名称
- 省级边界使用红色，地市或区县边界使用绿色
- 支持鼠标拖拽、触屏拖拽以及“先点名称、再点地图”
- 名称栏位于地图右侧并可独立滚动，窄屏时自动移至地图下方
- “难度提升”无提示模式：点击区块后手动输入省份、城市或区县名称
- “邻省连城”模式：选择一省后联动所有陆地接壤省份，合并填充整片区域，并可一键显示全部城市名称
- 错误答案自动回到名称区，完成后显示成功标记
- 挑战进度保存在浏览器本机

## 本地运行

需要 Node.js `>=22.13.0`。

使用 pnpm：

```bash
corepack enable
pnpm install
pnpm dev
```

或使用 npm：

```bash
npm install
npm run dev
```

启动后访问 [http://localhost:3000](http://localhost:3000)。

## 校验

```bash
npm run build
node --test tests/rendered-html.test.mjs
```

## GitHub Pages 部署

项目已配置 GitHub Actions。推送到 `main` 后，会自动构建纯静态版本并部署到：

<https://whatsoeveryy.github.io/china-city-fill-challenge/>

首次使用时，在仓库的 `Settings → Pages` 中将发布来源设置为 `GitHub Actions`。

本地验证 Pages 构建：

```bash
npm run test:pages
```

## 技术栈

- React 19
- TypeScript
- vinext / Vite
- 原生 SVG 地图渲染
- Cloudflare Workers 兼容构建

地图数据仅用于地理学习与游戏展示。
