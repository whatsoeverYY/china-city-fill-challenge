# 前端架构约定

项目只保留一个源码根目录 `src/`，Next.js App Router 入口统一位于 `src/app/`。

本文件描述代码结构和依赖边界；视觉语言、组件外观和响应式设计以 [`docs/design-system.md`](./design-system.md) 为准。开发前必须同时阅读仓库根目录 `AGENTS.md`。

## 目录职责

```text
src/
├── app/                 # 路由、Metadata、全局样式入口
├── domain/              # 与 UI 无关的地理领域数据
├── features/            # 按业务功能垂直拆分
│   └── <feature>/
│       ├── components/  # 展示组件
│       ├── hooks/       # 用户交互与动作编排
│       ├── model/       # 状态、类型、纯业务规则
│       ├── data/        # 功能专属题库与目录
│       ├── config/      # 稳定配置和常量
│       └── services/    # 外部读写适配
├── infrastructure/      # 存储、Supabase 等技术实现
└── shared/              # 无业务归属的纯工具
```

依赖方向为 `app → features → domain/shared/infrastructure`。`domain`、`shared`、`infrastructure` 不允许反向依赖 `features`。业务 feature 之间不得直接依赖；跨模块复用的数据和规则放入 `domain` 或 `shared`。`map` 和 `player` 是供业务 feature 使用的应用级能力。

## 路由入口

| URL | 路由文件 | 功能入口 |
| --- | --- | --- |
| `/` | `src/app/page.tsx` | `features/city-challenge/game-root.tsx` |
| `/city-fill/[provinceCode]` | `src/app/city-fill/[provinceCode]/page.tsx` | 省内填图独立页，使用行政区划代码作为稳定路由参数 |
| `/atlas` | `src/app/atlas/page.tsx` | `features/atlas/atlas-route.tsx` |
| `/gauntlet` | `src/app/gauntlet/page.tsx` | `features/gauntlet/gauntlet-route.tsx` |
| `/gauntlet/[levelId]` | `src/app/gauntlet/[levelId]/page.tsx` | 单关卡独立页，使用稳定英文关卡 ID |
| `/knowledge` | `src/app/knowledge/page.tsx` | `features/knowledge/knowledge-route.tsx` |
| `/knowledge/[categoryId]` | `src/app/knowledge/[categoryId]/page.tsx` | 单知识专题独立页，使用稳定英文专题 ID |
| `/admin` | `src/app/admin/page.tsx` | `features/admin/admin-dashboard.tsx` |
| `/world` | `src/app/world/page.tsx` | 通关中国篇后解锁的世界地理入口；未解锁时由布局统一展示门禁 |
| `/world/knowledge` | `src/app/world/knowledge/page.tsx` | `features/world-knowledge/world-knowledge.tsx` |
| `/world/gauntlet` | `src/app/world/gauntlet/page.tsx` | `features/world-gauntlet/world-gauntlet-route.tsx` |
| `/world/gauntlet/[levelId]` | `src/app/world/gauntlet/[levelId]/page.tsx` | 世界篇单关卡独立页，使用稳定英文关卡 ID |

地理主数据与跨模块使用的城市车牌数据位于 `src/domain/geography/data/`，关卡 ID、关卡目录与错题规则位于 `src/domain/game/`。仅供单个功能使用的题库才放在对应 feature 的 `data/` 目录。

世界篇与中国篇位于同一仓库。世界国家、首都、洲和数据时间口径下沉到 `domain/geography`，世界篇解锁规则和关卡 ID 下沉到 `domain/game`；`world-home`、`world-knowledge`、`world-gauntlet` 彼此不直接依赖，共同复用 `map` 和 `player` 应用级能力。`world-home` 负责地图探索编排和国家档案展示，已探索国家使用稳定 M49 国家 ID 独立持久化，并参与现有云存档合并与全量删档；`world-gauntlet` 的地图关卡使用稳定的地区路线 ID，将联合国 M49 子地区组合为 15 条路线，轮廓关卡则按洲别筛选有效轮廓并提供洲别、地区和首都三层渐进线索，两关答对的国家都会写入同一探索进度。世界篇访问资格是独立持久化成就：完成规则集中的 19 个中国篇主线关卡后永久解锁，错题复仇赛不计入条件，全量清除进度时一并重置。管理员账号始终拥有世界篇访问资格且首页展示入口，不依赖或写入通关成就。

