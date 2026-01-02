import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { setStoreCors } from "../../audio/_cors"
import { AppDataSource } from "../../../../datasource/data-source"
import { User } from "../../../../models/user"

async function readJsonBody(req: MedusaRequest): Promise<any> {
  const chunks: Buffer[] = []
  for await (const chunk of req as any) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  const raw = Buffer.concat(chunks).toString("utf8")
  if (!raw.trim()) return null
  return JSON.parse(raw)
}

const JWT_SECRET = process.env.JWT_SECRET || "supersecret"

export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) {
  setStoreCors(req, res)
  return res.sendStatus(200)
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  setStoreCors(req, res)

  const body = await readJsonBody(req).catch(() => null)
  if (!body || !body.email || !body.password) {
    return res.status(400).json({ message: "email and password required" })
  }

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  const repo = AppDataSource.getRepository(User)
  const user = await repo.findOne({ where: { email: String(body.email).toLowerCase().trim() } as any })

  if (!user) {
    return res.status(401).json({ message: "invalid credentials" })
  }

  const valid = await bcrypt.compare(String(body.password), user.passwordHash)
  if (!valid) {
    return res.status(401).json({ message: "invalid credentials" })
  }

  if (user.mfaEnabled) {
    const tempToken = jwt.sign({ userId: user.id, mfaPending: true }, JWT_SECRET, { expiresIn: "5m" })
    return res.json({ mfa_required: true, temp_token: tempToken })
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" })

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
