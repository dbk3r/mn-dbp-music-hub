import type { NextApiRequest, NextApiResponse } from "next"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const PAYPAL_CLIENT = process.env.PAYPAL_CLIENT_ID
  const PAYPAL_SECRET = process.env.PAYPAL_SECRET
  if (!PAYPAL_CLIENT || !PAYPAL_SECRET) {
    return res.status(501).json({ error: "PayPal not configured on server" })
  }

  try {
    const { paypalOrderId } = req.body || {}
    if (!paypalOrderId) return res.status(400).json({ error: "paypalOrderId required" })

    // get access token
    const tokenRes = await fetch(`https://api-m.paypal.com/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${PAYPAL_CLIENT}:${PAYPAL_SECRET}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    })

    if (!tokenRes.ok) {
      const txt = await tokenRes.text()
      return res.status(502).json({ error: "PayPal token fetch failed", details: txt })
    }

    const tokenJson = await tokenRes.json()
    const accessToken = tokenJson.access_token

    // capture order
    const capRes = await fetch(`https://api-m.paypal.com/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    })

    const capJson = await capRes.json()
    if (!capRes.ok) return res.status(502).json({ error: "PayPal capture failed", details: capJson })

    return res.json(capJson)
  } catch (err: any) {
    console.error("PayPal capture error", err)
    return res.status(500).json({ error: "internal" })
  }
}
