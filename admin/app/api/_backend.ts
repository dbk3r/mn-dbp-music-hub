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

  // If a service key is available, generate a short-lived HS256 JWT for server-to-server auth
  const serviceKey = process.env.ADMIN_SERVICE_KEY || process.env.BACKEND_SERVICE_KEY
  if (serviceKey) {
    try {
      const now = Math.floor(Date.now() / 1000)
      const header = { alg: "HS256", typ: "JWT" }
      const payload = { service: "admin", iat: now, exp: now + 60 * 5 }

      const base64url = (obj: any) =>
        Buffer.from(JSON.stringify(obj))
          .toString("base64")
          .replace(/=/g, "")
          .replace(/\+/g, "-")
          .replace(/\//g, "_")

      const unsigned = `${base64url(header)}.${base64url(payload)}`
      const crypto = await import("crypto")
      const signature = crypto.createHmac("sha256", serviceKey).update(unsigned).digest("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")

      return `${unsigned}.${signature}`
    } catch (err) {
      console.error("getBackendToken: failed to generate service jwt", err)
    }
  }

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
