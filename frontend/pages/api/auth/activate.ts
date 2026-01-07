import { NextApiRequest, NextApiResponse } from "next"

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://backend:9000"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ message: "method not allowed" })

  try {
    const forwardHeaders: Record<string, string> = { "Content-Type": "application/json" }
    if (req.headers.cookie) forwardHeaders.cookie = String(req.headers.cookie)

    const token = (req.query && req.query.token) ? String(req.query.token) : (req.body && (req.body as any).token)
    if (!token) return res.status(400).json({ message: "missing token" })

    const endpoints = [
      `${BACKEND_URL}/custom/auth/activate`,
      `${BACKEND_URL}/auth/activate`,
    ]

    let lastErr: any = null
    for (const endpoint of endpoints) {
      try {
        const url = endpoint + `?token=${encodeURIComponent(token)}`
        const r = await fetch(url, { method: "GET", headers: forwardHeaders })
        const contentType = r.headers.get("content-type") || ""
        if (contentType.includes("application/json")) {
          const data = await r.json()
          return res.status(r.status).json(data)
        }
        const text = await r.text()
        return res.status(r.status).send(text)
      } catch (err) {
        lastErr = err
      }
    }

    return res.status(502).json({ message: "backend unreachable", error: String(lastErr) })
  } catch (err) {
    return res.status(500).json({ message: "internal error", error: String(err) })
  }
}
