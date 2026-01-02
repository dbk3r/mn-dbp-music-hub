import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import path from "path"
import fs from "fs/promises"
import { AudioFile } from "../../../../../models/audio-file"
import { ensureDataSource, setAdminCors } from "../../_utils"

type Params = { id: string }

export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) {
  setAdminCors(res)
  return res.sendStatus(200)
}

export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  setAdminCors(res)

  const id = Number((req.params as any)?.id)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "invalid id" })
  }

  const body = (req.body as any) || {}

  const categoryIdRaw = body.category_id ?? body.categoryId
  const categoryId =
    categoryIdRaw == null || String(categoryIdRaw).trim() === ""
      ? null
      : Number.isFinite(Number(categoryIdRaw))
        ? Math.trunc(Number(categoryIdRaw))
        : null

  const tagIdsRaw = body.tag_ids ?? body.tagIds
  const licenseIdsRaw = body.license_model_ids ?? body.licenseModelIds

  const normalizeIdArray = (v: any): number[] | null => {
    if (v == null) return null
    const arr = Array.isArray(v) ? v : null
    if (!arr) return null
    return arr
      .map((x) => Number(x))
      .filter((n) => Number.isFinite(n))
      .map((n) => Math.trunc(n))
  }

  const tagIds = normalizeIdArray(tagIdsRaw)
  const licenseModelIds = normalizeIdArray(licenseIdsRaw)

  const ds = await ensureDataSource()
  const repo = ds.getRepository(AudioFile)

  const row = await repo.findOne({ where: { id } as any })
  if (!row) {
    return res.status(404).json({ message: "not found" })
  }

  if (body.hasOwnProperty("category_id") || body.hasOwnProperty("categoryId")) {
    row.categoryId = categoryId
  }
  if (tagIds != null) {
    row.tagIds = tagIds
  }
  if (licenseModelIds != null) {
    row.licenseModelIds = licenseModelIds
  }

  const saved = await repo.save(row)
  return res.json({
    item: {
      id: saved.id,
      category_id: saved.categoryId,
      tag_ids: saved.tagIds,
      license_model_ids: saved.licenseModelIds,
    },
  })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  setAdminCors(res)

  const id = Number((req.params as any)?.id)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "invalid id" })
  }

  const ds = await ensureDataSource()
  const repo = ds.getRepository(AudioFile)

  const row = await repo.findOne({ where: { id } as any })
  if (!row) {
    return res.status(404).json({ message: "not found" })
  }

  await repo.delete({ id } as any)

  const uploadsDir = process.env.AUDIO_UPLOAD_DIR || path.join(process.cwd(), "uploads")
  const fullPath = path.join(uploadsDir, row.filename)

  await fs.unlink(fullPath).catch(() => {
    // ignore missing file
  })

  if (row.coverFilename) {
    const coverPath = path.join(uploadsDir, row.coverFilename)
    await fs.unlink(coverPath).catch(() => {
      // ignore missing file
    })
  }

  return res.json({ ok: true })
}
