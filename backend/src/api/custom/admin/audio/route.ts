import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import crypto from "crypto"
import path from "path"
import fs from "fs/promises"
import { AudioFile } from "../../../../models/audio-file"
import { LicenseModel } from "../../../../models/license-model"
import { ensureDataSource, setAdminCors } from "../_utils"
import { analyzeAudio } from "./_audio-analysis"
import { ensureProductForAudio } from "../products/_ensure-product"

async function readRequestBody(req: MedusaRequest): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of req as any) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) {
  setAdminCors(res)
  return res.sendStatus(200)
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  setAdminCors(res)

  const ds = await ensureDataSource()
  const repo = ds.getRepository(AudioFile)

  const rows = await repo.find({ order: { id: "DESC" } as any, take: 200 })

  const items = rows.map((r) => ({
    id: r.id,
    title: r.title,
    artist: r.artist,
    description: r.description,
    release_year: r.releaseYear,
    original_name: r.originalName,
    filename: r.filename,
    mime_type: r.mimeType,
    size: r.size,
    duration_ms: r.durationMs,
    waveform_peaks: r.waveformPeaks,
    category_id: r.categoryId,
    tag_ids: r.tagIds,
    license_model_ids: r.licenseModelIds,
    cover_original_name: r.coverOriginalName,
    cover_mime_type: r.coverMimeType,
    cover_size: r.coverSize,
    cover_url: r.coverFilename ? `/custom/audio/${r.id}/cover` : null,
    created_at: r.createdAt?.toISOString?.() ?? String(r.createdAt),
  }))

  return res.json({ items })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  setAdminCors(res)

  const q = (req.query as any) || {}

  const originalFilename = String((req.query as any)?.filename ?? "audio")
  const originalName = path
    .basename(originalFilename)
    .replace(/[^a-zA-Z0-9._-]+/g, "_")

  const mimeType = String((req.query as any)?.mime ?? "application/octet-stream")

  const ext = path.extname(originalName).toLowerCase()
  const isMp3 = ext === ".mp3" || mimeType === "audio/mpeg" || mimeType === "audio/mp3"
  const isWav =
    ext === ".wav" || mimeType === "audio/wav" || mimeType === "audio/x-wav"

  if (!isMp3 && !isWav) {
    return res.status(400).json({ message: "only mp3 and wav are allowed" })
  }

  const title = String(q.title ?? "").trim() || path.parse(originalName).name
  const artist = q.artist != null ? String(q.artist).trim() || null : null
  const description =
    q.description != null ? String(q.description).trim() || null : null

  const releaseYearRaw = q.release_year ?? q.releaseYear
  const releaseYear =
    releaseYearRaw == null || String(releaseYearRaw).trim() === ""
      ? null
      : Number.isFinite(Number(releaseYearRaw))
        ? Math.trunc(Number(releaseYearRaw))
        : null

  const bytes = await readRequestBody(req)
  if (!bytes.length) {
    return res.status(400).json({ message: "empty body" })
  }

  const uploadsDir =
    process.env.AUDIO_UPLOAD_DIR || path.join(process.cwd(), "uploads")
  await fs.mkdir(uploadsDir, { recursive: true })

  const storedFilename = `${Date.now()}-${crypto.randomUUID()}-${originalName}`
  const fullPath = path.join(uploadsDir, storedFilename)

  await fs.writeFile(fullPath, bytes)

  const analysis = await analyzeAudio(fullPath)

  const ds = await ensureDataSource()
  const repo = ds.getRepository(AudioFile)

  // default: allow all license models for new uploads
  const licenseRepo = ds.getRepository(LicenseModel)
  const licenseRows = await licenseRepo.find({ select: { id: true } as any })
  const licenseModelIds = licenseRows
    .map((r: any) => Number(r.id))
    .filter((n: any) => Number.isFinite(n))

  const created = repo.create({
    title,
    artist,
    description,
    releaseYear,
    originalName,
    filename: storedFilename,
    mimeType,
    size: bytes.length,
    durationMs: analysis.durationMs,
    waveformPeaks: analysis.peaks,
    categoryId: null,
    tagIds: [],
    licenseModelIds,
  })

  const saved = await repo.save(created)

  const productResult = await ensureProductForAudio(saved.id, {
    title,
    description,
    status: "draft",
    categoryId: saved.categoryId,
    tagIds: saved.tagIds,
    licenseModelIds: saved.licenseModelIds,
  })

  return res.status(201).json({
    item: {
      id: saved.id,
      title: saved.title,
      artist: saved.artist,
      description: saved.description,
      release_year: saved.releaseYear,
      original_name: saved.originalName,
      filename: saved.filename,
      mime_type: saved.mimeType,
      size: saved.size,
      duration_ms: saved.durationMs,
      waveform_peaks: saved.waveformPeaks,
      category_id: saved.categoryId,
      tag_ids: saved.tagIds,
      license_model_ids: saved.licenseModelIds,
      cover_original_name: saved.coverOriginalName,
      cover_mime_type: saved.coverMimeType,
      cover_size: saved.coverSize,
      cover_url: saved.coverFilename ? `/custom/audio/${saved.id}/cover` : null,
      created_at: saved.createdAt?.toISOString?.() ?? String(saved.createdAt),
    },
    product_created: productResult.created,
  })
}
