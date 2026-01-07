import { defineMiddlewares } from "@medusajs/framework/http"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import jwt from "jsonwebtoken"
import { AppDataSource } from "../datasource/data-source"
import { User } from "../models/user"
import crypto from "crypto"

// Globale CORS-Middleware, die vor allen anderen Middlewares läuft
function corsMiddleware(req: MedusaRequest, res: MedusaResponse, next: () => void) {
  // Setze CORS-Header für alle Requests
  res.header("Access-Control-Allow-Origin", "http://localhost:3000")
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization")
  res.header("Access-Control-Allow-Credentials", "true")

  // OPTIONS-Requests sofort mit 200 OK beantworten
  if (req.method === "OPTIONS") {
    res.status(200).end()
    return
  }

  next()
}

// Middleware: map authenticated user token -> customer id for store routes.
// If no customer exists for the user's email, create one (dev-friendly).
async function mapUserToCustomer(req: MedusaRequest, res: MedusaResponse, next: () => void) {
  try {
    const auth = req.headers.authorization as string | undefined
    const JWT_SECRET = process.env.JWT_SECRET || "supersecret"
    if (!auth || !auth.startsWith("Bearer ")) return next()

    const token = auth.slice(7)
    let decoded: any = null
    try {
      decoded = jwt.verify(token, JWT_SECRET) as any
    } catch (e) {
      // verification failed -> fallback to decode (best-effort)
      try { decoded = jwt.decode(token) as any } catch (err) { decoded = null }
    }

    if (!decoded) return next()

    // If token already carries a numeric customerId, expose it
    if (decoded.customerId != null && /^\d+$/.test(String(decoded.customerId))) {
      req.headers['x-customer-id'] = String(decoded.customerId)
      return next()
    }

    // Try to map userId -> user.email -> customer
    const userId = decoded.userId ?? null
    const tokenEmail = decoded.email || decoded.emailAddress || null
    let email = tokenEmail

    if (!email && userId) {
      if (!AppDataSource.isInitialized) await AppDataSource.initialize()
      const userRepo = AppDataSource.getRepository(User)
      const user = await userRepo.findOne({ where: { id: userId } as any })
      if (user && (user as any).email) email = (user as any).email
    }

    if (!email) return next()

    // Find or create customer by email
    try {
      if (!AppDataSource.isInitialized) await AppDataSource.initialize()
      const rows: any[] = await AppDataSource.query(`SELECT id FROM customer WHERE lower(email)=lower($1) LIMIT 1`, [email])
      if (rows && rows.length > 0 && rows[0].id != null) {
        const cid = String(rows[0].id)
        req.headers['x-customer-id'] = cid
        try { (req as any).auth_context = { actor_id: rows[0].id } } catch (e) {}
        return next()
      }

      // create customer
      let newId: string
      try { newId = (crypto && (crypto as any).randomUUID) ? (crypto as any).randomUUID() : `cust_${Date.now()}` } catch (e) { newId = `cust_${Date.now()}` }
      const name = decoded.display_name || decoded.displayName || ''
      const [first = '', last = ''] = String(name || '').split(' ')
      const insertRes: any = await AppDataSource.query(
        `INSERT INTO customer (id, email, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING id`,
        [newId, email, first, last]
      )
      if (insertRes && insertRes[0] && insertRes[0].id != null) {
        const cid = String(insertRes[0].id)
        req.headers['x-customer-id'] = cid
        try { (req as any).auth_context = { actor_id: insertRes[0].id } } catch (e) {}
      } else {
        req.headers['x-customer-id'] = newId
        try { (req as any).auth_context = { actor_id: newId } } catch (e) {}
      }
    } catch (e) {
      console.log('[mapUserToCustomer] failed to map/create customer:', String(e))
    }
  } catch (e) {
    console.log('[mapUserToCustomer] unexpected error:', String(e))
  } finally {
    return next()
  }
}

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/*",
      middlewares: [
        corsMiddleware,
        mapUserToCustomer,
      ],
    },
  ],
})
