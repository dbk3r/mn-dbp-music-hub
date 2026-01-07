import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import jwt from "jsonwebtoken"
import CustomerService from "../../../../services/customer-service"
import { sendActivationEmail } from "../../../../services/mail-service"

async function readJsonBody(req: MedusaRequest): Promise<any> {
  const chunks: Buffer[] = []
  for await (const chunk of req as any) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  const raw = Buffer.concat(chunks).toString("utf8")
  if (!raw.trim()) return {}
  return JSON.parse(raw)
}

export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization")
  return res.sendStatus(200)
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization")

  // Try req.body first, fallback to manual parsing
  let body = (req as any).body || {}
  if (!body || Object.keys(body).length === 0) {
    body = await readJsonBody(req).catch(() => ({}))
  }

  const { email, password, first_name, last_name } = body as any

  try {
    console.log('/custom/auth/register called for', { email })
  } catch (e) {}

  const password_confirm = (body as any).password_confirm || (body as any).passwordConfirm

  if (!email || !password) {
    return res.status(400).json({ message: "email and password required" })
  }

  if (String(password).length < 5) {
    return res.status(400).json({ message: "password must be at least 5 characters" })
  }

  if (password !== password_confirm) {
    return res.status(400).json({ message: "password confirmation does not match" })
  }

  try {
    // Resolve customerService from request scope so we use the framework service
    const scopeReq: any = req as any
    let customerService: any = null
    if (scopeReq?.scope && typeof scopeReq.scope.resolve === 'function') {
      try {
        customerService = scopeReq.scope.resolve("customerService")
      } catch (e) {
        // ignore resolution errors and fallback to local implementation
        customerService = null
      }
    }
    // Fallback: if not registered in container, instantiate local implementation
    if (!customerService) {
      customerService = new CustomerService()
    }

    // ensure email not already registered
    const existing = await customerService.retrieveByEmail(email).catch(() => null)
    if (existing) {
      return res.status(400).json({ message: "email already registered" })
    }

    // create inactive user; activation via email
    const customer = await customerService.create({
      email,
      password,
      first_name: first_name || null,
      last_name: last_name || null,
      isActive: false,
    })

    // create activation token
    const JWT_SECRET = process.env.JWT_SECRET || "supersecret"
    const token = jwt.sign({ userId: (customer as any).id, action: 'activate' }, JWT_SECRET, { expiresIn: '24h' })

    // send activation email
    try {
      await sendActivationEmail(email, token)
    } catch (e) {
      console.error("failed to send activation email", e)
    }

    return res.status(201).json({ ok: true, status: 'pending_activation' })
  } catch (err: any) {
    console.error("/custom/auth/register error:", err)
    return res.status(500).json({ message: err?.message || "failed to create customer" })
  }
}

export {}
