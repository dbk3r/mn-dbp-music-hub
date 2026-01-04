import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AppDataSource } from "../../../datasource/data-source"
import { LicenseModel } from "../../../models/license-model"

export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization");
  return res.sendStatus(200)
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization");

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  const repo = AppDataSource.getRepository(LicenseModel)
  const rows = await repo.find({ order: { id: "DESC" } as any })

  return res.json({
    items: rows.map((r) => ({
      id: r.id,
      name: r.name,
      icon: r.icon,
      description: r.description,
      priceCents: r.priceCents,
      legalDescription: r.legalDescription,
    }))
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization");

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  const body = req.body as any
  if (!body?.name) {
    return res.status(400).json({ message: "Name is required" })
  }

  const repo = AppDataSource.getRepository(LicenseModel)
  const model = repo.create({
    name: body.name,
    icon: body.icon || null,
    description: body.description || null,
    priceCents: body.priceCents || 0,
    legalDescription: body.legalDescription || null,
  })

  await repo.save(model)

  return res.json({
    id: model.id,
    name: model.name,
    icon: model.icon,
    description: model.description,
    priceCents: model.priceCents,
    legalDescription: model.legalDescription,
  })
}
