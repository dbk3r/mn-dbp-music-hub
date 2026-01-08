import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AppDataSource } from "../../../../../../datasource/data-source"
import { AudioVariant } from "../../../../../../models/audio-variant"
import { LicenseModel } from "../../../../../../models/license-model"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  console.log("[custom/admin/audio/variants] auth header:", req.headers.authorization)
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PATCH, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization");

  if (!AppDataSource.isInitialized) await AppDataSource.initialize()

  const { id } = (req as any).params || {}
  const audioFileId = Number(id)
  if (!audioFileId) return res.status(400).json({ message: 'missing audio file id' })

  const repo = AppDataSource.getRepository(AudioVariant)
  const licenseRepo = AppDataSource.getRepository(LicenseModel)

  const variants = await repo.find({ where: { audioFileId } } as any)

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
  console.log("[custom/admin/audio/variants] auth header:", req.headers.authorization)
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PATCH, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization");

  if (!AppDataSource.isInitialized) await AppDataSource.initialize()

  const { id } = (req as any).params || {}
  const audioFileId = Number(id)
  if (!audioFileId) return res.status(400).json({ message: 'missing audio file id' })

  const repo = AppDataSource.getRepository(AudioVariant)
  const licenseRepo = AppDataSource.getRepository(LicenseModel)
  const body = (req as any).body || {}

  // Get license model to pre-fill name and price
  const license = body.license_model_id ? await licenseRepo.findOne({ where: { id: body.license_model_id } } as any) : null

  const variant = repo.create({
    audioFileId,
    licenseModelId: body.license_model_id,
    name: body.name || license?.name || '',
    priceCents: body.price_cents !== undefined ? body.price_cents : (license?.priceCents || 0),
    status: body.status || 'active',
    description: body.description || null,
  } as any)

  const saved = await repo.save(variant as any)
  
  return res.status(201).json({
    id: saved.id,
    license_model_id: saved.licenseModelId,
    license_model_name: license?.name || '',
    name: saved.name,
    price_cents: saved.priceCents,
    status: saved.status,
    description: saved.description,
    created_at: saved.createdAt,
  })
}
