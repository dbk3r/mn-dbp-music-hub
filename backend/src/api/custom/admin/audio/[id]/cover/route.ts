import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import crypto from "crypto"
import path from "path"
import fs from "fs/promises"
import { AudioFile } from "../../../../../../models/audio-file"
import { ensureDataSource, setAdminCors } from "../../../_utils"

async function readRequestBody(req: MedusaRequest): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of req as any) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

function sanitizeFilename(filename: string) {
  return path
    .basename(filename)
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .slice(0, 200)
}

function isAllowedImage(mimeType: string, ext: string) {
  const e = ext.toLowerCase()
  const mt = mimeType.toLowerCase()

  const byExt = e === ".png" || e === ".jpg" || e === ".jpeg" || e === ".webp"
  const byMime =
    mt === "image/png" || mt === "image/jpeg" || mt === "image/jpg" || mt === "image/webp"

  return byExt || byMime
}

export async function OPTIONS(_req: MedusaRequest, res: MedusaResponse) {
  setAdminCors(res)
  return res.sendStatus(200)
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  setAdminCors(res)

  const id = Number((req.params as any)?.id)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "invalid id" })
  }

  const originalFilename = String((req.query as any)?.filename ?? "cover")
  const originalName = sanitizeFilename(originalFilename)
  const mimeType = String((req.query as any)?.mime ?? "application/octet-stream")

  const ext = path.extname(originalName).toLowerCase()
  if (!isAllowedImage(mimeType, ext)) {
    return res.status(400).json({ message: "only png, jpg/jpeg, webp are allowed" })
  }

  const bytes = await readRequestBody(req)
  if (!bytes.length) {
    return res.status(400).json({ message: "empty body" })
  }

  const uploadsDir = process.env.AUDIO_UPLOAD_DIR || path.join(process.cwd(), "uploads")
  await fs.mkdir(uploadsDir, { recursive: true })

  const storedFilename = `${Date.now()}-${crypto.randomUUID()}-cover-${originalName}`
  const fullPath = path.join(uploadsDir, storedFilename)

  const ds = await ensureDataSource()
  const repo = ds.getRepository(AudioFile)

  const row = await repo.findOne({ where: { id } as any })
  if (!row) {
    return res.status(404).json({ message: "not found" })
  }

  // delete old cover (best-effort)
  if (row.coverFilename) {
    const oldPath = path.join(uploadsDir, row.coverFilename)
    await fs.unlink(oldPath).catch(() => {})
  }

  await fs.writeFile(fullPath, bytes)

  row.coverOriginalName = originalName
  row.coverFilename = storedFilename
  row.coverMimeType = mimeType
  row.coverSize = bytes.length

  const saved = await repo.save(row)

  return res.json({
    item: {
      id: saved.id,
      cover_original_name: saved.coverOriginalName,
      cover_mime_type: saved.coverMimeType,
      cover_size: saved.coverSize,
      cover_url: saved.coverFilename ? `/custom/audio/${saved.id}/cover` : null,
    },
  })
}
