import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import { AppDataSource } from "../../../../datasource/data-source"
import { User } from "../../../../models/user"

const JWT_SECRET = process.env.JWT_SECRET || "supersecret"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  // verify temp token + otp (used by frontend/admin proxies)
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization")

  if (!AppDataSource.isInitialized) await AppDataSource.initialize()

  const body = (req as any).body || {}
  const tempToken = body.temp_token
  const otp = body.otp || body.pin

  if (!tempToken || !otp) return res.status(400).json({ message: "missing temp_token or otp" })

  let decoded: any
  try {
    decoded = jwt.verify(String(tempToken), JWT_SECRET)
  } catch (err) {
    return res.status(400).json({ message: "invalid temp_token" })
  }

  if (!decoded || !decoded.userId || !decoded.mfaPending) {
    return res.status(400).json({ message: "invalid temp_token payload" })
  }

  const repo = AppDataSource.getRepository(User)
  const user = await repo.findOne({ where: { id: decoded.userId } as any, relations: ["roles"] })
  if (!user) return res.status(404).json({ message: "user not found" })

  if (!user.mfaPinHash || !user.mfaPinExpiresAt) return res.status(400).json({ message: "no pin started" })
  if (new Date(user.mfaPinExpiresAt).getTime() < Date.now()) return res.status(400).json({ message: "pin expired" })

  const match = await bcrypt.compare(String(otp), user.mfaPinHash)
  if (!match) return res.status(400).json({ message: "invalid pin" })

  // clear one-time pin
  user.mfaPinHash = null
  user.mfaPinExpiresAt = null
  await repo.save(user as any)

  // Issue final token (include roles when present)
  const token = jwt.sign({
    userId: user.id,
    email: user.email,
    roles: (user as any).roles ? (user as any).roles.map((r: any) => ({ name: r.name })) : undefined,
  }, JWT_SECRET, { expiresIn: "7d" })

  return res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      display_name: (user as any).displayName,
      avatar_url: (user as any).avatarUrl,
      mfa_enabled: user.mfaEnabled,
    }
  })
}
