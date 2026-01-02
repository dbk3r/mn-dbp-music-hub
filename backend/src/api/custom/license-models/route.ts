import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AppDataSource } from "../../../datasource/data-source"
import { LicenseModel } from "../../../models/license-model"
import { setStoreCors } from "../audio/_cors"

export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) {
  setStoreCors(req, res)
  return res.sendStatus(200)
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  setStoreCors(req, res)

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  const repo = AppDataSource.getRepository(LicenseModel)
  const rows = await repo.find({ order: { id: "DESC" } as any })

  return res.json(
    rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      price_cents: r.priceCents,
    }))
  )
}
