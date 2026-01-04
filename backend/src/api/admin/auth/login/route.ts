import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { AppDataSource } from "../../../../datasource/data-source"
import { User } from "../../../../models/user"

async function readJsonBody(req: MedusaRequest): Promise<any> {
  const chunks: Buffer[] = []
  for await (const chunk of req as any) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  const raw = Buffer.concat(chunks).toString("utf8")
  if (!raw.trim()) return {}
  return JSON.parse(raw)
}

const JWT_SECRET = process.env.JWT_SECRET || "supersecret"

export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) {
  return res.sendStatus(200)
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {

  // Parse body once
  let body: any = req.body
  if (!body || Object.keys(body).length === 0) {
    body = await readJsonBody(req).catch(() => ({}))
  }

  const { email, password } = body as { email?: string; password?: string }
  console.log("DEBUG admin/login body:", { email })

  // Short-term: try forwarding to compatible custom admin login endpoint first
  try {
    const backendInternal = process.env.MEDUSA_BACKEND_INTERNAL_URL || "http://localhost:9000"
    if (email && password) {
      const forwardRes = await fetch(`${backendInternal}/custom/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      // If the custom endpoint responded, return that response directly
      if (forwardRes) {
        const contentType = forwardRes.headers.get("content-type") || ""
        if (contentType.includes("application/json")) {
          const data = await forwardRes.json()
          return res.status(forwardRes.status).json(data)
        }
        const text = await forwardRes.text()
        return res.status(forwardRes.status).send(text)
      }
    }
  } catch (err) {
    console.error("admin/login forward error:", err)
  }

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ message: "email and password required" })
  }

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  const repo = AppDataSource.getRepository(User)
  const user = await repo.findOne({
    where: { email: String(email).toLowerCase().trim() } as any,
    relations: ["roles"]
  })
  console.log("DEBUG admin/login user found:", !!user, user && user.id)

  if (!user) {
    return res.status(401).json({ message: "invalid credentials" })
  }

  const valid = await bcrypt.compare(String(password), user.passwordHash)
  console.log("DEBUG admin/login password valid:", valid)
  if (!valid) {
    return res.status(401).json({ message: "invalid credentials" })
  }

  if (!user.isActive) {
    return res.status(403).json({ message: "account not activated yet" })
  }

  const userWithPermissions = await repo.findOne({
    where: { id: user.id } as any,
    relations: ["roles", "roles.permissions"]
  })

  if (!userWithPermissions) {
    return res.status(401).json({ message: "invalid credentials" })
  }

  if (userWithPermissions.mfaEnabled) {
    const tempToken = jwt.sign({ userId: userWithPermissions.id, mfaPending: true }, JWT_SECRET, { expiresIn: "5m" })
    return res.json({ mfa_required: true, temp_token: tempToken })
  }

  const token = jwt.sign({
    userId: userWithPermissions.id,
    email: userWithPermissions.email,
    roles: userWithPermissions.roles.map(r => ({
      name: r.name,
      permissions: r.permissions.map(p => ({ resource: p.resource, action: p.action }))
    }))
  }, JWT_SECRET, { expiresIn: "7d" })

  return res.json({
    token,
    user: {
      id: userWithPermissions.id,
      email: userWithPermissions.email,
      display_name: userWithPermissions.displayName,
      avatar_url: userWithPermissions.avatarUrl,
      mfa_enabled: userWithPermissions.mfaEnabled,
    },
  })
}
