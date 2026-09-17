# Codex 开发规则

本文件是仓库级强制约束。使用 Codex 或其他自动化工具开发前，必须先阅读本文件、`docs/architecture.md` 和 `docs/design-system.md`。

## 目录与依赖

- 项目只保留一个源码根目录 `src/`，App Router 入口只能位于 `src/app/`，不得重新创建根目录 `app/`。
- `src/app/` 只负责路由、Metadata、全局 Provider 和全局样式入口，不在页面文件中实现业务逻辑。
- 业务代码按 `src/features/<feature>/` 垂直拆分；展示放 `components`，交互编排放 `hooks`，状态与纯逻辑放 `model`，专属数据放 `data`，常量放 `config`，外部读写放 `services`。
- 跨功能的业务实体、稳定 ID、共享数据和纯规则放 `src/domain/`；通用无业务工具放 `src/shared/`；存储、Supabase 等技术实现放 `src/infrastructure/`。
- 依赖方向固定为 `app → features → domain/shared/infrastructure`。`domain`、`shared`、`infrastructure` 不得反向依赖 `features`。
- 业务 feature 不得直接依赖另一个业务 feature。确需共享时先下沉到 `domain` 或 `shared`；`map`、`player` 作为应用级能力可以被业务 feature 使用。
- `model`、`hooks`、`data`、`config`、`services` 不得依赖 `components`，避免 UI 反向渗入逻辑层。

## 文件与命名

- `src` 下 `.ts`、`.tsx`、`.css` 文件名统一使用 kebab-case。
- React 组件、类型使用 PascalCase；变量、函数使用 camelCase；常量使用 UPPER_SNAKE_CASE。
- 单个 `.ts`、`.tsx`、`.css` 文件超过 400 行时必须预警，超过 500 行时检查失败；应在达到预警线前按职责主动拆分，不得通过压缩排版规避限制。
- 不创建无明确职责的 `utils.ts`、`constants.ts` 或大型 barrel 文件；文件名必须表达领域或功能职责。

## UI、逻辑与样式

- 页面和组件只负责渲染及事件连接；可复用状态放 hook/context，业务计算写成可测试的纯函数，数据读取和持久化通过 service/infrastructure。
- `docs/design-system.md` 是仓库级视觉契约。新增或修改 UI 必须遵循其中的颜色、排版、间距、形状、Tag、按钮、链接、模块结构和响应式规则；无明确设计需求的重构不得改变既有视觉。
- 常规布局、间距、颜色、排版、交互状态与响应式样式优先使用 Tailwind utilities；不得用 `*-styles.ts`、大段任意后代选择器或 `@apply` 把大 CSS 换一个位置隐藏。Tailwind 无法清晰、稳定表达的复杂动画、SVG 状态或组合效果，才使用语义 class + CSS。
- 项目颜色统一维护在 `tailwind.config.ts`，品牌主色使用 `city-100` 至 `city-900`，其他主题色同样提供 `100` 至 `900` 完整色阶。组件中使用 `text-city-500`、`bg-atlas-100` 等命名 utility，禁止直接写十六进制颜色；SVG 等必须传入数值颜色的场景统一从 `src/shared/config/` 读取语义色值。
- `src/app/globals.css` 只用于 Tailwind 入口、主题、全局基线和关键帧。确需 CSS 的功能样式放在对应 `src/features/<feature>/styles/`，不得建立跨功能的大型样式表；新增前必须确认 Tailwind 无法合理表达，并保持 400/500 行门禁。
- 重复的 Tailwind 组合优先抽成职责明确的小型 UI 组件；仅在同一组件文件内重复使用时，才提取为含完整静态 class 字符串的局部常量。
- 标题、正文和元信息优先使用 `text-display/page/section/card-title/body/compact/meta` 语义字号及其配套行高；桌面标题最大为 `40px`。文字按钮由字号、行高和 padding 决定尺寸，只用 min-height 保障桌面/移动点击下限，固定正方形尺寸仅用于纯图标或地图控件。
- 重构不得改变已经确认的桌面端视觉，包括配色、尺寸、间距、圆角、阴影、层级和信息密度；桌面基础 utility 是视觉契约，响应式改动必须通过断点前缀隔离，并在桌面视口回归验证。
- 移动端必须按触控尺寸、单列信息层级、可滚动区域、地图可视高度和操作优先级独立设计，不能仅缩放或照搬桌面布局；同时应复用桌面端的品牌色、卡片形状和视觉语言。
- 不在组件中复制存储 key、关卡 ID、行政区编码、阈值、延迟等魔法值；统一放到领域数据或 feature config。

## 数据与兼容策略

- 业务关联必须使用稳定 ID。省级行政区使用行政区划 `code`，关卡和技能使用稳定英文 ID；中文名称只用于展示、搜索和用户答案归一化。
- 禁止用展示文案、数组位置或可变名称作为持久化主键、关联条件或分支判断。
- 项目仍处于开发阶段，方案替换时同步更新所有调用方、测试和文档，并删除被替代的运行时代码；不得保留 legacy/deprecated 分支、双写、旧入口或兼容导出。
- 已执行的数据库迁移属于不可变部署历史，不得为了清理运行时代码而修改或删除；需要调整时新增迁移。

## 路由与功能

- 每个主要模块必须有可直接访问的独立路由；新增模块时同时添加 `src/app/<route>/page.tsx`、Metadata 和静态导出测试。
- 路由跳转必须通过 `src/shared/lib/app-path.ts` 生成，确保根路径和 GitHub Pages base path 都可用。
- 重构必须保持现有用户流程、进度存储格式、离线行为、云同步和静态部署可用；行为变化必须有明确需求和测试覆盖。

## 工具链与质量门禁

- 只使用 pnpm，不得提交 `package-lock.json` 或 `yarn.lock`，也不得在脚本和文档中新增 npm/yarn 命令。
- 每次修改后至少运行 `pnpm lint`、`pnpm typecheck` 和相关单元测试。
- 提交前必须运行完整的 `pnpm test` 与 `pnpm test:pages`，并执行 `git diff --check`。
- 架构约束由 `pnpm check:architecture` 自动检查。不要绕过检查；规则变化时同步修改本文件、`docs/architecture.md` 和检查脚本。

## 变更与提交

- 尊重工作区已有修改，不覆盖与当前任务无关的用户改动。
- 不使用脚本批量删除文件或目录。只能使用 `Remove-Item` 逐个删除文件；确需批量删除时必须停止并请用户手动确认。
- 不创建新分支。需要提交或提交 MR 时，使用当前 origin 分支并推送到同名远端分支。
- 提交应保持主题单一，并在提交前检查暂存区内容。MR 描述必须准确说明目的、范围、行为影响、验证结果和已知风险。
