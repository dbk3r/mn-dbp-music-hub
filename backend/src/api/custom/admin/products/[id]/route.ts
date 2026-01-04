import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AppDataSource } from "../../../../../datasource/data-source"
import { Product } from "../../../../../models/product"
import { AudioFile } from "../../../../../models/audio-file"
import { Category } from "../../../../../models/category"
import { Tag } from "../../../../../models/tag"
import { In } from "typeorm"
import { ProductVariant } from "../../../../../models/product-variant"
import { LicenseModel } from "../../../../../models/license-model"
import { VariantFile } from "../../../../../models/variant-file"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  console.log("[custom/admin/products/:id] auth header:", req.headers.authorization)
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PATCH, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization");

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  const id = Number((req as any).params?.id)
  if (!id) return res.status(400).json({ message: "missing id" })

  const productRepo = AppDataSource.getRepository(Product)
  const audioRepo = AppDataSource.getRepository(AudioFile)
  const categoryRepo = AppDataSource.getRepository(Category)
  const tagRepo = AppDataSource.getRepository(Tag)
  const variantRepo = AppDataSource.getRepository(ProductVariant)
  const licenseRepo = AppDataSource.getRepository(LicenseModel)
  const fileRepo = AppDataSource.getRepository(VariantFile)

  const product = await productRepo.findOne({ where: { id } } as any)
  if (!product) return res.status(404).json({ message: "not found" })

  const audio = product.audioFileId ? await audioRepo.findOne({ where: { id: product.audioFileId } } as any) : null
  const category = product.categoryId ? await categoryRepo.findOne({ where: { id: product.categoryId } } as any) : null

  const tagIds = Array.isArray(product.tagIds) ? product.tagIds.map((t: any) => Number(t)).filter(Boolean) : []
  const tags = tagIds.length ? await tagRepo.findBy({ id: In(tagIds) } as any) : []

  const variants = await variantRepo.find({ where: { productId: product.id } } as any)

  const variantsWithDetails = await Promise.all(variants.map(async (variant) => {
    const license = variant.licenseModelId ? await licenseRepo.findOne({ where: { id: variant.licenseModelId } } as any) : null
    const files = await fileRepo.findBy({ variantId: variant.id } as any)
    return {
      id: variant.id,
      license_model_id: variant.licenseModelId,
      license_model_name: license?.name || '',
      name: variant.name,
      price_cents: variant.priceCents,
      status: variant.status,
      description: (variant as any).description || null,
      files: files.map(f => ({ id: f.id, original_name: f.originalName, filename: f.filename, mime_type: f.mimeType, size: f.size, description: f.description, created_at: f.createdAt }))
    }
  }))

  return res.json({
    id: product.id,
    audio_file_id: product.audioFileId,
    title: product.title,
    description: product.description,
    status: product.status,
    category: category ? { id: category.id, name: category.name } : null,
    tags: tags.map(tag => ({ id: tag.id, name: tag.name })),
    audio: audio ? {
      artist: audio.artist,
      duration_ms: audio.durationMs,
      stream_url: `/uploads/audio/${audio.filename}`,
      cover_url: audio.coverFilename ? `/uploads/covers/${audio.coverFilename}` : null,
    } : null,
    variants: variantsWithDetails,
    created_at: product.createdAt,
  })
}

export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  console.log("[custom/admin/products/:id] auth header:", req.headers.authorization)
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PATCH, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization");

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  const id = Number((req as any).params?.id)
  if (!id) return res.status(400).json({ message: "missing id" })

  const productRepo = AppDataSource.getRepository(Product)
  const categoryRepo = AppDataSource.getRepository(Category)
  const tagRepo = AppDataSource.getRepository(Tag)

  const body = (req as any).body || {}

  const product = await productRepo.findOne({ where: { id } } as any)
  if (!product) return res.status(404).json({ message: "not found" })

  if (body.title !== undefined) product.title = body.title
  if (body.description !== undefined) product.description = body.description
  if (body.status !== undefined) product.status = body.status
  if (body.category_id !== undefined) {
    product.categoryId = body.category_id === null ? null : Number(body.category_id)
  }
  if (body.tag_ids !== undefined) {
    product.tagIds = Array.isArray(body.tag_ids) ? body.tag_ids.map((t: any) => Number(t)).filter(Boolean) : []
  }

  await productRepo.save(product as any)

  return res.json(product)
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  console.log("[custom/admin/products/:id] auth header:", req.headers.authorization)
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PATCH, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization");

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  const id = Number((req as any).params?.id)
  if (!id) return res.status(400).json({ message: "missing id" })

  const productRepo = AppDataSource.getRepository(Product)
  await productRepo.delete({ id } as any)
  return res.json({ ok: true })
}
