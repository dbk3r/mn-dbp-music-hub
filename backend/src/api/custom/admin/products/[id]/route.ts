import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ensureDataSource, setAdminCors } from "../../_utils"
import { Product } from "../../models"

async function readJsonBody(req: MedusaRequest): Promise<any> {
  const chunks: Buffer[] = []
  for await (const chunk of req as any) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  const raw = Buffer.concat(chunks).toString("utf8")
  if (!raw.trim()) return null
  return JSON.parse(raw)
}

export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) {
  setAdminCors(res)
  return res.sendStatus(200)
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  setAdminCors(res)

  const id = Number((req.params as any).id)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "invalid id" })
  }

  const ds = await ensureDataSource()
  const repo = ds.getRepository(Product)

  const product = await repo.findOne({ where: { id } as any })
  if (!product) {
    return res.status(404).json({ message: "product not found" })
  }

  return res.json({
    id: product.id,
    audio_file_id: product.audioFileId,
    title: product.title,
    description: product.description,
    status: product.status,
    category_id: product.categoryId,
    tag_ids: product.tagIds,
    created_at: product.createdAt?.toISOString?.() ?? String(product.createdAt),
    updated_at: product.updatedAt?.toISOString?.() ?? String(product.updatedAt),
  })
}

export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  setAdminCors(res)

  const id = Number((req.params as any).id)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "invalid id" })
  }

  const body = await readJsonBody(req).catch(() => null)
  if (!body) {
    return res.status(400).json({ message: "invalid body" })
  }

  const ds = await ensureDataSource()
  const repo = ds.getRepository(Product)

  const product = await repo.findOne({ where: { id } as any })
  if (!product) {
    return res.status(404).json({ message: "product not found" })
  }

  if (body.title != null) product.title = String(body.title)
  if (body.description != null) product.description = String(body.description)
  if (body.status != null) product.status = String(body.status)
  if (typeof body.category_id === "number") product.categoryId = body.category_id
  if (Array.isArray(body.tag_ids)) product.tagIds = body.tag_ids

  await repo.save(product)

  return res.json({
    id: product.id,
    audio_file_id: product.audioFileId,
    title: product.title,
    description: product.description,
    status: product.status,
    category_id: product.categoryId,
    tag_ids: product.tagIds,
    updated_at: product.updatedAt?.toISOString?.() ?? String(product.updatedAt),
  })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  setAdminCors(res)

  const id = Number((req.params as any).id)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "invalid id" })
  }

  const ds = await ensureDataSource()
  const repo = ds.getRepository(Product)

  const product = await repo.findOne({ where: { id } as any })
  if (!product) {
    return res.status(404).json({ message: "product not found" })
  }

  await repo.remove(product)

  return res.json({ id, deleted: true })
}
