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
  if (!row) {
    return res.status(404).json({ message: "not found" })
  }

  const uploadsDir = process.env.AUDIO_UPLOAD_DIR || path.join(process.cwd(), "uploads")
  const filePath = safeJoin(uploadsDir, row.filename)

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "file not found" })
  }

  const stat = fs.statSync(filePath)
  const size = stat.size

  res.setHeader("Content-Type", row.mimeType || "application/octet-stream")
  res.setHeader("Accept-Ranges", "bytes")

  const range = String(req.headers.range || "")
  if (range.startsWith("bytes=")) {
    const [startStr, endStr] = range.replace("bytes=", "").split("-")
    const start = startStr ? Number(startStr) : 0
    const end = endStr ? Number(endStr) : size - 1

    if (!Number.isFinite(start) || !Number.isFinite(end) || start > end) {
      return res.status(416).end()
    }

    const clampedStart = Math.max(0, Math.min(size - 1, Math.trunc(start)))
    const clampedEnd = Math.max(0, Math.min(size - 1, Math.trunc(end)))

    res.status(206)
    res.setHeader("Content-Range", `bytes ${clampedStart}-${clampedEnd}/${size}`)
    res.setHeader("Content-Length", String(clampedEnd - clampedStart + 1))

    fs.createReadStream(filePath, { start: clampedStart, end: clampedEnd }).pipe(res as any)
    return
  }

  res.setHeader("Content-Length", String(size))
  fs.createReadStream(filePath).pipe(res as any)
}
