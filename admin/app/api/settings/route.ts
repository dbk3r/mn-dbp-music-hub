import type { NextApiRequest, NextApiResponse } from "next"
import { getBackendToken } from "../_backend"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const token = await getBackendToken()
      if (!token) {
        return res.status(500).json({ message: "Backend nicht verfügbar" })
      }

      // Get current settings from backend
      const r = await fetch(`${process.env.BACKEND_URL || "http://localhost:9000"}/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!r.ok) {
        // If backend doesn't have settings endpoint yet, return defaults
        return res.json({
          stripe_publishable_key: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
          stripe_secret_key: "", // Don't expose secret key
          stripe_webhook_secret: "", // Don't expose webhook secret
        })
      }

      const data = await r.json()
      return res.json(data)
    } catch (error) {
      console.error("Settings fetch error:", error)
      return res.status(500).json({ message: "Fehler beim Laden der Einstellungen" })
    }
  }

  if (req.method === "POST") {
    try {
      const token = await getBackendToken()
      if (!token) {
        return res.status(500).json({ message: "Backend nicht verfügbar" })
      }

      const { stripe_publishable_key, stripe_secret_key, stripe_webhook_secret } = req.body

      // Update settings in backend
      const r = await fetch(`${process.env.BACKEND_URL || "http://localhost:9000"}/admin/settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          stripe_publishable_key,
          stripe_secret_key,
          stripe_webhook_secret,
        }),
      })

      if (!r.ok) {
        return res.status(r.status).json({ message: "Fehler beim Speichern" })
      }

      const data = await r.json()
      return res.json(data)
    } catch (error) {
      console.error("Settings save error:", error)
      return res.status(500).json({ message: "Fehler beim Speichern der Einstellungen" })
    }
  }

  res.setHeader("Allow", ["GET", "POST"])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}