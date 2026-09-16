# Codex 开发规则

本文件是仓库级强制约束。使用 Codex 或其他自动化工具开发前，必须先阅读本文件和 `docs/architecture.md`。

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
- 常规布局、间距、颜色、排版、交互状态与响应式样式直接写 Tailwind utilities；不得用 `*-styles.ts`、大段任意后代选择器或 `@apply` 把大 CSS 换一个位置隐藏。
- CSS 文件只允许 `src/app/globals.css`，用于 Tailwind 入口、主题、全局基线和关键帧。SVG 固有表现优先使用类型安全的 React SVG 属性，布局、交互和响应式状态使用 Tailwind utilities；新增 CSS 文件必须先修改架构规则并说明两者都无法合理表达的原因。
- 重复的 Tailwind 组合优先抽成职责明确的小型 UI 组件；仅在同一组件文件内重复使用时，才提取为含完整静态 class 字符串的局部常量。
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
