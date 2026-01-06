import { NextApiRequest, NextApiResponse } from "next"

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://backend:9000"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "method not allowed" })

  try {
    const forwardHeaders: Record<string, string> = { "Content-Type": "application/json" }
    if (req.headers.cookie) forwardHeaders.cookie = String(req.headers.cookie)
    const pk = req.headers["x-publishable-api-key"] || req.headers["X-Publishable-Api-Key"]
    if (pk) forwardHeaders["x-publishable-api-key"] = String(pk)

    // Candidate register endpoints (try multiple variants)
    const endpoints = [
      `${BACKEND_URL}/auth/user/emailpass/register`,
      `${BACKEND_URL}/auth/emailpass/register`,
      `${BACKEND_URL}/custom/auth/register`,
      `${BACKEND_URL}/custom/auth/user/emailpass/register`,
    ]

    let lastError: any = null
    for (const endpoint of endpoints) {
      try {
        const r = await fetch(endpoint, {
          method: "POST",
          headers: forwardHeaders,
          body: JSON.stringify(req.body),
        })
        const contentType = r.headers.get("content-type") || ""
        if (contentType.includes("application/json")) {
          const data = await r.json()
          return res.status(r.status).json(data)
        }
        const text = await r.text()
        return res.status(r.status).send(text)
      } catch (err) {
        lastError = err
        // try next
      }
    }

    if (lastError) return res.status(502).json({ message: "backend unreachable", error: String(lastError) })
    return res.status(502).json({ message: "no register endpoint available on backend" })
  } catch (error) {
    return res.status(500).json({ message: "backend error" })
  }
}
