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
- `.ts`、`.tsx`、`.css` 单文件最多 500 行。达到上限前按职责拆分，不通过压缩排版规避限制。
- 页面组件只负责编排；状态放入 model/context，交互动作放入 hooks，持久化放入 infrastructure/services。
- `model`、`hooks`、`data`、`config`、`services` 不得依赖 `components`；展示层可以消费模型，模型不能反向消费展示层。
- 业务 feature 不得直接引用另一个业务 feature；需要共享的内容先下沉到 `domain` 或 `shared`。
- 业务关系使用稳定 ID（省份使用行政区划 `code`），名称只用于展示和用户输入兼容。
- 常规布局、间距、颜色、交互状态和响应式规则直接使用 Tailwind utilities。禁止用大型 `*-styles.ts`、任意后代选择器集合或 `@apply` 变相恢复集中样式表。
- CSS 文件固定为 `src/app/globals.css`（主题、全局基线、关键帧）与 `src/app/styles/maps.css`（SVG path、地图文字描边及触控命中区）；架构检查会拒绝其他 CSS 文件。
- 重复的 Tailwind 组合优先提取为职责明确的小型展示组件；仅供一个文件复用的静态组合可定义为该文件内的 class 常量。
- 常量放入 feature config 或领域数据，禁止在组件中复制关卡 ID、存储 key 等魔法字符串。
- 项目只使用 pnpm，并只提交 `pnpm-lock.yaml`。

运行 `pnpm check:architecture` 可检查文件大小、CSS 白名单、命名、关键目录、依赖方向、业务模块边界、UI 反向依赖、路由和包管理器约束。
