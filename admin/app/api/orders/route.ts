import fs from "fs/promises"
import path from "path"
import { backendUrl, getBackendToken } from "../_backend"

const DATA_FILE = path.join(process.cwd(), "admin", "data", "orders.json")

function jsonResponse(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

export async function GET(req: Request) {
  // Always try to proxy to the real backend first (use helper for base URL)
  try {
    const url = new URL(req.url)
    const qs = url.search
    const headers: Record<string, string> = {}

    // Prefer a server-to-server token when available (BACKEND_SERVICE_KEY flow).
    // Fall back to forwarding the caller Authorization header if no server token.
    const auth = req.headers.get("authorization")
    const token = await getBackendToken()
    if (token) {
      headers.Authorization = `Bearer ${token}`
      console.log('[admin-api] attaching server token to backend request')
    } else if (auth) {
      headers.Authorization = auth
    }

    // minimal proxy; avoid verbose header logging in production

    // (handled above) - server token preferred

    // Try the custom admin endpoint first (works with service JWT), then
    // the admin-prefixed endpoint, then fall back to plain /orders
    const targets = [
      backendUrl(`/custom/admin/orders${qs}`),
      backendUrl(`/admin/orders${qs}`),
      backendUrl(`/orders${qs}`),
    ]
    console.log('[admin-api] proxy targets:', targets)
    for (const t of targets) {
      try {
        console.log('[admin-api] fetching target', t)
        const r = await fetch(t, { headers })
        console.log('[admin-api] backend response', { url: t, status: r.status })
        if (r.status === 404) {
          // try next target
          continue
        }

        // If the client-provided token was rejected (401) and we have a server-side
        // service token, retry the request using the server token so the admin UI
        // can still display data even when the client token is expired.
        if (r.status === 401) {
          if (token) {
            try {
              console.log('[admin-api] retrying with server token for', t)
              const serverHeaders = { ...headers, Authorization: `Bearer ${token}` }
              const r2 = await fetch(t, { headers: serverHeaders })
              console.log('[admin-api] backend retry response', { url: t, status: r2.status })
              if (r2.status >= 200 && r2.status < 300) {
                const text2 = await r2.text()
                const contentType2 = r2.headers.get("content-type") || "application/json"
                return new Response(text2, { status: r2.status, headers: { "Content-Type": contentType2 } })
              }
              // if retry also failed (e.g., 401), continue to next target
              continue
            } catch (e) {
              // try next target
              continue
            }
          }
          // no server token, continue to next target so we can fall back to local file
          continue
        }

        // For non-401/404 responses, return the backend response as-is
        const text = await r.text()
        try {
          const preview = text.slice(0, 800)
          console.log('[admin-api] backend response preview:', preview)
        } catch (e) {
          // ignore
        }
        const contentType = r.headers.get("content-type") || "application/json"
        return new Response(text, { status: r.status, headers: { "Content-Type": contentType } })
      } catch (e) {
        // try next target
        continue
      }
    }
    // if we reach here, none of the backend targets returned a usable response
    // (either 404 or 401); fall through to local file fallback so admin still works offline
    try {
      const raw = await fs.readFile(DATA_FILE, "utf8")
      const data = JSON.parse(raw)
      return jsonResponse(data)
    } catch (err2: any) {
      if (err2?.code === "ENOENT") {
        return jsonResponse([], 200)
      }
      return jsonResponse({ message: "Fehler beim Laden der Bestellungen (kein Backend)", error: String(err2) }, 502)
    }
  } catch (err: any) {
    // On any proxy error, fall back to the local data file so admin still works offline
    try {
      const raw = await fs.readFile(DATA_FILE, "utf8")
      const data = JSON.parse(raw)
      return jsonResponse(data)
    } catch (err2: any) {
      if (err2?.code === "ENOENT") {
        return jsonResponse([], 200)
      }
      return jsonResponse({ message: "Fehler beim Laden der Bestellungen (Proxy fehlgeschlagen)", error: String(err) }, 502)
    }
  }
}
