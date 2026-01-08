import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AppDataSource } from "../../../../../../../datasource/data-source"
import { AudioVariant } from "../../../../../../../models/audio-variant"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  console.log("[custom/admin/audio/variant] auth header:", req.headers.authorization)
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PATCH, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization");

  if (!AppDataSource.isInitialized) await AppDataSource.initialize()

  const { id, variantId } = (req as any).params || {}
  const audioFileId = Number(id)
  const vid = Number(variantId)
  if (!audioFileId || !vid) return res.status(400).json({ message: 'missing id' })

  const repo = AppDataSource.getRepository(AudioVariant)
  const v = await repo.findOne({ where: { id: vid, audioFileId } } as any)
  if (!v) return res.status(404).json({ message: 'not found' })
  return res.json(v)
}

export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  console.log("[custom/admin/audio/variant] auth header:", req.headers.authorization)
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PATCH, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization");

  if (!AppDataSource.isInitialized) await AppDataSource.initialize()

  const { id, variantId } = (req as any).params || {}
  const audioFileId = Number(id)
  const vid = Number(variantId)
  if (!audioFileId || !vid) return res.status(400).json({ message: 'missing id' })

  const repo = AppDataSource.getRepository(AudioVariant)
  const body = (req as any).body || {}
  const v = await repo.findOne({ where: { id: vid, audioFileId } } as any)
  if (!v) return res.status(404).json({ message: 'not found' })

  if (body.name !== undefined) v.name = body.name
  if (body.price_cents !== undefined) v.priceCents = body.price_cents
  if (body.status !== undefined) v.status = body.status
  if (body.description !== undefined) v.description = body.description

  const saved = await repo.save(v as any)
  return res.json(saved)
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  console.log("[custom/admin/audio/variant] auth header:", req.headers.authorization)
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PATCH, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization");

  if (!AppDataSource.isInitialized) await AppDataSource.initialize()

  const { id, variantId } = (req as any).params || {}
  const audioFileId = Number(id)
  const vid = Number(variantId)
  if (!audioFileId || !vid) return res.status(400).json({ message: 'missing id' })

  const repo = AppDataSource.getRepository(AudioVariant)
  await repo.delete({ id: vid, audioFileId } as any)
  return res.json({ ok: true })
}
