import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import path from "path"
import fs from "fs/promises"
import { AudioFile } from "../../../../../../models/audio-file"
import { ensureDataSource, setAdminCors } from "../../../_utils"
import { analyzeAudio } from "../../_audio-analysis"

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

  const ds = await ensureDataSource()
  const repo = ds.getRepository(AudioFile)

  const row = await repo.findOne({ where: { id } as any })
  if (!row) {
    return res.status(404).json({ message: "not found" })
  }

  const uploadsDir = process.env.AUDIO_UPLOAD_DIR || path.join(process.cwd(), "uploads")
  const fullPath = path.join(uploadsDir, row.filename)

  await fs.access(fullPath).catch(() => {
    throw new Error("audio file missing")
  })

  const analysis = await analyzeAudio(fullPath)
  row.durationMs = analysis.durationMs
  row.waveformPeaks = analysis.peaks

  const saved = await repo.save(row)

  return res.json({
    item: {
      id: saved.id,
      duration_ms: saved.durationMs,
      waveform_peaks: saved.waveformPeaks,
    },
  })
}
