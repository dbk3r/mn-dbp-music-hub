import { NextApiRequest, NextApiResponse } from "next"

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://backend:9000"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ message: "method not allowed" })

  try {
    const forwardHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    }
    const token = req.headers.authorization || req.cookies?.token || ""
    if (token) forwardHeaders.Authorization = String(token)
    const pk = req.headers["x-publishable-api-key"] || process.env.NEXT_PUBLIC_API_KEY || req.cookies?.["x-publishable-api-key"]
    if (pk) forwardHeaders["x-publishable-api-key"] = String(pk)

    const r = await fetch(`${BACKEND_URL}/store/orders`, {
      method: "GET",
      headers: forwardHeaders,
    })

    const contentType = r.headers.get("content-type") || ""
    if (contentType.includes("application/json")) {
      const data = await r.json()
      return res.status(r.status).json(data)
    }

    const text = await r.text()
    // If backend returned HTML (e.g., redirect to login), forward as JSON error
    return res.status(502).json({ message: "backend returned non-json response", body: text })
  } catch (e) {
    return res.status(502).json({ message: "backend unreachable", error: String(e) })
  }
}
