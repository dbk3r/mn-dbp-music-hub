import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AppDataSource } from "../../../../../../datasource/data-source"
import { ProductVariant } from "../../../../../../models/product-variant"
import { LicenseModel } from "../../../../../../models/license-model"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  console.log("[custom/admin/products/variants] auth header:", req.headers.authorization)
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PATCH, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization");

  if (!AppDataSource.isInitialized) await AppDataSource.initialize()

  const { id } = (req as any).params || {}
  const productId = Number(id)
  if (!productId) return res.status(400).json({ message: 'missing product id' })

  const repo = AppDataSource.getRepository(ProductVariant)
  const licenseRepo = AppDataSource.getRepository(LicenseModel)

  const variants = await repo.find({ where: { productId } } as any)

  const items = await Promise.all(variants.map(async (v: any) => {
    const license = v.licenseModelId ? await licenseRepo.findOne({ where: { id: v.licenseModelId } } as any) : null
    return {
      id: v.id,
      license_model_id: v.licenseModelId,
      license_model_name: license?.name || '',
      name: v.name,
      price_cents: v.priceCents,
      status: v.status,
      description: v.description || null,
      created_at: v.createdAt,
    }
  }))

  return res.json({ items })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  console.log("[custom/admin/products/variants] auth header:", req.headers.authorization)
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PATCH, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization");

  if (!AppDataSource.isInitialized) await AppDataSource.initialize()

  const { id } = (req as any).params || {}
  const productId = Number(id)
  if (!productId) return res.status(400).json({ message: 'missing product id' })

  const repo = AppDataSource.getRepository(ProductVariant)
  const body = (req as any).body || {}

  const variant = repo.create({
    productId,
    licenseModelId: body.license_model_id,
    name: body.name || '',
    priceCents: body.price_cents || 0,
    status: body.status || 'active',
    description: body.description || null,
  } as any)

  const saved = await repo.save(variant as any)
  return res.status(201).json(saved)
}
