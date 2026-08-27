export function appPath(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return `${basePath}${normalizedPath}` || "/";
}

export function adminPath() {
  return appPath(process.env.NEXT_PUBLIC_BASE_PATH ? "/admin.html" : "/admin");
}
