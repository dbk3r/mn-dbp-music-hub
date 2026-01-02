import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import crypto from "crypto"
import path from "path"
import fs from "fs/promises"
import { ensureDataSource, setAdminCors } from "../../../../../_utils"
import { VariantFile, ProductVariant } from "../../../../../models"

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

  const variantId = Number((req.params as any).variantId)
  if (!Number.isFinite(variantId)) {
    return res.status(400).json({ message: "invalid variant id" })
  }

  const ds = await ensureDataSource()
  const repo = ds.getRepository(VariantFile)

  const files = await repo.find({ where: { variantId } as any, order: { id: "ASC" } as any })

  const items = files.map((f) => ({
    id: f.id,
    variant_id: f.variantId,
    original_name: f.originalName,
    filename: f.filename,
    mime_type: f.mimeType,
    size: f.size,
    description: f.description,
    download_url: `/custom/admin/products/variants/${variantId}/files/${f.id}/download`,
    created_at: f.createdAt?.toISOString?.() ?? String(f.createdAt),
  }))

  return res.json({ items })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  setAdminCors(res)

  const variantId = Number((req.params as any).variantId)
  if (!Number.isFinite(variantId)) {
    return res.status(400).json({ message: "invalid variant id" })
  }

  const q = (req.query as any) || {}
  const originalFilename = String(q.filename ?? "file")
  const originalName = path.basename(originalFilename).replace(/[^a-zA-Z0-9._-]+/g, "_")
  const mimeType = String(q.mime ?? "application/octet-stream")
  const description = q.description != null ? String(q.description).trim() || null : null

  const bytes = await readRequestBody(req)
  if (!bytes.length) {
    return res.status(400).json({ message: "empty body" })
  }

  const ds = await ensureDataSource()
  const variantRepo = ds.getRepository(ProductVariant)
  const fileRepo = ds.getRepository(VariantFile)

  const variant = await variantRepo.findOne({ where: { id: variantId } as any })
  if (!variant) {
    return res.status(404).json({ message: "variant not found" })
  }

  const uploadsDir = process.env.AUDIO_UPLOAD_DIR || path.join(process.cwd(), "uploads")
  await fs.mkdir(uploadsDir, { recursive: true })

  const storedFilename = `variant-${variantId}-${Date.now()}-${crypto.randomUUID()}-${originalName}`
  const fullPath = path.join(uploadsDir, storedFilename)

  await fs.writeFile(fullPath, bytes)

  const file = fileRepo.create({
    variantId,
    originalName,
    filename: storedFilename,
    mimeType,
    size: bytes.length,
    description,
  })

  await fileRepo.save(file)

  return res.json({
    id: file.id,
    variant_id: file.variantId,
    original_name: file.originalName,
    filename: file.filename,
    mime_type: file.mimeType,
    size: file.size,
    description: file.description,
    download_url: `/custom/admin/products/variants/${variantId}/files/${file.id}/download`,
    created_at: file.createdAt?.toISOString?.() ?? String(file.createdAt),
  })
}
