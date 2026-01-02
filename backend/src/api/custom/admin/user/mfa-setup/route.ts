import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import jwt from "jsonwebtoken"
import { authenticator } from "otplib"
import QRCode from "qrcode"
import { setAdminCors } from "../../_utils"
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
  setAdminCors(res)
  return res.sendStatus(200)
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  setAdminCors(res)

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

  const secret = authenticator.generateSecret()
  const otpauth = authenticator.keyuri(user.email, "DBP Music Hub", secret)
  const qrDataUrl = await QRCode.toDataURL(otpauth)

  return res.json({
    secret,
    qr_code: qrDataUrl,
    otpauth_url: otpauth,
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

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  setAdminCors(res)

  const userId = getUserFromToken(req)
  if (!userId) {
    return res.status(401).json({ message: "unauthorized" })
  }

  const body = await readJsonBody(req).catch(() => null)
  if (!body || !body.secret || !body.otp) {
    return res.status(400).json({ message: "secret and otp required" })
  }

  const valid = authenticator.check(String(body.otp), String(body.secret))
  if (!valid) {
    return res.status(400).json({ message: "invalid otp" })
  }

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  const repo = AppDataSource.getRepository(User)
  const user = await repo.findOne({ where: { id: userId } as any })

  if (!user) {
    return res.status(404).json({ message: "user not found" })
  }

  user.mfaEnabled = true
  user.mfaSecret = String(body.secret)

  await repo.save(user)

  return res.json({ success: true, mfa_enabled: true })
}
