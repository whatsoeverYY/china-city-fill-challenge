# 前端架构约定

项目只保留一个源码根目录 `src/`，Next.js App Router 入口统一位于 `src/app/`。

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
| `/atlas` | `src/app/atlas/page.tsx` | `features/atlas/atlas-route.tsx` |
| `/gauntlet` | `src/app/gauntlet/page.tsx` | `features/gauntlet/gauntlet-route.tsx` |
| `/knowledge` | `src/app/knowledge/page.tsx` | `features/knowledge/knowledge-route.tsx` |
| `/admin` | `src/app/admin/page.tsx` | `features/admin/admin-dashboard.tsx` |

地理主数据与跨模块使用的城市车牌数据位于 `src/domain/geography/data/`，关卡 ID、关卡目录与错题规则位于 `src/domain/game/`。仅供单个功能使用的题库才放在对应 feature 的 `data/` 目录。

## 编码约定

- 文件名统一使用 `kebab-case`；React 组件和 TypeScript 类型使用 `PascalCase`，变量与函数使用 `camelCase`。
- `.ts`、`.tsx`、`.css` 单文件超过 400 行时架构检查发出预警，超过 500 行时检查失败。达到预警线前按职责拆分，不通过压缩排版规避限制。
- 页面组件只负责编排；状态放入 model/context，交互动作放入 hooks，持久化放入 infrastructure/services。
- `model`、`hooks`、`data`、`config`、`services` 不得依赖 `components`；展示层可以消费模型，模型不能反向消费展示层。
- 业务 feature 不得直接引用另一个业务 feature；需要共享的内容先下沉到 `domain` 或 `shared`。
- 业务关系使用稳定 ID（省份使用行政区划 `code`），名称只用于展示和用户输入兼容。
- 常规布局、间距、颜色、交互状态和响应式规则优先使用 Tailwind utilities。禁止用大型 `*-styles.ts`、任意后代选择器集合或 `@apply` 变相恢复集中样式表。只有 Tailwind 无法清晰、稳定表达的复杂动画、SVG 状态或组合效果，才使用语义 class + CSS。
- `src/app/globals.css` 用于 Tailwind 入口、主题、全局基线和关键帧。确需 CSS 的功能样式放在对应 `src/features/<feature>/styles/`，不得建立跨功能的大型样式表；SVG 的 `fill`、`stroke`、`vectorEffect` 等固有表现优先写成类型安全的 React SVG 属性。
- 重复的 Tailwind 组合优先提取为职责明确的小型展示组件；仅供一个文件复用的静态组合可定义为该文件内的 class 常量。
- 重构不得改变已确认的桌面端视觉。桌面基础 utility 视为视觉契约；移动适配必须用断点前缀隔离，并在桌面视口复查配色、尺寸、间距、圆角、阴影和信息密度。
- 移动端按触控尺寸、单列信息层级、滚动区域、地图可视高度和操作优先级独立设计，不得只缩放或照搬桌面布局；移动端继续复用桌面端品牌色、卡片形状和视觉语言。
- 常量放入 feature config 或领域数据，禁止在组件中复制关卡 ID、存储 key 等魔法字符串。
- 项目只使用 pnpm，并只提交 `pnpm-lock.yaml`。

运行 `pnpm check:architecture` 可检查文件大小（400 行预警、500 行失败）、CSS 目录、任意后代选择器、命名、关键目录、依赖方向（含可复用能力层反向依赖）、业务模块边界、UI 反向依赖、路由和包管理器约束。视觉修改还必须分别在桌面与移动视口进行页面回归，不能只依赖静态检查。
