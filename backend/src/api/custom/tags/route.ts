import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AppDataSource } from "../../../datasource/data-source"
import { Tag } from "../../../models/tag"

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

  const repo = AppDataSource.getRepository(Tag)
  const rows = await repo.find({ order: { id: "DESC" } as any })

  return res.json({
    items: rows.map(r => ({ id: r.id, name: r.name }))
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  setCors(req, res)

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  const body = req.body as any
  if (!body?.name) {
    return res.status(400).json({ message: "Name is required" })
  }

  const repo = AppDataSource.getRepository(Tag)
  const item = repo.create({ name: body.name })
  await repo.save(item)

  return res.json({ id: item.id, name: item.name })
}
