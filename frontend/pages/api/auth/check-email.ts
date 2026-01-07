import { NextApiRequest, NextApiResponse } from "next"

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://backend:9000"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "method not allowed" })

  try {
    const r = await fetch(`${BACKEND_URL}/custom/auth/check-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    })
    const data = await r.json()
    return res.status(r.status).json(data)
  } catch (err) {
    return res.status(502).json({ message: "backend unreachable" })
  }
}
