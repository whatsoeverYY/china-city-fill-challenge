import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = isGitHubPages
  ? {
      basePath: process.env.NEXT_PUBLIC_BASE_PATH,
      output: "export",
      trailingSlash: true,
    }
  : {};

export default nextConfig;
