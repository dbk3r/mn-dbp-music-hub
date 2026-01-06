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
    const { amount } = req.body || {}
    if (!amount) return res.status(400).json({ error: "amount required" })

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

    // create order
    const orderRes = await fetch("https://api-m.paypal.com/v2/checkout/orders", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{ amount: { currency_code: "EUR", value: (amount / 100).toFixed(2) } }],
      }),
    })

    const orderJson = await orderRes.json()
    if (!orderRes.ok) return res.status(502).json({ error: "PayPal create failed", details: orderJson })

    return res.json(orderJson)
  } catch (err: any) {
    console.error("PayPal create error", err)
    return res.status(500).json({ error: "internal" })
  }
}
