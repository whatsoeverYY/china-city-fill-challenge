# 中国城市填充挑战

一个可在浏览器中运行的中国行政区划拖拽游戏。先从全国地图选择省级行政区，再把城市、地级行政区或直辖市区县名称放到地图中的正确位置。

## 功能

- 覆盖 23 个省、4 个直辖市、5 个自治区和 2 个特别行政区
- 共 34 个省级行政区、500 个待归位名称
- 省级边界使用红色，地市或区县边界使用绿色
- 支持鼠标拖拽、触屏拖拽以及“先点名称、再点地图”
- 名称栏位于地图右侧并可独立滚动，窄屏时自动移至地图下方
- “难度提升”无提示模式：点击区块后手动输入省份、城市或区县名称
- “邻省连城”模式：选择一省后联动所有陆地接壤省份，合并填充整片区域，并可一键显示全部城市名称
- 错误答案自动回到名称区，完成后显示成功标记
- 支持邮箱密码登录、按账号隔离的离线缓存与 Supabase 云存档
- 游客可完整试玩但不保存；登录玩家在曾登录设备上可离线继续，联网后自动同步
- 独立管理员后台：查看玩家信息、活跃时间、地图进度、关卡进度与完整存档

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

## Supabase 云存档

正式构建已配置 Supabase publishable key。首次启用前还需要在 Supabase SQL Editor 执行数据库迁移，并创建首位管理员。完整步骤见 [supabase/SETUP.md](supabase/SETUP.md)。

为避免开发数据误写入正式库，`npm run dev` 默认不连接仓库内置的 Supabase 项目。本地需要云存档时，复制 `.env.example` 为 `.env.local` 并填写独立项目配置：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
```

如果确实需要在本地连接内置的正式项目，可在 `.env.local` 显式设置 `NEXT_PUBLIC_ALLOW_PRODUCTION_SUPABASE_FALLBACK=true`。

管理员登录后从账户面板进入管理后台（GitHub Pages 静态地址为 `/admin.html`）。管理员账号与普通账号一样可以正常游戏和保存进度。

## 校验

```bash
npm run lint
npm run typecheck
npm test
npm run test:pages
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

地图数据仅用于地理学习与游戏展示。新疆地图已更新为 27 个区块，包含新星市、白杨市和草湖市；边界数据参考 [GeoJSON.CN](https://geojson.cn/data/atlas/china) 与 [OpenStreetMap contributors](https://www.openstreetmap.org/copyright)。
