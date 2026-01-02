import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AppDataSource } from "../../../../datasource/data-source"
import { AudioFile } from "../../../../models/audio-file"
import { Category } from "../../../../models/category"
import { Tag } from "../../../../models/tag"
import { LicenseModel } from "../../../../models/license-model"
import { setStoreCors } from "../_cors"

function toInt(v: unknown, fallback: number) {
  const n = Number(v)
  return Number.isFinite(n) ? Math.trunc(n) : fallback
}

export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) {
  setStoreCors(req, res)
  return res.sendStatus(200)
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  setStoreCors(req, res)

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  const q = (req.query as any) || {}

  const title = String(q.title ?? "").trim()
  const artist = String(q.artist ?? "").trim()

  const limit = Math.min(50, Math.max(1, toInt(q.limit, 20)))
  const offset = Math.max(0, toInt(q.offset, 0))

  const repo = AppDataSource.getRepository(AudioFile)
  const qb = repo
    .createQueryBuilder("a")
    .orderBy("a.created_at", "DESC")
    .addOrderBy("a.id", "DESC")
    .skip(offset)
    .take(limit + 1)

  if (title) {
    qb.andWhere("a.title ILIKE :title", { title: `%${title}%` })
  }

  if (artist) {
    qb.andWhere("a.artist ILIKE :artist", { artist: `%${artist}%` })
  }

  const rows = await qb.getMany()
  const hasMore = rows.length > limit
  const page = hasMore ? rows.slice(0, limit) : rows

  const categoryIds = Array.from(
    new Set(page.map((r) => r.categoryId).filter((v): v is number => typeof v === "number" && Number.isFinite(v)))
  )
  const tagIds = Array.from(
    new Set(
      page
        .flatMap((r) => (Array.isArray(r.tagIds) ? r.tagIds : []))
        .map((x) => Number(x))
        .filter((n) => Number.isFinite(n))
        .map((n) => Math.trunc(n))
    )
  )
  const licenseIds = Array.from(
    new Set(
      page
        .flatMap((r) => (Array.isArray(r.licenseModelIds) ? r.licenseModelIds : []))
        .map((x) => Number(x))
        .filter((n) => Number.isFinite(n))
        .map((n) => Math.trunc(n))
    )
  )

  const categoryRepo = AppDataSource.getRepository(Category)
  const tagRepo = AppDataSource.getRepository(Tag)
  const licenseRepo = AppDataSource.getRepository(LicenseModel)

  const [categories, tags, licenses] = await Promise.all([
    categoryIds.length ? categoryRepo.findBy({ id: categoryIds as any } as any) : Promise.resolve([]),
    tagIds.length ? tagRepo.findBy({ id: tagIds as any } as any) : Promise.resolve([]),
    licenseIds.length
      ? licenseRepo.findBy({ id: licenseIds as any } as any)
      : Promise.resolve([]),
  ])

  const categoryById = new Map(categories.map((c) => [c.id, c.name]))
  const tagById = new Map(tags.map((t) => [t.id, t.name]))
  const licenseById = new Map(
    licenses.map((l) => [l.id, { id: l.id, name: l.name, description: l.description, price_cents: l.priceCents }])
  )

  const items = page.map((r) => ({
    id: r.id,
    title: r.title,
    artist: r.artist,
    description: r.description,
    release_year: r.releaseYear,
    mime_type: r.mimeType,
    duration_ms: r.durationMs,
    waveform_peaks: r.waveformPeaks,
    cover_url: r.coverFilename ? `/custom/audio/${r.id}/cover` : null,
    category: r.categoryId ? categoryById.get(r.categoryId) ?? null : null,
    tags: Array.isArray(r.tagIds)
      ? r.tagIds
          .map((id) => tagById.get(Number(id)) ?? null)
          .filter((n): n is string => Boolean(n))
      : [],
    license_models: Array.isArray(r.licenseModelIds)
      ? r.licenseModelIds
          .map((id) => licenseById.get(Number(id)) ?? null)
          .filter(Boolean)
      : [],
    stream_url: `/custom/audio/${r.id}/stream`,
  }))

  return res.json({
    items,
    nextOffset: offset + items.length,
    hasMore,
  })
}
