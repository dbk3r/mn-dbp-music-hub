import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import jwt from "jsonwebtoken"
import { setStoreCors } from "../../audio/_cors"
import { AppDataSource } from "../../../../datasource/data-source"
import { User } from "../../../../models/user"

const JWT_SECRET = process.env.JWT_SECRET || "supersecret"

function getUserFromToken(req: MedusaRequest): number | null {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith("Bearer ")) return null

  const token = auth.slice(7)
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return decoded.userId ?? null
  } catch {
    return null
  }
}

export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) {
  setStoreCors(req, res)
  return res.sendStatus(200)
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  setStoreCors(req, res)

  const userId = getUserFromToken(req)
  if (!userId) {
    return res.status(401).json({ message: "unauthorized" })
  }

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  const repo = AppDataSource.getRepository(User)
  const user = await repo.findOne({ where: { id: userId } as any })

  if (!user) {
    return res.status(404).json({ message: "user not found" })
  }

  return res.json({
    id: user.id,
    email: user.email,
    display_name: user.displayName,
    avatar_url: user.avatarUrl,
    mfa_enabled: user.mfaEnabled,
    status: user.status,
  })
}

async function readJsonBody(req: MedusaRequest): Promise<any> {
  const chunks: Buffer[] = []
  for await (const chunk of req as any) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  const raw = Buffer.concat(chunks).toString("utf8")
  if (!raw.trim()) return null
  return JSON.parse(raw)
}

export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  setStoreCors(req, res)

  const userId = getUserFromToken(req)
  if (!userId) {
    return res.status(401).json({ message: "unauthorized" })
  }

  const body = await readJsonBody(req).catch(() => null)
  if (!body) {
    return res.status(400).json({ message: "invalid body" })
  }

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  const repo = AppDataSource.getRepository(User)
  const user = await repo.findOne({ where: { id: userId } as any })

  if (!user) {
    return res.status(404).json({ message: "user not found" })
  }

  if (body.display_name != null) user.displayName = String(body.display_name) || null
  if (body.avatar_url != null) user.avatarUrl = String(body.avatar_url) || null

  await repo.save(user)

  return res.json({
    id: user.id,
    email: user.email,
    display_name: user.displayName,
    avatar_url: user.avatarUrl,
    mfa_enabled: user.mfaEnabled,
  })
}
