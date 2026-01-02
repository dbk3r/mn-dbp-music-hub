import { NextApiRequest, NextApiResponse } from "next"

const BACKEND_URL = process.env.BACKEND_URL || "http://backend:9000"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers.authorization

  if (!token) {
    return res.status(401).json({ message: "unauthorized" })
  }

  if (req.method === "GET") {
    try {
      const r = await fetch(`${BACKEND_URL}/custom/user/me`, {
        headers: { Authorization: token },
      })
      const data = await r.json()
      return res.status(r.status).json(data)
    } catch (error) {
      return res.status(500).json({ message: "backend error" })
    }
  }

  if (req.method === "PATCH") {
    try {
      const r = await fetch(`${BACKEND_URL}/custom/user/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify(req.body),
      })
      const data = await r.json()
      return res.status(r.status).json(data)
    } catch (error) {
      return res.status(500).json({ message: "backend error" })
    }
  }

  return res.status(405).json({ message: "method not allowed" })
}
