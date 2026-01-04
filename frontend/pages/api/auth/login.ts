import { NextApiRequest, NextApiResponse } from "next"

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://backend:9000"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "method not allowed" })
  }

  try {
    // Forward cookies and publishable key from the original request
    const forwardHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    }
    if (req.headers.cookie) forwardHeaders.cookie = String(req.headers.cookie)
    const pk = req.headers["x-publishable-api-key"] || req.headers["X-Publishable-Api-Key"]
    if (pk) forwardHeaders["x-publishable-api-key"] = String(pk)

    // Detect admin-origin requests (admin UI runs separately, commonly on :7000)
    const referer = String(req.headers.referer || "")
    const origin = String(req.headers.origin || "")
    const forwardedHost = String(req.headers["x-forwarded-host"] || "")
    const isAdminRequest = /(:7000|\/admin|\/app)/.test(referer) || /(:7000|\/admin|\/app)/.test(origin) || /:7000/.test(forwardedHost) || !!req.headers["x-admin-login"]

    const adminEndpoints = [
      `${BACKEND_URL}/custom/admin/auth/login`,
      `${BACKEND_URL}/admin/auth/login`,
    ]

    const storeEndpoints = [
      `${BACKEND_URL}/store/auth/init`,
      `${BACKEND_URL}/custom/auth/login`,
      `${BACKEND_URL}/auth/emailpass`,
    ]

    const endpoints = isAdminRequest ? [...adminEndpoints, ...storeEndpoints] : storeEndpoints

    let lastError: any = null
    for (const endpoint of endpoints) {
      try {
        const r = await fetch(endpoint, {
          method: "POST",
          headers: forwardHeaders,
          body: JSON.stringify(req.body),
        })
        // If backend doesn't know this route, try next
        if (r.status === 404) continue

        const contentType = r.headers.get("content-type") || ""
        // If store endpoint complains about missing publishable API key,
        // try admin-compatible endpoints as a fallback (helps curl tests)
        if (r.status === 400 && contentType.includes("application/json")) {
          const errJson = await r.json().catch(() => ({}))
          const msg = String(errJson.message || "").toLowerCase()
          if (msg.includes("publishable api key")) {
            // try admin endpoints explicitly
            const adminEndpoints = [
              `${BACKEND_URL}/custom/admin/auth/login`,
              `${BACKEND_URL}/admin/auth/login`,
            ]
            for (const aep of adminEndpoints) {
              try {
                const ar = await fetch(aep, {
                  method: "POST",
                  headers: forwardHeaders,
                  body: JSON.stringify(req.body),
                })
                const aContentType = ar.headers.get("content-type") || ""
                if (aContentType.includes("application/json")) {
                  const data = await ar.json()
                  return res.status(ar.status).json(data)
                }
                const text = await ar.text()
                return res.status(ar.status).send(text)
              } catch (e) {
                // ignore and try next admin endpoint
              }
            }
          }
        }

        if (contentType.includes("application/json")) {
          const data = await r.json()
          return res.status(r.status).json(data)
        }
        const text = await r.text()
        return res.status(r.status).send(text)
      } catch (err) {
        lastError = err
        // try next endpoint
      }
    }

    // nothing worked
    if (lastError) return res.status(502).json({ message: "backend unreachable", error: String(lastError) })
    return res.status(502).json({ message: "no auth endpoint available on backend" })
  } catch (error) {
    return res.status(500).json({ message: "backend error" })
  }
}
