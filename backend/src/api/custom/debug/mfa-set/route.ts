import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { AppDataSource } from "../../../../datasource/data-source"
import { User } from "../../../../models/user"

const JWT_SECRET = process.env.JWT_SECRET || "supersecret"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization")

  if (!AppDataSource.isInitialized) await AppDataSource.initialize()

  const body = (req as any).body || {}
  const userId = body.user_id
  if (!userId) return res.status(400).json({ message: "missing user_id" })

  const repo = AppDataSource.getRepository(User)
  const user = await repo.findOne({ where: { id: userId } } as any)
  if (!user) return res.status(404).json({ message: "user not found" })

  const pin = '123456'
  const pinHash = await bcrypt.hash(pin, 10)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

  user.mfaEnabled = true
  user.mfaPinHash = pinHash
  user.mfaPinExpiresAt = expiresAt
  await repo.save(user as any)

  const tempToken = jwt.sign({ userId: user.id, mfaPending: true }, JWT_SECRET, { expiresIn: "5m" })

  return res.json({ ok: true, user_id: user.id, pin: pin, expires_at: expiresAt, temp_token: tempToken })
}
