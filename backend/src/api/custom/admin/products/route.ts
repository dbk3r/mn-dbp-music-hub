import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ensureDataSource, setAdminCors } from "../_utils"
import { Product } from "../../../../models/product"
import { ProductVariant } from "../../../../models/product-variant"
import { AudioFile } from "../../../../models/audio-file"
import { Category } from "../../../../models/category"
import { Tag } from "../../../../models/tag"
import { LicenseModel } from "../../../../models/license-model"

export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) {
  setAdminCors(res)
  return res.sendStatus(200)
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  setAdminCors(res)

  const ds = await ensureDataSource()
  const productRepo = ds.getRepository(Product)
  const variantRepo = ds.getRepository(ProductVariant)
  const audioRepo = ds.getRepository(AudioFile)
  const categoryRepo = ds.getRepository(Category)
  const tagRepo = ds.getRepository(Tag)
  const licenseRepo = ds.getRepository(LicenseModel)

  const products = await productRepo.find({ order: { id: "DESC" } as any, take: 200 })

  const audioIds = products.map((p) => p.audioFileId).filter((id) => Number.isFinite(id))
  const categoryIds = Array.from(new Set(products.map((p) => p.categoryId).filter((id) => typeof id === "number")))
  const tagIds = Array.from(
    new Set(
      products
        .flatMap((p) => (Array.isArray(p.tagIds) ? p.tagIds : []))
        .map((id) => Number(id))
        .filter((n) => Number.isFinite(n))
    )
  )

  const [audios, categories, tags, allVariants] = await Promise.all([
    audioIds.length ? audioRepo.findBy({ id: audioIds as any } as any) : Promise.resolve([]),
    categoryIds.length ? categoryRepo.findBy({ id: categoryIds as any } as any) : Promise.resolve([]),
    tagIds.length ? tagRepo.findBy({ id: tagIds as any } as any) : Promise.resolve([]),
    variantRepo.find({ order: { id: "ASC" } as any }),
  ])

  const audioById = new Map(audios.map((a) => [a.id, a]))
  const categoryById = new Map(categories.map((c) => [c.id, c]))
  const tagById = new Map(tags.map((t) => [t.id, t]))

  const variantsByProduct = new Map<number, typeof allVariants>()
  for (const v of allVariants) {
    if (!variantsByProduct.has(v.productId)) {
      variantsByProduct.set(v.productId, [])
    }
    variantsByProduct.get(v.productId)!.push(v)
  }

  const licenseIds = Array.from(new Set(allVariants.map((v) => v.licenseModelId).filter((id) => Number.isFinite(id))))
  const licenses = licenseIds.length ? await licenseRepo.findBy({ id: licenseIds as any } as any) : []
  const licenseById = new Map(licenses.map((l) => [l.id, l]))

  const items = products.map((p) => {
    const audio = audioById.get(p.audioFileId)
    const category = p.categoryId ? categoryById.get(p.categoryId) : null
    const tags = Array.isArray(p.tagIds)
      ? p.tagIds.map((id) => tagById.get(Number(id))).filter(Boolean)
      : []

    const variants = (variantsByProduct.get(p.id) || []).map((v) => {
      const license = licenseById.get(v.licenseModelId)
      return {
        id: v.id,
        license_model_id: v.licenseModelId,
        license_model_name: license?.name ?? "Unknown",
        name: v.name,
        price_cents: v.priceCents,
        status: v.status,
      }
    })

    return {
      id: p.id,
      audio_file_id: p.audioFileId,
      title: p.title,
      description: p.description,
      status: p.status,
      category: category ? { id: category.id, name: category.name } : null,
      tags: tags.map((t: any) => ({ id: t.id, name: t.name })),
      audio: audio
        ? {
            artist: audio.artist,
            duration_ms: audio.durationMs,
            stream_url: `/custom/audio/${audio.id}/stream`,
            cover_url: audio.coverFilename ? `/custom/audio/${audio.id}/cover` : null,
          }
        : null,
      variants,
      created_at: p.createdAt?.toISOString?.() ?? String(p.createdAt),
      updated_at: p.updatedAt?.toISOString?.() ?? String(p.updatedAt),
    }
  })

  return res.json({ items })
}

async function readJsonBody(req: MedusaRequest): Promise<any> {
  const chunks: Buffer[] = []
  for await (const chunk of req as any) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  const raw = Buffer.concat(chunks).toString("utf8")
  if (!raw.trim()) return null
  return JSON.parse(raw)
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  setAdminCors(res)

  const body = await readJsonBody(req).catch(() => null)
  if (!body || typeof body.audio_file_id !== "number") {
    return res.status(400).json({ message: "audio_file_id required" })
  }

  const ds = await ensureDataSource()
  const productRepo = ds.getRepository(Product)
  const audioRepo = ds.getRepository(AudioFile)

  const audio = await audioRepo.findOne({ where: { id: body.audio_file_id } as any })
  if (!audio) {
    return res.status(404).json({ message: "audio file not found" })
  }

  const existing = await productRepo.findOne({ where: { audioFileId: body.audio_file_id } as any })
  if (existing) {
    return res.status(409).json({ message: "product already exists for this audio file" })
  }

  const product = productRepo.create({
    audioFileId: body.audio_file_id,
    title: String(body.title ?? audio.title),
    description: body.description != null ? String(body.description) : audio.description,
    status: body.status ?? "draft",
    categoryId: typeof body.category_id === "number" ? body.category_id : audio.categoryId,
    tagIds: Array.isArray(body.tag_ids) ? body.tag_ids : audio.tagIds,
  })

  await productRepo.save(product)

  return res.json({
    id: product.id,
    audio_file_id: product.audioFileId,
    title: product.title,
    description: product.description,
    status: product.status,
    category_id: product.categoryId,
    tag_ids: product.tagIds,
    created_at: product.createdAt?.toISOString?.() ?? String(product.createdAt),
  })
}
