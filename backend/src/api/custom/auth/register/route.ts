import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import bcrypt from "bcrypt"
import { setStoreCors } from "../audio/_cors"
import { AppDataSource } from "../../../datasource/data-source"
import { User } from "../../../models/user"

async function readJsonBody(req: MedusaRequest): Promise<any> {
  const chunks: Buffer[] = []
  for await (const chunk of req as any) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  const raw = Buffer.concat(chunks).toString("utf8")
  if (!raw.trim()) return null
  return JSON.parse(raw)
}

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

  const email = String(body.email).toLowerCase().trim()
  const password = String(body.password)

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  const repo = AppDataSource.getRepository(User)
  const existing = await repo.findOne({ where: { email } as any })

  if (existing) {
    return res.status(409).json({ message: "email already registered" })
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const user = repo.create({
    email,
    passwordHash,
    displayName: body.display_name ?? null,
    avatarUrl: null,
    mfaEnabled: false,
    mfaSecret: null,
    status: "active",
  })

  await repo.save(user)

  return res.json({
    id: user.id,
    email: user.email,
    display_name: user.displayName,
  })
}
