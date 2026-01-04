import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AppDataSource } from "../../../../../../datasource/data-source"
import { User } from "../../../../../../models/user"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  // disable MFA
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

  user.mfaEnabled = false
  user.mfaPinHash = null
  user.mfaPinExpiresAt = null

  await repo.save(user as any)

  return res.json({ ok: true })
}
