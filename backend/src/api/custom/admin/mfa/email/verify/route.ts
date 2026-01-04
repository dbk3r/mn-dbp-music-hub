import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AppDataSource } from "../../../../../../datasource/data-source"
import { User } from "../../../../../../models/user"
import bcrypt from "bcrypt"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  // verify: check pin, enable mfa
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization")

  if (!AppDataSource.isInitialized) await AppDataSource.initialize()

  const body = (req as any).body || {}
  const userId = body.user_id
  const pin = body.pin
  if (!userId || !pin) return res.status(400).json({ message: "missing user_id or pin" })

  const repo = AppDataSource.getRepository(User)
  const user = await repo.findOne({ where: { id: userId } } as any)
  if (!user) return res.status(404).json({ message: "user not found" })

  if (!user.mfaPinHash || !user.mfaPinExpiresAt) return res.status(400).json({ message: "no pin started" })
  if (new Date(user.mfaPinExpiresAt).getTime() < Date.now()) return res.status(400).json({ message: "pin expired" })

  const match = await bcrypt.compare(String(pin), user.mfaPinHash)
  if (!match) return res.status(400).json({ message: "invalid pin" })

  user.mfaEnabled = true
  user.mfaPinHash = null
  user.mfaPinExpiresAt = null

  await repo.save(user as any)

  return res.json({ ok: true })
}
