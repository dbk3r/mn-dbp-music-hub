import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ensureDataSource, setAdminCors } from "../../../../_utils"
import { ProductVariant } from "../../../../models"

async function readJsonBody(req: MedusaRequest): Promise<any> {
  const chunks: Buffer[] = []
  for await (const chunk of req as any) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  const raw = Buffer.concat(chunks).toString("utf8")
  if (!raw.trim()) return null
  return JSON.parse(raw)
}

export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) {
  setAdminCors(res)
  return res.sendStatus(200)
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  setAdminCors(res)

  const variantId = Number((req.params as any).variantId)
  if (!Number.isFinite(variantId)) {
    return res.status(400).json({ message: "invalid variant id" })
  }

  const ds = await ensureDataSource()
  const repo = ds.getRepository(ProductVariant)

  const variant = await repo.findOne({ where: { id: variantId } as any })
  if (!variant) {
    return res.status(404).json({ message: "variant not found" })
  }

  return res.json({
    id: variant.id,
    product_id: variant.productId,
    license_model_id: variant.licenseModelId,
    name: variant.name,
    price_cents: variant.priceCents,
    status: variant.status,
    created_at: variant.createdAt?.toISOString?.() ?? String(variant.createdAt),
  })
}

export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  setAdminCors(res)

  const variantId = Number((req.params as any).variantId)
  if (!Number.isFinite(variantId)) {
    return res.status(400).json({ message: "invalid variant id" })
  }

  const body = (req as any).body ?? (await readJsonBody(req).catch(() => null))
  if (!body) {
    return res.status(400).json({ message: "invalid body" })
  }

  const ds = await ensureDataSource()
  const repo = ds.getRepository(ProductVariant)

  const variant = await repo.findOne({ where: { id: variantId } as any })
  if (!variant) {
    return res.status(404).json({ message: "variant not found" })
  }

  if (body.name != null) variant.name = String(body.name)
  if (typeof body.price_cents === "number") variant.priceCents = body.price_cents
  if (body.status != null) variant.status = String(body.status)

  await repo.save(variant)

  return res.json({
    id: variant.id,
    product_id: variant.productId,
    license_model_id: variant.licenseModelId,
    name: variant.name,
    price_cents: variant.priceCents,
    status: variant.status,
  })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  setAdminCors(res)

  const variantId = Number((req.params as any).variantId)
  if (!Number.isFinite(variantId)) {
    return res.status(400).json({ message: "invalid variant id" })
  }

  const ds = await ensureDataSource()
  const repo = ds.getRepository(ProductVariant)

  const variant = await repo.findOne({ where: { id: variantId } as any })
  if (!variant) {
    return res.status(404).json({ message: "variant not found" })
  }

  await repo.remove(variant)

  return res.json({ id: variantId, deleted: true })
}
