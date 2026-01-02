import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import jwt from "jsonwebtoken"
import { authenticator } from "otplib"
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

const JWT_SECRET = process.env.JWT_SECRET || "supersecret"

export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) {
  setStoreCors(req, res)
  return res.sendStatus(200)
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  setStoreCors(req, res)

  const body = await readJsonBody(req).catch(() => null)
  if (!body || !body.temp_token || !body.otp) {
    return res.status(400).json({ message: "temp_token and otp required" })
  }

  let decoded: any
  try {
    decoded = jwt.verify(body.temp_token, JWT_SECRET)
  } catch {
    return res.status(401).json({ message: "invalid or expired token" })
  }

  if (!decoded.mfaPending) {
    return res.status(400).json({ message: "not a valid mfa temp token" })
  }

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  const repo = AppDataSource.getRepository(User)
  const user = await repo.findOne({ where: { id: decoded.userId } as any })

  if (!user || !user.mfaEnabled || !user.mfaSecret) {
    return res.status(401).json({ message: "mfa not configured" })
  }

  const valid = authenticator.check(String(body.otp), user.mfaSecret)
  if (!valid) {
    return res.status(401).json({ message: "invalid otp" })
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
