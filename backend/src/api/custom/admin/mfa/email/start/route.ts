import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AppDataSource } from "../../../../../../datasource/data-source"
import { User } from "../../../../../../models/user"
import bcrypt from "bcrypt"
import { sendPinMail } from "../../../../../../services/mail-service"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  // start: generate PIN, save hash+expiry, send mail
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

  const pin = String(Math.floor(100000 + Math.random() * 900000)) // 6-digit
  const pinHash = await bcrypt.hash(pin, 10)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  user.mfaPinHash = pinHash
  user.mfaPinExpiresAt = expiresAt

  await repo.save(user as any)

  // send email and return info; surface errors
  try {
    const info = await sendPinMail(user.email, pin)
    console.log('[mfa/email/start] mail info:', info)
    return res.json({ ok: true, expires_at: expiresAt, messageId: info.messageId, response: info.response })
  } catch (err: any) {
    console.error('sendPinMail failed', err)
    return res.status(500).json({ message: 'failed to send pin', error: String(err && err.message) })
  }
}