多层页面统一在左上角使用 `shared/components/page-breadcrumbs.tsx`，不在页头右侧重复放置返回按钮。省内填图的挑战范围和作答方式通过查询参数表达，路由生成统一经过各 feature 的 `config/*-routes.ts`，并最终调用 `shared/lib/app-path.ts` 兼容站点根路径与 GitHub Pages base path。

## 编码约定

- 文件名统一使用 `kebab-case`；React 组件和 TypeScript 类型使用 `PascalCase`，变量与函数使用 `camelCase`。
- `.ts`、`.tsx`、`.css` 单文件超过 400 行时架构检查发出预警，超过 500 行时检查失败。达到预警线前按职责拆分，不通过压缩排版规避限制。
- 页面组件只负责编排；状态放入 model/context，交互动作放入 hooks，持久化放入 infrastructure/services。
- `model`、`hooks`、`data`、`config`、`services` 不得依赖 `components`；展示层可以消费模型，模型不能反向消费展示层。
- 业务 feature 不得直接引用另一个业务 feature；需要共享的内容先下沉到 `domain` 或 `shared`。
- 业务关系使用稳定 ID（省份使用行政区划 `code`），名称只用于展示和用户输入兼容。
- 常规布局、间距、颜色、交互状态和响应式规则优先使用 Tailwind utilities。禁止用大型 `*-styles.ts`、任意后代选择器集合或 `@apply` 变相恢复集中样式表。只有 Tailwind 无法清晰、稳定表达的复杂动画、SVG 状态或组合效果，才使用语义 class + CSS。
- 颜色色阶集中在根目录 `tailwind.config.ts`：品牌主色命名为 `city-100` 至 `city-900`，玉绿、图鉴蓝、知识紫等主题色也必须提供完整 `100` 至 `900` 色阶。组件不得直接写十六进制颜色，应使用 `text-city-500`、`bg-atlas-100` 等命名 utility；SVG 数值颜色放入 `src/shared/config/` 的语义配置。
- `src/app/globals.css` 用于 Tailwind 入口、主题、全局基线和关键帧。确需 CSS 的功能样式放在对应 `src/features/<feature>/styles/`，不得建立跨功能的大型样式表；SVG 的 `fill`、`stroke`、`vectorEffect` 等固有表现优先写成类型安全的 React SVG 属性。
- 重复的 Tailwind 组合优先提取为职责明确的小型展示组件；仅供一个文件复用的静态组合可定义为该文件内的 class 常量。
- 排版使用 `tailwind.config.ts` 中的 `display/page/section/card-title/body/compact/meta` 语义字号与行高，桌面标题封顶 `40px`。文字按钮通过字号、行高和 padding 形成尺寸，min-height 只承担点击区域下限。
- 重构不得改变已确认的桌面端视觉。桌面基础 utility 视为视觉契约；移动适配必须用断点前缀隔离，并在桌面视口复查配色、尺寸、间距、圆角、阴影和信息密度。
- 移动端按触控尺寸、单列信息层级、滚动区域、地图可视高度和操作优先级独立设计，不得只缩放或照搬桌面布局；移动端继续复用桌面端品牌色、卡片形状和视觉语言。
- 常量放入 feature config 或领域数据，禁止在组件中复制关卡 ID、存储 key 等魔法字符串。
- 项目只使用 pnpm，并只提交 `pnpm-lock.yaml`。

运行 `pnpm check:architecture` 可检查文件大小（400 行预警、500 行失败）、设计规范文档、CSS 目录、任意后代选择器、命名、关键目录、依赖方向（含可复用能力层反向依赖）、业务模块边界、UI 反向依赖、路由和包管理器约束。视觉修改还必须按照 `docs/design-system.md` 分别在桌面与移动视口进行页面回归，不能只依赖静态检查。
