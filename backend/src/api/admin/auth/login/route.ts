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

  // Forwarding to /custom/admin/auth/login temporarily disabled for debugging.
  // Use local DB-backed authentication below.

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

  // Extra debug: show stored hash length (do not log full hash in production)
  try {
    console.log("DEBUG admin/login stored passwordHash length:", user && user.passwordHash ? user.passwordHash.length : null)
  } catch (e) {
    console.log("DEBUG admin/login could not read passwordHash", e)
  }

  if (!user) {
    return res.status(401).json({ message: "invalid credentials" })
  }

  let valid = false
  try {
    valid = await bcrypt.compare(String(password), user.passwordHash)
    console.log("DEBUG admin/login password valid:", valid)
  } catch (err) {
    console.error("DEBUG admin/login bcrypt.compare error:", err)
    return res.status(500).json({ message: "internal auth error" })
  }
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
      // expose roles and admin flag so frontend can treat admin users like customers
      roles: userWithPermissions.roles ? userWithPermissions.roles.map(r => r.name) : [],
      is_admin: Array.isArray(userWithPermissions.roles) && userWithPermissions.roles.some(r => /admin/i.test(r.name)),
    },
  })
}
