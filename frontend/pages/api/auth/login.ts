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
    const pk = req.headers["x-publishable-api-key"] || req.headers["X-Publishable-Api-Key"] || process.env.NEXT_PUBLIC_API_KEY || (req.cookies && req.cookies["x-publishable-api-key"])
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
        console.log('[store-api] auth trying', endpoint, 'incoming content-type', req.headers['content-type'], 'req.body type', typeof req.body)

        // Ensure we send a valid JSON body to backend. If the incoming body is a string but not valid JSON, reject early.
        let bodyToSend: string
        if (typeof req.body === 'string') {
          try {
            // if it's already a JSON string, keep it; otherwise attempt to parse and re-stringify
            JSON.parse(req.body)
            bodyToSend = req.body
          } catch (e) {
            // try to parse a common form-encoded format like email=...&password=...
            try {
              const params = new URLSearchParams(req.body)
              const obj: any = {}
              for (const [k, v] of params.entries()) obj[k] = v
              bodyToSend = JSON.stringify(obj)
              console.log('[store-api] transformed form-encoded body to JSON', obj)
            } catch (e2) {
              console.log('[store-api] invalid incoming body; rejecting', req.body)
              return res.status(400).json({ message: 'invalid_request_body' })
            }
          }
        } else {
          bodyToSend = JSON.stringify(req.body || {})
        }

        const r = await fetch(endpoint, {
          method: "POST",
          headers: forwardHeaders,
          body: bodyToSend,
        })
        console.log('[store-api] auth response', { endpoint, status: r.status, contentType: r.headers.get("content-type") })
        // If backend doesn't know this route, try admin endpoints as a fallback
        if (r.status === 404) {
          // If backend doesn't know this route, move on to the next candidate endpoint.
          // Previously we tried admin endpoints here which caused store logins to
          // fall back to admin login and produce "insufficient permissions".
          continue
        }

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

          // for other 400 JSON responses, return that JSON (we already consumed the body)
          return res.status(r.status).json(errJson)
        }

        if (contentType.includes("application/json")) {
          const data = await r.json()
          // If this was an admin fallback that returned MFA required, try to trigger PIN send
          try {
            if (data && data.mfa_required && data.user && data.user.id) {
              // trigger server-side PIN send so store flow receives the email
              await fetch(`${BACKEND_URL}/custom/admin/mfa/email/start`, {
                method: "POST",
                headers: forwardHeaders,
                body: JSON.stringify({ user_id: data.user.id })
              }).catch(() => {})
            }
          } catch (e) {
            // ignore
          }
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
