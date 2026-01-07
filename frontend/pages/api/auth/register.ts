import { NextApiRequest, NextApiResponse } from "next"

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://backend:9000"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "method not allowed" })

  try {
    console.log('[store-api] register handler called')
    const forwardHeaders: Record<string, string> = { "Content-Type": "application/json" }
    if (req.headers.cookie) forwardHeaders.cookie = String(req.headers.cookie)
    const pk = req.headers["x-publishable-api-key"] || req.headers["X-Publishable-Api-Key"]
    if (pk) forwardHeaders["x-publishable-api-key"] = String(pk)

    // log email presence (do NOT log password)
    try {
      const maybeEmail = (req.body && (req.body as any).email) || null
      if (maybeEmail) console.log('[store-api] register for email=', maybeEmail)
    } catch {}

    // Candidate register endpoints (try multiple variants)
    // Prefer custom/store register endpoints so a `customer` is created,
    // fallback to other auth variants only if those are not available.
    const endpoints = [
      `${BACKEND_URL}/custom/auth/register`,
      `${BACKEND_URL}/custom/auth/user/emailpass/register`,
      `${BACKEND_URL}/auth/emailpass/register`,
      `${BACKEND_URL}/auth/user/emailpass/register`,
    ]

    let lastError: any = null
    for (const endpoint of endpoints) {
      try {
        console.log('[store-api] trying endpoint', endpoint)
        const r = await fetch(endpoint, {
          method: "POST",
          headers: forwardHeaders,
          body: JSON.stringify(req.body),
        })
        const text = await r.text().catch(() => '')
        let data: any = null
        try { data = text ? JSON.parse(text) : null } catch { data = { raw: text } }
        console.log('[store-api] backend response', { endpoint, status: r.status, body: data })
        if (r.headers.get("content-type")?.includes("application/json")) {
          return res.status(r.status).json(data)
        }
        return res.status(r.status).send(text)
      } catch (err) {
        console.error('[store-api] endpoint error', endpoint, String(err))
        lastError = err
        // try next
      }
    }

    if (lastError) return res.status(502).json({ message: "backend unreachable", error: String(lastError) })
    return res.status(502).json({ message: "no register endpoint available on backend" })
  } catch (error) {
    console.error('[store-api] unexpected error', String(error))
    return res.status(500).json({ message: "backend error" })
  }
}
