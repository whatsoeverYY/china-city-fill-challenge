export function appPath(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return `${basePath}${normalizedPath}` || "/";
}

export function routePath(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const staticPath = process.env.NEXT_PUBLIC_BASE_PATH && normalizedPath !== "/"
    ? `${normalizedPath}.html`
    : normalizedPath;
  return appPath(staticPath);
}

export function adminPath() {
  return routePath("/admin");
}
