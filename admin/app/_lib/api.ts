export function adminBasePath(): string {
  return process.env.NEXT_PUBLIC_BASE_PATH ?? "";
}

export function adminApiUrl(path: string): string {
  const base = adminBasePath();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  // Accept callers using either "/admin/..." or "/api/..." and normalize to "/api/..."
  const withoutPrefix = normalized.replace(/^\/(admin|api)/, "")
  return `${base}/api/${withoutPrefix.replace(/^\//, "")}`
}
