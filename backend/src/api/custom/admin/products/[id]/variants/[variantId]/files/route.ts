import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AppDataSource } from "../../../../../../../../datasource/data-source"
import { VariantFile } from "../../../../../../../../models/variant-file"
import fs from "fs"
import path from "path"

async function readBody(req: any) {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  console.log("[custom/admin/variant-files] auth header:", req.headers.authorization)
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization");

  if (!AppDataSource.isInitialized) await AppDataSource.initialize()

  const { variantId } = (req as any).params || {}
  const vid = Number(variantId)
  if (!vid) return res.status(400).json({ message: 'missing variant id' })

  const repo = AppDataSource.getRepository(VariantFile)
  const items = await repo.find({ where: { variantId: vid } } as any)

  const mapped = items.map((f: any) => ({
    id: f.id,
    original_name: f.originalName,
    size: f.size,
    download_url: `/uploads/variants/${f.filename}`,
    created_at: f.createdAt,
  }))

  return res.json({ items: mapped })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  console.log("[custom/admin/variant-files] auth header:", req.headers.authorization)
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization");

  if (!AppDataSource.isInitialized) await AppDataSource.initialize()

  const { variantId } = (req as any).params || {}
  const vid = Number(variantId)
  if (!vid) return res.status(400).json({ message: 'missing variant id' })

  const q = (req as any).query || {}
  const original = q.filename || 'file'
  const mime = q.mime || req.headers['content-type'] || 'application/octet-stream'

  const buffer = await readBody(req)

  const uploadsDir = path.resolve(process.cwd(), 'uploads', 'variants')
  fs.mkdirSync(uploadsDir, { recursive: true })
  const safe = `${Date.now()}-${original.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const filePath = path.join(uploadsDir, safe)
  fs.writeFileSync(filePath, buffer)

  const repo = AppDataSource.getRepository(VariantFile)
  const vf = repo.create({
    variantId: vid,
    originalName: original,
    filename: safe,
    mimeType: mime,
    size: buffer.length,
  } as any)
  const saved = await repo.save(vf as any)

  return res.status(201).json({ id: saved.id, original_name: saved.originalName, download_url: `/uploads/variants/${saved.filename}`, size: saved.size })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  console.log("[custom/admin/variant-files] auth header:", req.headers.authorization)
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization");

  if (!AppDataSource.isInitialized) await AppDataSource.initialize()

  const { variantId, fileId } = (req as any).params || {}
  const vid = Number(variantId)
  const fid = Number(fileId)
  if (!vid || !fid) return res.status(400).json({ message: 'missing id' })

  const repo = AppDataSource.getRepository(VariantFile)
  const file = await repo.findOne({ where: { id: fid, variantId: vid } } as any)
  if (!file) return res.status(404).json({ message: 'not found' })

  const filePath = path.resolve(process.cwd(), 'uploads', 'variants', file.filename)
  try { fs.unlinkSync(filePath) } catch (e) {}
  await repo.delete({ id: fid } as any)
  return res.json({ ok: true })
}
