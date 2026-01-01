import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import crypto from "crypto"
import path from "path"
import fs from "fs/promises"
import { AudioFile } from "../../../../models/audio-file"
import { ensureDataSource, setAdminCors } from "../_utils"

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
    original_name: r.originalName,
    filename: r.filename,
    mime_type: r.mimeType,
    size: r.size,
    created_at: r.createdAt?.toISOString?.() ?? String(r.createdAt),
  }))

  return res.json({ items })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  setAdminCors(res)

  const originalFilename = String((req.query as any)?.filename ?? "audio")
  const originalName = path
    .basename(originalFilename)
    .replace(/[^a-zA-Z0-9._-]+/g, "_")

  const mimeType = String((req.query as any)?.mime ?? "application/octet-stream")

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

  const ds = await ensureDataSource()
  const repo = ds.getRepository(AudioFile)

  const created = repo.create({
    originalName,
    filename: storedFilename,
    mimeType,
    size: bytes.length,
  })

  const saved = await repo.save(created)

  return res.status(201).json({
    item: {
      id: saved.id,
      original_name: saved.originalName,
      filename: saved.filename,
      mime_type: saved.mimeType,
      size: saved.size,
      created_at: saved.createdAt?.toISOString?.() ?? String(saved.createdAt),
    },
  })
}
