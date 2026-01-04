export function adminBasePath(): string {
  return process.env.NEXT_PUBLIC_BASE_PATH ?? "";
}

export function adminApiUrl(path: string): string {
  const base = adminBasePath();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  // Avoid double "/admin" when callers already include it (some files call adminApiUrl("/admin/...")
  const withoutAdmin = normalized.startsWith("/admin") ? normalized.replace(/^\/admin/, "") : normalized;
  return `${base}/admin${withoutAdmin}`;
}
