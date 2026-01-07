import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AppDataSource } from "../../../../datasource/data-source"
import { Order } from "../../../../models/order"
import jwt from "jsonwebtoken"
import { requireAdmin } from "../../../middlewares/auth"

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
        // set a temporary field so requireAdmin can reuse verification
        ;(req as any).__decoded_jwt = decoded
        accepted = true
      } catch (err) {
        return res.status(401).json({ message: "invalid token" })
      }
    }
  }
  // If accepted via service token, allow. Otherwise enforce admin role.
  if (!(serviceToken && bearer === serviceToken)) {
    // reuse requireAdmin which verifies token again; but if we have decoded JWT already, stash userId
    const ok = await requireAdmin(req as any, res as any)
    if (!ok) return
  }
  if (!AppDataSource.isInitialized) await AppDataSource.initialize()
  try {
    // Fetch orders joined with customer info and return buyer name/email and
    // purchased product titles. Use raw SQL for a stable shape that works
    // independently of TypeORM mapping issues.
    const rows: any[] = await AppDataSource.query(`
      SELECT o.id, o.order_id, o.status, o."totalPriceCents", o."currencyCode", o.items, o."createdAt",
             c.email as customer_email, c.first_name as customer_first_name, c.last_name as customer_last_name
      FROM orders o
      LEFT JOIN customer c ON c.id::text = o."customerId"::text
      ORDER BY o."createdAt" DESC
    `)

    const finalOrders = (rows || []).map((r: any) => {
      let items = r.items
      try {
        if (typeof items === 'string' && items.trim()) items = JSON.parse(items)
      } catch (e) {
        items = []
      }
      const productTitles = Array.isArray(items) ? items.map((it: any) => it.title).filter(Boolean) : []
      return {
        id: r.order_id || (`order_${r.id}`),
        numeric_id: r.id,
        status: (r.status || '').toUpperCase(),
        totalPriceCents: r.totalPriceCents || 0,
        currencyCode: r.currencyCode || 'EUR',
        customer_email: r.customer_email || null,
        customer_name: [r.customer_first_name, r.customer_last_name].filter(Boolean).join(' ') || null,
        createdAt: r.createdAt,
        items: items || [],
        product_titles: productTitles,
      }
    })

    // Map to admin-friendly shape including buyer name/email and product titles
    const out = (finalOrders || []).map((o: any) => ({
      id: `order_${o.id}`,
      status: (o.status && typeof o.status === 'string') ? o.status.toUpperCase() : null,
      totalPriceCents: o.totalPriceCents || o.totalpricecents || 0,
      currency: o.currencyCode || o.currencycode || 'EUR',
      customer_email: o.customer_email || null,
      customer_name: o.customer_name || null,
      product_titles: Array.isArray(o.product_titles) ? o.product_titles : (o.product_titles ? String(o.product_titles).split(',').map((s: string) => s.trim()) : []),
      created_at: o.createdAt || o.createdat || null,
      items: o.items || []
    }))

    return res.json(out)
  } catch (err: any) {
    console.error('Error fetching orders', err)
    return res.status(500).json({ message: err.message || 'Error fetching orders' })
  }
}
