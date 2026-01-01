function backendBaseUrl(): string {
  return (
    process.env.MEDUSA_BACKEND_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
    "http://localhost:9000"
  );
}

export function backendUrl(path: string): string {
  const base = backendBaseUrl().replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}
