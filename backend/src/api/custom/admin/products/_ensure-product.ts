import { In } from "typeorm"
import { ensureDataSource } from "../_utils"
import { AudioFile, LicenseModel, Product, ProductVariant } from "../models"

type EnsureProductOptions = {
  title?: string
  description?: string | null
  status?: string
  categoryId?: number | null
  tagIds?: number[] | null
  licenseModelIds?: number[] | null
  variants?: Array<{
    license_model_id: number
    name: string
    price_cents: number
    status: string
    description?: string
  }> | null
}

function normalizeIds(input: any): number[] {
  if (input == null) return []

  // Allow Postgres array string format "{1,2}" or "{1}" coming from jsonb serialization
  if (typeof input === "string") {
    const matches = Array.from(input.matchAll(/-?\d+/g)).map((m) => Number(m[0]))
    return matches.filter((n) => Number.isFinite(n)).map((n) => Math.trunc(n))
  }

  if (!Array.isArray(input)) return []

  return Array.from(
    new Set(
      input
        .map((v) => Number(v))
        .filter((n) => Number.isFinite(n))
        .map((n) => Math.trunc(n))
    )
  )
}

export async function ensureProductForAudio(audioFileId: number, opts?: EnsureProductOptions) {
  const ds = await ensureDataSource()
  const audioRepo = ds.getRepository(AudioFile)
  const productRepo = ds.getRepository(Product)
  const variantRepo = ds.getRepository(ProductVariant)
  const licenseRepo = ds.getRepository(LicenseModel)

  const audio = await audioRepo.findOne({ where: { id: audioFileId } as any })
  if (!audio) {
    return { product: null, created: false, variantsCreated: 0 }
  }

  const existing = await productRepo.findOne({ where: { audioFileId: audio.id } as any })
  if (existing) {
    return { product: existing, created: false, variantsCreated: 0 }
  }

  const product = productRepo.create({
    audioFileId: audio.id,
    title: opts?.title ?? audio.title ?? `Audio ${audio.id}`,
    description: opts?.description ?? audio.description ?? null,
    status: opts?.status ?? "draft",
    categoryId: opts?.categoryId ?? audio.categoryId ?? null,
    tagIds: opts?.tagIds ?? audio.tagIds ?? [],
  })

  const savedProduct = await productRepo.save(product)

  let variants: any[] = []

  if (opts?.variants && Array.isArray(opts.variants)) {
    // Explicit variant data provided by user
    variants = opts.variants.map((v) =>
      variantRepo.create({
        productId: savedProduct.id,
        licenseModelId: v.license_model_id,
        name: v.name ?? `Variant ${v.license_model_id}`,
        priceCents: Number.isFinite(Number(v.price_cents)) ? Math.trunc(Number(v.price_cents)) : 0,
        status: v.status ?? "active",
      })
    )
  } else {
    // Fallback: create variants from license IDs (backward compatibility)
    const licenseIds = normalizeIds(opts?.licenseModelIds ?? audio.licenseModelIds ?? [])
    const licenseRows = licenseIds.length
      ? await licenseRepo.findBy({ id: In(licenseIds) } as any)
      : await licenseRepo.find()

    variants = licenseRows.map((lic) =>
      variantRepo.create({
        productId: savedProduct.id,
        licenseModelId: lic.id,
        name: lic.name ?? `License ${lic.id}`,
        priceCents: Number.isFinite(Number(lic.priceCents)) ? Math.trunc(Number(lic.priceCents)) : 0,
        status: "active",
      })
    )
  }

  if (variants.length) {
    await variantRepo.save(variants)
  }

  return { product: savedProduct, created: true, variantsCreated: variants.length }
}
