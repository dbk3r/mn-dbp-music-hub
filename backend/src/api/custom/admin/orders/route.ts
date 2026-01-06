import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AppDataSource } from "../../../../datasource/data-source"
import { Order } from "../../../../models/order"
import jwt from "jsonwebtoken"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization")

  const JWT_SECRET = process.env.JWT_SECRET || "supersecret"
  const authHeader = (req.headers.authorization || "") as string

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "unauthorized" })
  }

  const bearer = authHeader.slice(7)
  const serviceToken = process.env.BACKEND_SERVICE_TOKEN
  const serviceKey = process.env.BACKEND_SERVICE_KEY

  if (serviceToken && bearer === serviceToken) {
    // deprecated static token path
  }

  if (!(serviceToken && bearer === serviceToken)) {
    let accepted = false
    // 1) try service JWT signed with BACKEND_SERVICE_KEY
    if (serviceKey) {
      try {
        const decodedSvc = jwt.verify(bearer, serviceKey, { algorithms: ["HS256"] }) as any
        if (decodedSvc && decodedSvc.service === "admin") accepted = true
      } catch (e) {
        // ignore and try next
      }
    }

    // 2) fallback: try user/admin JWT signed with JWT_SECRET
    if (!accepted) {
      try {
        const decoded = jwt.verify(bearer, JWT_SECRET) as any
        if (decoded && decoded.mfaPending) return res.status(401).json({ message: "mfa verification required" })
        accepted = true
      } catch (err) {
        return res.status(401).json({ message: "invalid token" })
      }
    }
  }

  if (!AppDataSource.isInitialized) await AppDataSource.initialize()
  try {
    const repo = AppDataSource.getRepository(Order)
    // Use TypeORM repository to load orders. If there is a genuine mapping
    // issue it should be fixed in the entity definition instead of using
    // raw SQL fallbacks.
    const orders = await repo.find({ order: { createdAt: "DESC" } })
    const count = await repo.count()
    const finalOrders = Array.isArray(orders) ? orders : []

    // Map to admin-friendly shape
    const out = (finalOrders || []).map((o: any) => ({
      id: `order_${o.id}`,
      status: (o.status && typeof o.status === 'string') ? o.status.toUpperCase() : null,
      totalPriceCents: o.totalPriceCents || o.totalpricecents || 0,
      currency: o.currencyCode || o.currencycode || 'EUR',
      customer_email: null,
      created_at: o.createdAt || o.createdat || null,
      items: o.items || []
    }))

    return res.json(out)
  } catch (err: any) {
    console.error('Error fetching orders', err)
    return res.status(500).json({ message: err.message || 'Error fetching orders' })
  }
}
