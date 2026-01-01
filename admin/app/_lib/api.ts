export function adminBasePath(): string {
  return process.env.NEXT_PUBLIC_BASE_PATH ?? "";
}

export function adminApiUrl(path: string): string {
  const base = adminBasePath();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}/api${normalized}`;
}
