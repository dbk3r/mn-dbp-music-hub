import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { setStoreCors } from "../../../audio/_cors"
import { AppDataSource } from "../../../../../datasource/data-source"
import { User } from "../../../../../models/user"

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
  setStoreCors(req, res)
  return res.sendStatus(200)
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  setStoreCors(req, res)

  // Try req.body first, fallback to manual parsing
  let body = req.body
  if (!body || Object.keys(body).length === 0) {
    body = await readJsonBody(req).catch(() => ({}))
  }

  const { email, password } = body as { email?: string; password?: string }

  if (!email || !password) {
    return res.status(400).json({ message: "email and password required" })
  }

  const normalizedEmail = String(email).toLowerCase().trim()
  const passwordStr = String(password).trim()

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  const repo = AppDataSource.getRepository(User)
  const user = await repo.findOne({
    where: { email: normalizedEmail } as any,
    relations: ["roles"]
  })

  if (!user) {
    console.log(`User not found for email: ${normalizedEmail}`)
    return res.status(401).json({ message: "invalid credentials" })
  }

  if (!user.isActive) {
    console.log(`User ${user.email} is not active`)
    return res.status(403).json({ message: "account not activated" })
  }

  // Check if user has admin role
  const hasAdminRole = user.roles.some(role => role.name === "admin")
  if (!hasAdminRole) {
    console.log(`User ${user.email} does not have admin role. Roles:`, user.roles.map(r => r.name))
    return res.status(403).json({ message: "insufficient permissions" })
  }

  // Verify password
  const passwordMatch = await bcrypt.compare(passwordStr, user.passwordHash)
  if (!passwordMatch) {
    console.log(`Password mismatch for user ${user.email}`)
    return res.status(401).json({ message: "invalid credentials" })
  }

  // For now, skip MFA for admin login
  // Respect MFA: if enabled, return a short-lived temp token for verification
  if (user.mfaEnabled) {
    const tempToken = jwt.sign({ userId: user.id, mfaPending: true }, JWT_SECRET, { expiresIn: "5m" })
    return res.json({
      mfa_required: true,
      temp_token: tempToken,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.displayName,
      },
    })
  }

  const token = jwt.sign({ 
    userId: user.id,
    roles: user.roles,
    email: user.email,
    displayName: user.displayName
  }, JWT_SECRET, { expiresIn: "7d" })

  return res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      display_name: user.displayName,
      avatar_url: user.avatarUrl,
      mfa_enabled: user.mfaEnabled,
    },
  })
}