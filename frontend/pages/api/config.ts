import type { NextApiRequest, NextApiResponse } from "next"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  try {
    // Get Stripe publishable key from backend
    const backendUrl = process.env.BACKEND_URL || "http://localhost:9000"
    const response = await fetch(`${backendUrl}/admin/settings`)

    if (response.ok) {
      const settings = await response.json()
      return res.json({
        stripe_publishable_key: settings.stripe_publishable_key || "",
      })
    } else {
      // Fallback to environment variable
      return res.json({
        stripe_publishable_key: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
      })
    }
  } catch (error) {
    console.error("Config fetch error:", error)
    // Fallback to environment variable
    return res.json({
      stripe_publishable_key: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
    })
  }
}