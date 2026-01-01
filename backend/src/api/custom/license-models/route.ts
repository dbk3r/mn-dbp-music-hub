import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AppDataSource } from "../../../datasource/data-source"
import { LicenseModel } from "../../../models/license-model"

function setCors(req: MedusaRequest, res: MedusaResponse) {
  const allowed = (process.env.STORE_CORS || "http://localhost:3000")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)

  const reqOrigin = String(req.headers.origin || "")
  const origin = (reqOrigin && allowed.includes(reqOrigin) ? reqOrigin : allowed[0])
    ?.trim()

  res.header("Access-Control-Allow-Origin", origin)
  res.header("Vary", "Origin")
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS")
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, x-publishable-api-key"
  )
}

export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) {
  setCors(req, res)
  return res.sendStatus(200)
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  setCors(req, res)

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  const repo = AppDataSource.getRepository(LicenseModel)
  const rows = await repo.find({ select: { name: true } as any })

  const names = Array.from(
    new Set(rows.map((r: any) => String(r.name)).filter(Boolean))
  )

  return res.json(names)
}
