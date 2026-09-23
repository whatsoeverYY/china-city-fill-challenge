export function appPath(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return `${basePath}${normalizedPath}` || "/";
}

export function routePath(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const staticPath = process.env.NEXT_PUBLIC_BASE_PATH && normalizedPath !== "/"
    ? `${normalizedPath.replace(/\/$/, "")}/`
    : normalizedPath;
  return appPath(staticPath);
}

export function clientRoutePath(path: string) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  let clientPath = path;

  if (basePath && clientPath === basePath) return "/";
  if (basePath && clientPath.startsWith(`${basePath}/`)) {
    clientPath = clientPath.slice(basePath.length);
  }

  return clientPath || "/";
}

export function adminPath() {
  return routePath("/admin");
}
