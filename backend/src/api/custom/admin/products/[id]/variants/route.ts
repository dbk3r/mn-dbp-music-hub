import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ensureDataSource, setAdminCors } from "../../_utils"
import { ProductVariant } from "../../../../../models/product-variant"
import { Product } from "../../../../../models/product"
import { LicenseModel } from "../../../../../models/license-model"

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

  const productId = Number((req.params as any).id)
  if (!Number.isFinite(productId)) {
    return res.status(400).json({ message: "invalid product id" })
  }

  const ds = await ensureDataSource()
  const variantRepo = ds.getRepository(ProductVariant)
  const licenseRepo = ds.getRepository(LicenseModel)

  const variants = await variantRepo.find({ where: { productId } as any, order: { id: "ASC" } as any })

  const licenseIds = Array.from(new Set(variants.map((v) => v.licenseModelId).filter((id) => Number.isFinite(id))))
  const licenses = licenseIds.length ? await licenseRepo.findBy({ id: licenseIds as any } as any) : []
  const licenseById = new Map(licenses.map((l) => [l.id, l]))

  const items = variants.map((v) => {
    const license = licenseById.get(v.licenseModelId)
    return {
      id: v.id,
      product_id: v.productId,
      license_model_id: v.licenseModelId,
      license_model_name: license?.name ?? "Unknown",
      name: v.name,
      price_cents: v.priceCents,
      status: v.status,
      created_at: v.createdAt?.toISOString?.() ?? String(v.createdAt),
    }
  })

  return res.json({ items })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  setAdminCors(res)

  const productId = Number((req.params as any).id)
  if (!Number.isFinite(productId)) {
    return res.status(400).json({ message: "invalid product id" })
  }

  const body = await readJsonBody(req).catch(() => null)
  if (!body || typeof body.license_model_id !== "number") {
    return res.status(400).json({ message: "license_model_id required" })
  }

  const ds = await ensureDataSource()
  const productRepo = ds.getRepository(Product)
  const variantRepo = ds.getRepository(ProductVariant)
  const licenseRepo = ds.getRepository(LicenseModel)

  const [product, license] = await Promise.all([
    productRepo.findOne({ where: { id: productId } as any }),
    licenseRepo.findOne({ where: { id: body.license_model_id } as any }),
  ])

  if (!product) {
    return res.status(404).json({ message: "product not found" })
  }

  if (!license) {
    return res.status(404).json({ message: "license model not found" })
  }

  const variant = variantRepo.create({
    productId,
    licenseModelId: body.license_model_id,
    name: String(body.name ?? license.name),
    priceCents: typeof body.price_cents === "number" ? body.price_cents : license.priceCents,
    status: body.status ?? "active",
  })

  await variantRepo.save(variant)

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
