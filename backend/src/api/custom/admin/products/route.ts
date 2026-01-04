import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AppDataSource } from "../../../../datasource/data-source"
import { Product } from "../../../../models/product"
import { AudioFile } from "../../../../models/audio-file"
import { Category } from "../../../../models/category"
import { Tag } from "../../../../models/tag"
import { In } from "typeorm"
import { ProductVariant } from "../../../../models/product-variant"
import { LicenseModel } from "../../../../models/license-model"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  console.log("[custom/admin/products] auth header:", req.headers.authorization)
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization");

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  const productRepo = AppDataSource.getRepository(Product)
  const audioRepo = AppDataSource.getRepository(AudioFile)
  const categoryRepo = AppDataSource.getRepository(Category)
  const tagRepo = AppDataSource.getRepository(Tag)
  const variantRepo = AppDataSource.getRepository(ProductVariant)
  const licenseRepo = AppDataSource.getRepository(LicenseModel)

  const products = await productRepo.find()

  const result = await Promise.all(products.map(async (product) => {
    const audio = product.audioFileId ? await audioRepo.findOne({ where: { id: product.audioFileId } } as any) : null
    const category = product.categoryId ? await categoryRepo.findOne({ where: { id: product.categoryId } } as any) : null
    const tagIds = Array.isArray(product.tagIds) ? product.tagIds.map((t: any) => Number(t)).filter(Boolean) : []
    const tags = tagIds.length ? await tagRepo.findBy({ id: In(tagIds) } as any) : []
    const variants = await variantRepo.find({ where: { productId: product.id }, select: [
      "id",
      "productId",
      "licenseModelId",
      "name",
      "priceCents",
      "status",
      "createdAt",
    ] } as any)

    const variantsWithLicense = await Promise.all(variants.map(async (variant) => {
      const license = variant.licenseModelId ? await licenseRepo.findOne({ where: { id: variant.licenseModelId } } as any) : null
      return {
        id: variant.id,
        license_model_id: variant.licenseModelId,
        license_model_name: license?.name || '',
        name: variant.name,
        price_cents: variant.priceCents,
        status: variant.status,
      }
    }))

    return {
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
      variants: variantsWithLicense,
      created_at: product.createdAt,
    }
  }))

  res.json({ items: result })
}

export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  console.log("[custom/admin/products] auth header:", req.headers.authorization)
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

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  console.log("[custom/admin/products] auth header:", req.headers.authorization)
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PATCH, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization");

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  const productRepo = AppDataSource.getRepository(Product)
  const variantRepo = AppDataSource.getRepository(ProductVariant)

  const body = (req as any).body || {}

  const product = productRepo.create({
    title: body.title,
    description: body.description,
    status: body.status || 'draft',
    audioFileId: body.audio_file_id || null,
    categoryId: body.category_id || null,
    tagIds: Array.isArray(body.tag_ids) ? body.tag_ids.map((t: any) => Number(t)).filter(Boolean) : [],
  } as any)

  const saved = await productRepo.save(product as any)

  // create variants if provided
  if (Array.isArray(body.variants)) {
    const createdVariants: any[] = []
    for (const v of body.variants) {
      const variant = variantRepo.create({
        productId: saved.id,
        licenseModelId: v.license_model_id,
        name: v.name,
        priceCents: v.price_cents || 0,
        status: v.status || 'active',
        description: v.description || null,
      } as any)
      const sv = await variantRepo.save(variant as any)
      createdVariants.push(sv)
    }
    // attach variants to response
    ;(saved as any).variants = createdVariants
  }

  return res.status(201).json(saved)
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  console.log("[custom/admin/products] auth header:", req.headers.authorization)
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