import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import path from "path"
import fs from "fs"
import { AppDataSource } from "../../../../../datasource/data-source"
import { AudioFile } from "../../../../../models/audio-file"
import { setStoreCors } from "../../_cors"

function safeJoin(dir: string, filename: string) {
  const full = path.join(dir, filename)
  const normalizedDir = path.resolve(dir) + path.sep
  const normalizedFull = path.resolve(full)
  if (!normalizedFull.startsWith(normalizedDir)) {
    throw new Error("invalid path")
  }
  return normalizedFull
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

  const id = Number((req.params as any)?.id)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "invalid id" })
  }

  const repo = AppDataSource.getRepository(AudioFile)
  const row = await repo.findOne({ where: { id } as any })
  if (!row || !row.coverFilename) {
    return res.status(404).json({ message: "not found" })
  }

  const uploadsDir = process.env.AUDIO_UPLOAD_DIR || path.join(process.cwd(), "uploads")
  const filePath = safeJoin(uploadsDir, row.coverFilename)

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "file not found" })
  }

  res.setHeader("Content-Type", row.coverMimeType || "application/octet-stream")
  fs.createReadStream(filePath).pipe(res as any)
}
