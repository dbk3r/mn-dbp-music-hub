import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AppDataSource } from "../../../../datasource/data-source"
import { LicenseModel } from "../../../../models/license-model"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  console.log("[custom/admin/license-models] auth header:", req.headers.authorization)
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization");

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  const repo = AppDataSource.getRepository(LicenseModel)
  const licenseModels = await repo.find()

  const result = licenseModels.map(lm => ({
    id: lm.id,
    name: lm.name,
    price_cents: lm.priceCents,
  }))

  res.json({ items: result })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  console.log("[custom/admin/license-models] auth header:", req.headers.authorization)
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization");

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  const repo = AppDataSource.getRepository(LicenseModel)
  const body = (req as any).body || {}
  const lm = repo.create({
    name: body.name,
    priceCents: Number(body.priceCents) || 0,
    description: body.description || null,
  } as any)
  const saved = await repo.save(lm as any)
  return res.status(201).json(saved)
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  console.log("[custom/admin/license-models] auth header:", req.headers.authorization)
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization");

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  const id = Number((req as any).params?.id)
  if (!id) return res.status(400).json({ message: "missing id" })

  const repo = AppDataSource.getRepository(LicenseModel)
  const body = (req as any).body || {}
  const lm = await repo.findOne({ where: { id } } as any)
  if (!lm) return res.status(404).json({ message: "not found" })

  if (body.name !== undefined) lm.name = body.name
  if (body.priceCents !== undefined) lm.priceCents = Number(body.priceCents) || 0
  if (body.description !== undefined) lm.description = body.description

  const saved = await repo.save(lm as any)
  return res.json(saved)
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  console.log("[custom/admin/license-models] auth header:", req.headers.authorization)
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization");

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  const id = Number((req as any).params?.id)
  if (!id) return res.status(400).json({ message: "missing id" })

  const repo = AppDataSource.getRepository(LicenseModel)
  await repo.delete({ id } as any)
  return res.json({ ok: true })
}