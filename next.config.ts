import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = isGitHubPages
  ? {
      output: "export",
      // vinext 的静态预渲染器会以无尾斜杠路径探测每个路由。
      // 关闭 trailingSlash 后可稳定导出 /admin 等二级页面。
      trailingSlash: false,
    }
  : {};

export default nextConfig;
