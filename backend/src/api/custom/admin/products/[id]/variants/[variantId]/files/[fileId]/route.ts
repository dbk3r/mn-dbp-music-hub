import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import path from "path"
import fs from "fs/promises"
import { ensureDataSource, setAdminCors } from "../../../../../../_utils"
import { VariantFile } from "../../../../../../models"

export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) {
  setAdminCors(res)
  return res.sendStatus(200)
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  setAdminCors(res)

  const fileId = Number((req.params as any).fileId)
  if (!Number.isFinite(fileId)) {
    return res.status(400).json({ message: "invalid file id" })
  }

  const ds = await ensureDataSource()
  const repo = ds.getRepository(VariantFile)

  const file = await repo.findOne({ where: { id: fileId } as any })
  if (!file) {
    return res.status(404).json({ message: "file not found" })
  }

  const uploadsDir = process.env.AUDIO_UPLOAD_DIR || path.join(process.cwd(), "uploads")
  const fullPath = path.join(uploadsDir, file.filename)

  try {
    await fs.access(fullPath)
  } catch {
    return res.status(404).json({ message: "file not found on disk" })
  }

  res.setHeader("Content-Type", file.mimeType)
  res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(file.originalName)}"`)
  res.setHeader("Content-Length", String(file.size))

  const stream = require("fs").createReadStream(fullPath)
  stream.pipe(res)
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  setAdminCors(res)

  const fileId = Number((req.params as any).fileId)
  if (!Number.isFinite(fileId)) {
    return res.status(400).json({ message: "invalid file id" })
  }

  const ds = await ensureDataSource()
  const repo = ds.getRepository(VariantFile)

  const file = await repo.findOne({ where: { id: fileId } as any })
  if (!file) {
    return res.status(404).json({ message: "file not found" })
  }

  const uploadsDir = process.env.AUDIO_UPLOAD_DIR || path.join(process.cwd(), "uploads")
  const fullPath = path.join(uploadsDir, file.filename)

  await fs.unlink(fullPath).catch(() => {})

  await repo.remove(file)

  return res.json({ id: fileId, deleted: true })
}
