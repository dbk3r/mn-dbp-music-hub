import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import jwt from "jsonwebtoken"
import { AppDataSource } from "../../../../datasource/data-source"
import { User } from "../../../../models/user"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type")

  const token = (req as any).query?.token || (req as any).body?.token
  if (!token) return res.status(400).json({ message: "missing token" })

  const JWT_SECRET = process.env.JWT_SECRET || "supersecret"
  try {
    const decoded = jwt.verify(String(token), JWT_SECRET) as any
    if (!decoded || decoded.action !== 'activate' || !decoded.userId) {
      return res.status(400).json({ message: "invalid token" })
    }

    if (!AppDataSource.isInitialized) await AppDataSource.initialize()
    const repo = AppDataSource.getRepository(User)
    const user = await repo.findOne({ where: { id: decoded.userId } } as any)
    if (!user) return res.status(404).json({ message: "user not found" })

    user.isActive = true
    await repo.save(user as any)

    return res.json({ ok: true })
  } catch (err: any) {
    console.error("activation error", err)
    return res.status(400).json({ message: "invalid or expired token" })
  }
}

export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type")
  return res.sendStatus(200)
}

export {}
