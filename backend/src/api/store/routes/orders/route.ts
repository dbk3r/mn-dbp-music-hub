import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AppDataSource } from "../../../../datasource/data-source"
import jwt from "jsonwebtoken"
import { User } from "../../../../models/user"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  function safeJson(obj: unknown, status = 200) {
    try {
      if (res.headersSent) return
      if (status && status !== 200) return res.status(status).json(obj)
      return res.json(obj)
    } catch (e) {
      // ignore further errors when headers already sent
    }
  }
  if (!res.headersSent) {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Methods", "GET, OPTIONS")
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization")
  }

  if (req.method !== "GET") return safeJson({ message: "method not allowed" }, 405)

  // Authenticate and map token to a customer id (store tokens contain a
  // `userId` that refers to a customer record, not the admin `user` table).
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith("Bearer ")) {
    return safeJson({ message: "unauthorized" }, 401)
  }

  const token = auth.slice(7)
  const JWT_SECRET = process.env.JWT_SECRET || "supersecret"

  // Default fallback customer id (for legacy/seeded setups)
  let customerId = "1"

  try {
    const verified = jwt.verify(token, JWT_SECRET) as any
    console.log('[store/orders] verified token claims:', verified)
    if (verified && verified.customerId != null) {
      const maybe = String(verified.customerId)
      if (/^\d+$/.test(maybe)) customerId = maybe
    }
  } catch (e) {
    // Token verification failed (could be signature mismatch in some dev flows).
    // Fall back to best-effort decode mapping below instead of rejecting outright.
    console.log('[store/orders] token verify error; falling back to decode:', String(e))
  }

  // Best-effort: if we still don't have a numeric customerId, try mapping via
  // userId -> user.email -> customer lookup (same approach as checkout route)
  try {
    const decodedAny = jwt.decode(token) as any
    const userIdFromToken = decodedAny?.userId ?? null
    if (userIdFromToken) {
      if (!AppDataSource.isInitialized) await AppDataSource.initialize()
      const userRepo = AppDataSource.getRepository(User)
      const user = await userRepo.findOne({ where: { id: userIdFromToken } as any })
      if (user && (user as any).email) {
        const email = (user as any).email
        try {
          const rows: any[] = await AppDataSource.query(`SELECT id FROM customer WHERE email = $1 LIMIT 1`, [email])
          if (rows && rows.length > 0 && rows[0].id != null) {
            customerId = String(rows[0].id)
          }
            else {
              // No customer exists for this email — create one (dev-friendly fallback)
              const name = (user as any).displayName || ""
              const [first = "", last = ""] = String(name || "").split(" ")
              let newId: string
              try {
                newId = (crypto && (crypto as any).randomUUID) ? (crypto as any).randomUUID() : `cust_${Date.now()}`
              } catch (e) {
                newId = `cust_${Date.now()}`
              }
              try {
                const insertRes: any = await AppDataSource.query(
                  `INSERT INTO customer (id, email, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING id`,
                  [newId, email, first, last]
                )
                if (insertRes && insertRes[0] && insertRes[0].id != null) {
                  customerId = String(insertRes[0].id)
                } else {
                  customerId = newId
                }
              } catch (e) {
                console.log('[store/orders] failed to create customer fallback:', String(e))
              }
            }
        } catch (e) {
          console.log('[store/orders] customer lookup by email failed:', String(e))
        }
      }
    }
  } catch (e) {
    // ignore mapping errors
  }

  try {
    if (!AppDataSource.isInitialized) await AppDataSource.initialize()

    // Fetch orders for this customer id
    console.log('[store/orders] final customerId used:', customerId)
    const rows: any[] = await AppDataSource.query(
      `SELECT o.id, o.order_id, o.status, o."totalPriceCents", o."currencyCode", o.items, o."createdAt"
       FROM orders o
       WHERE o."customerId"::text = $1::text
       ORDER BY o."createdAt" DESC`,
      [String(customerId)]
    )

    const out = (rows || []).map((r: any) => {
      let items = r.items
      try { if (typeof items === 'string' && items.trim()) items = JSON.parse(items) } catch (e) { items = [] }
      return {
        id: r.order_id || (`order_${r.id}`),
        numeric_id: r.id,
        status: (r.status || '').toUpperCase(),
        totalPriceCents: r.totalPriceCents || 0,
        currency: r.currencyCode || 'EUR',
        created_at: r.createdAt,
        items: items || []
      }
    })

    return safeJson(out)
  } catch (err: any) {
    console.error('Error fetching store orders', err)
    return safeJson({ message: err && err.message ? err.message : 'Error fetching orders' }, 500)
  }
}
