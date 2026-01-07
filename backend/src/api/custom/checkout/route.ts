import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AppDataSource } from "../../../datasource/data-source"
import jwt from "jsonwebtoken"
import crypto from "crypto"
import { User } from "../../../models/user"
import { In } from "typeorm"
import { AudioFile } from "../../../models/audio-file"
import { LicenseModel } from "../../../models/license-model"
import { Order, OrderStatus } from "../../../models/order"
import { setStoreCors } from "../audio/_cors"

async function readJsonBody(req: MedusaRequest): Promise<{ raw: string; parsed: any } | null> {
  const chunks: Buffer[] = []
  for await (const chunk of req as any) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  const raw = Buffer.concat(chunks).toString("utf8")
  if (!raw.trim()) return null
  try {
    return { raw, parsed: JSON.parse(raw) }
  } catch (err) {
    return { raw, parsed: null }
  }
}

export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) {
  setStoreCors(req, res)
  return res.sendStatus(200)
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  setStoreCors(req, res)

  // Check authentication
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "authentication required" })
  }

  const token = authHeader.substring(7)
  const JWT_SECRET = process.env.JWT_SECRET || "supersecret"

  // Try to decode JWT and map to a customer. There is no direct user->customer mapping
  // in the DB, so use the seeded customer with id 1 for authenticated store users.
  let customerId = "1"
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    // If a customer id claim is present and looks numeric, prefer that
    if (decoded && decoded.customerId != null) {
      const maybe = String(decoded.customerId)
      if (/^\d+$/.test(maybe)) customerId = maybe
    }
  } catch (err) {
    // invalid token -> unauthorized
    return res.status(401).json({ message: "invalid token" })
  }

  // Try to map authenticated user -> customer by email.
  // 1) decode userId from token (most tokens include `userId`)
  // 2) look up User in `user` table, get email
  // 3) try to find a customer with that email, create one if missing
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
          // try to find existing customer by email
          const rows: any[] = await AppDataSource.query(`SELECT id FROM customer WHERE email = $1 LIMIT 1`, [email])
          if (rows && rows.length > 0 && rows[0].id != null) {
            customerId = String(rows[0].id)
          } else {
            // create customer with email and optional names
            const name = (user as any).displayName || ""
            const [first = "", last = ""] = name.split(" ")
            // generate an id in the app to avoid DB type/sequence issues
            let newId: string
            try {
              newId = (crypto && (crypto as any).randomUUID) ? (crypto as any).randomUUID() : `cust_${Date.now()}`
            } catch (e) {
              newId = `cust_${Date.now()}`
            }

            const insertRes: any = await AppDataSource.query(
              `INSERT INTO customer (id, email, first_name, last_name)
               VALUES ($1, $2, $3, $4)
               RETURNING id`,
              [newId, email, first, last]
            )
            if (insertRes && insertRes[0] && insertRes[0].id != null) {
              customerId = String(insertRes[0].id)
            } else {
              customerId = newId
            }
          }
        } catch (err) {
          // If queries fail (schema differences), keep using fallback customerId
          // eslint-disable-next-line no-console
          console.log("[checkout] customer lookup/create failed:", String(err))
        }
      }
    }
  } catch (err) {
    // best-effort mapping; ignore errors and continue with fallback
    // eslint-disable-next-line no-console
    console.log("[checkout] user->customer mapping error:", String(err))
  }

  // If still using fallback customerId, try to map by email claim in the token
  try {
    if (!customerId || customerId === "1") {
      const verified = jwt.verify(token, JWT_SECRET) as any
      const tokenEmail = (verified && (verified.email || verified.emailAddress)) ? String(verified.email || verified.emailAddress) : null
      if (tokenEmail) {
        if (!AppDataSource.isInitialized) await AppDataSource.initialize()
        try {
          const rows: any[] = await AppDataSource.query(`SELECT id FROM customer WHERE lower(email) = lower($1) LIMIT 1`, [tokenEmail])
          if (rows && rows.length > 0 && rows[0].id != null) {
            customerId = String(rows[0].id)
          } else {
            const name = (verified && verified.display_name) || (verified && verified.displayName) || ""
            const [first = "", last = ""] = String(name || "").split(" ")
            let newId: string
            try {
              newId = (crypto && (crypto as any).randomUUID) ? (crypto as any).randomUUID() : `cust_${Date.now()}`
            } catch (e) {
              newId = `cust_${Date.now()}`
            }
            const insertRes: any = await AppDataSource.query(
              `INSERT INTO customer (id, email, first_name, last_name)
               VALUES ($1, $2, $3, $4)
               RETURNING id`,
              [newId, tokenEmail, first, last]
            )
            if (insertRes && insertRes[0] && insertRes[0].id != null) {
              customerId = String(insertRes[0].id)
            } else {
              customerId = newId
            }
          }
        } catch (e) {
          // ignore errors, keep fallback
          console.log('[checkout] token-email customer lookup/create failed:', String(e))
        }
      }
    }
  } catch (e) {
    // ignore verification errors here — best-effort
  }

  // Debug: log headers for incoming request
  // eslint-disable-next-line no-console
  console.log("[checkout] method:", req.method, "url:", req.url)
  // eslint-disable-next-line no-console
  console.log("[checkout] headers:", JSON.stringify(req.headers || {}))
  // eslint-disable-next-line no-console
  console.log("[checkout] readableEnded:", (req as any).readableEnded, "readable:", (req as any).readable)

  const bodyRes = await readJsonBody(req).catch((e) => {
    // eslint-disable-next-line no-console
    console.log("[checkout] readJsonBody threw:", String(e))
    return null
  })

  // Debug: log what readJsonBody returned
  // eslint-disable-next-line no-console
  console.log("[checkout] readJsonBody result:", JSON.stringify(bodyRes))

  // Prefer framework-parsed body if present (some middleware may have consumed the stream)
  let body: any = null
  try {
    if (req && (req as any).body && Object.keys((req as any).body).length > 0) {
      body = (req as any).body
      // eslint-disable-next-line no-console
      console.log("[checkout] using req.body from framework:", JSON.stringify(body))
    } else {
      body = bodyRes ? (bodyRes as any).parsed ?? null : null
      if (bodyRes && (bodyRes as any).raw) {
        // eslint-disable-next-line no-console
        console.log("[checkout] raw body:", (bodyRes as any).raw)
      } else {
        // eslint-disable-next-line no-console
        console.log("[checkout] no raw body received from stream and no req.body present")
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log("[checkout] error while reading req.body:", String(err))
  }

  const items = Array.isArray(body?.items) ? body.items : []

  if (!items.length) {
    return res.status(400).json({ message: "items required" })
  }

  const normalized = items
    .map((it: any) => ({
      audioId: Number(it.audio_id ?? it.audioId),
      licenseModelId: Number(it.license_model_id ?? it.licenseModelId),
    }))
    .filter((it: any) => Number.isFinite(it.audioId) && Number.isFinite(it.licenseModelId))
    .map((it: any) => ({ audioId: Math.trunc(it.audioId), licenseModelId: Math.trunc(it.licenseModelId) }))

  if (!normalized.length) {
    return res.status(400).json({ message: "invalid items" })
  }

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  const audioRepo = AppDataSource.getRepository(AudioFile)
  const licenseRepo = AppDataSource.getRepository(LicenseModel)
  const orderRepo = AppDataSource.getRepository(Order)

  const audioIds = Array.from(new Set(normalized.map((i) => i.audioId)))
  const licenseIds = Array.from(new Set(normalized.map((i) => i.licenseModelId)))

  const [audios, licenses] = await Promise.all([
    audioRepo.findBy({ id: In(audioIds) } as any),
    licenseRepo.findBy({ id: In(licenseIds) } as any),
  ])

  const audioById = new Map(audios.map((a) => [a.id, a]))
  const licenseById = new Map(licenses.map((l) => [l.id, l]))

  const detailed: Array<{
    audio_id: number
    title: string
    license_model_id: number
    license_model_name: string
    price_cents: number
  }> = []

  let totalPriceCents = 0

  for (const it of normalized) {
    const audio = audioById.get(it.audioId)
    const license = licenseById.get(it.licenseModelId)

    if (!audio || !license) {
      return res.status(400).json({ message: "unknown audio or license model" })
    }

    const allowed = Array.isArray(audio.licenseModelIds)
      ? audio.licenseModelIds.map((x) => Number(x)).filter((n) => Number.isFinite(n)).map((n) => Math.trunc(n))
      : []

    if (!allowed.includes(license.id)) {
      return res.status(400).json({ message: "license model not allowed for audio" })
    }

    const priceCents = Number(license.priceCents)
    if (!Number.isFinite(priceCents) || priceCents < 0) {
      return res.status(400).json({ message: "invalid license price" })
    }

    detailed.push({
      audio_id: audio.id,
      title: audio.title,
      license_model_id: license.id,
      license_model_name: license.name,
      price_cents: Math.trunc(priceCents),
    })

    totalPriceCents += Math.trunc(priceCents)
  }

  // Create order with authenticated customer
  // Ensure sequence and column for server-side order id generation
  try {
    await AppDataSource.query(`CREATE SEQUENCE IF NOT EXISTS orders_seq`)
    await AppDataSource.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_id varchar`)
  } catch (e) {
    console.log('[checkout] ensure seq/column failed', String(e))
  }

  // get next sequence value
  let seqVal = 0
  try {
    const rows: any[] = await AppDataSource.query(`SELECT nextval('orders_seq') as v`)
    if (rows && rows[0] && rows[0].v != null) seqVal = Number(rows[0].v)
  } catch (e) {
    console.log('[checkout] nextval failed', String(e))
  }

  const now = new Date()
  const dd = String(now.getDate()).padStart(2, '0')
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const yyyy = String(now.getFullYear())
  const orderId = `${dd}${mm}${yyyy}_${seqVal}`

  // Orders mit 0€ bekommen sofort status "completed"
  const orderStatus = totalPriceCents === 0 ? OrderStatus.COMPLETED : OrderStatus.PENDING

  // Insert order via raw SQL to include generated order_id (avoid schema migration step)
  try {
    const insertRes: any = await AppDataSource.query(
      `INSERT INTO orders ("customerId", status, "totalPriceCents", "currencyCode", items, "createdAt", "updatedAt", order_id)
       VALUES ($1, $2, $3, $4, $5, now(), now(), $6)
       RETURNING id, order_id`,
      [customerId, orderStatus, totalPriceCents, 'EUR', JSON.stringify(detailed), orderId]
    )
    const created = insertRes && insertRes[0] ? insertRes[0] : null
    return res.json({
      order_id: created ? created.order_id : orderId,
      items: detailed,
      total_price_cents: totalPriceCents,
      currency_code: 'eur',
      status: totalPriceCents === 0 ? 'completed' : 'pending',
    })
  } catch (e) {
    console.log('[checkout] insert failed, falling back to TypeORM save', String(e))
    const order = orderRepo.create({
      customerId,
      status: orderStatus,
      totalPriceCents,
      currencyCode: "EUR",
      items: detailed,
    })
    await orderRepo.save(order)
    return res.json({
      order_id: order.id,
      items: detailed,
      total_price_cents: totalPriceCents,
      currency_code: "eur",
      status: totalPriceCents === 0 ? "completed" : "pending",
    })
  }
}
