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

export async function getBackendToken(): Promise<string | null> {
  // Prefer an explicit service token from env
  if (process.env.BACKEND_SERVICE_TOKEN) return process.env.BACKEND_SERVICE_TOKEN
  if (process.env.ADMIN_AUTH_TOKEN) return process.env.ADMIN_AUTH_TOKEN

  // Otherwise, try to login with provided admin credentials (only for server-side use)
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  if (!email || !password) return null

  const url = backendBaseUrl() + "/admin/auth/login"
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    if (!r.ok) return null
    const data = await r.json()
    return data.token || null
  } catch (err) {
    console.error("getBackendToken error:", err)
    return null
  }
}
