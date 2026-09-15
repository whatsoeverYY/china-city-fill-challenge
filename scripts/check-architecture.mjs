import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import process from "node:process";

const root = process.cwd();
const srcRoot = join(root, "src");
const maxLines = 500;
const sourceExtensions = new Set([".ts", ".tsx", ".css"]);
const allowedCssFiles = new Set(["src/app/globals.css"]);
const kebabCaseFile = /^[a-z0-9]+(?:-[a-z0-9]+)*\.(?:ts|tsx|css)$/;
const businessFeatures = new Set([
  "admin",
  "atlas",
  "city-challenge",
  "gauntlet",
  "knowledge",
]);
const reusableFeatures = new Set(["map", "player"]);
const nonUiFeatureLayers = new Set([
  "config",
  "data",
  "hooks",
  "model",
  "services",
]);
const errors = [];

function walk(directory) {
  return readdirSync(directory)
    .flatMap((entry) => {
      const path = join(directory, entry);
      return statSync(path).isDirectory() ? walk(path) : [path];
    });
}

function sourceLineCount(source) {
  if (!source) return 0;
  const count = source.split(/\r?\n/u).length;
  return source.endsWith("\n") ? count - 1 : count;
}

function importedProjectPaths(source, importerPath) {
  return Array.from(source.matchAll(/from\s+["']([^"']+)["']/gu))
    .map((match) => match[1])
    .map((specifier) => {
      if (specifier.startsWith("@/")) return join(srcRoot, specifier.slice(2));
      if (specifier.startsWith(".")) return resolve(dirname(importerPath), specifier);
      return null;
    })
    .filter(Boolean)
    .map((path) => relative(root, path));
}

if (existsSync(join(root, "app"))) {
  errors.push("根目录 app/ 不应存在；Next.js 入口统一放在 src/app/。 ");
}
if (!existsSync(join(root, "AGENTS.md"))) {
  errors.push("缺少仓库级 AGENTS.md，Codex 开发规则必须纳入版本控制。 ");
}

for (const route of ["page.tsx", "atlas/page.tsx", "gauntlet/page.tsx", "knowledge/page.tsx", "admin/page.tsx"]) {
  if (!existsSync(join(srcRoot, "app", route))) {
    errors.push(`缺少独立路由：src/app/${route}`);
  }
}

for (const path of walk(srcRoot)) {
  if (!sourceExtensions.has(extname(path))) continue;
  const projectPath = relative(root, path);
  const source = readFileSync(path, "utf8");
  const dependencies = importedProjectPaths(source, path);
  const projectSegments = projectPath.split("/");
  const sourceFeature = projectSegments[0] === "src" &&
      projectSegments[1] === "features"
    ? projectSegments[2]
    : null;
  const sourceFeatureLayer = sourceFeature ? projectSegments[3] : null;
  const lineCount = sourceLineCount(source);
  if (extname(path) === ".css" && !allowedCssFiles.has(projectPath)) {
    errors.push(`${projectPath} 不在允许的 CSS 文件清单中；常规样式应直接使用 Tailwind utilities。`);
  }
  if (lineCount > maxLines) {
    errors.push(`${projectPath} 有 ${lineCount} 行，超过 ${maxLines} 行上限。`);
  }
  if (!kebabCaseFile.test(basename(path))) {
    errors.push(`${projectPath} 未使用 kebab-case 文件名。`);
  }
  if (
    projectPath.startsWith("src/domain/") &&
    dependencies.some((dependency) =>
      dependency.startsWith("src/features/") ||
      dependency.startsWith("src/infrastructure/")
    )
  ) {
    errors.push(`${projectPath} 的领域数据不能反向依赖功能层或基础设施层。`);
  }
  if (
    projectPath.startsWith("src/shared/") &&
    dependencies.some((dependency) =>
      dependency.startsWith("src/features/") ||
      dependency.startsWith("src/infrastructure/")
    )
  ) {
    errors.push(`${projectPath} 的共享层不能反向依赖功能层或基础设施层。`);
  }
  if (
    projectPath.startsWith("src/infrastructure/") &&
    dependencies.some((dependency) => dependency.startsWith("src/features/"))
  ) {
    errors.push(`${projectPath} 的基础设施层不能反向依赖功能层。`);
  }
  if (
    sourceFeature &&
    sourceFeatureLayer &&
    nonUiFeatureLayers.has(sourceFeatureLayer) &&
    dependencies.some((dependency) => dependency.includes("/components/"))
  ) {
    errors.push(`${projectPath} 的非 UI 层不能依赖 components 展示层。`);
  }
  if (sourceFeature && businessFeatures.has(sourceFeature)) {
    for (const dependency of dependencies) {
      const segments = dependency.split("/");
      const targetFeature = segments[0] === "src" && segments[1] === "features"
        ? segments[2]
        : null;
      if (
        targetFeature &&
        targetFeature !== sourceFeature &&
        !reusableFeatures.has(targetFeature)
      ) {
        errors.push(
          `${projectPath} 不能依赖业务功能 ${targetFeature}；共享数据或规则应下沉到 domain/shared。`,
        );
      }
    }
  }
}

const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
if (!String(packageJson.packageManager ?? "").startsWith("pnpm@")) {
  errors.push("package.json 必须声明 pnpm packageManager。 ");
}
if (!existsSync(join(root, "pnpm-lock.yaml"))) {
  errors.push("缺少 pnpm-lock.yaml。 ");
}
if (existsSync(join(root, "package-lock.json"))) {
  errors.push("不应同时保留 package-lock.json。 ");
}
for (const [name, command] of Object.entries(packageJson.scripts ?? {})) {
  if (/\b(?:npm|yarn)\s+(?:run\s+)?/u.test(String(command))) {
    errors.push(`package.json 脚本 ${name} 必须使用 pnpm。`);
  }
}

const globals = readFileSync(join(srcRoot, "app/globals.css"), "utf8");
if (!globals.includes('@import "tailwindcss";')) {
  errors.push("src/app/globals.css 必须加载 Tailwind CSS。 ");
}

if (errors.length) {
  console.error(`架构检查失败（${errors.length} 项）：`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`架构检查通过：源码文件不超过 ${maxLines} 行，Tailwind、目录、命名、依赖方向和包管理器符合约定。`);
}
