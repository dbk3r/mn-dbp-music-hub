import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AppDataSource } from "../../../../datasource/data-source"
import { AudioFile } from "../../../../models/audio-file"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  console.log("[custom/admin/audio] auth header:", req.headers.authorization)
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization");

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  const repo = AppDataSource.getRepository(AudioFile)
  const audioFiles = await repo.find()

  const result = audioFiles.map(audio => ({
    id: audio.id,
    title: audio.title,
    artist: audio.artist,
    description: audio.description,
    release_year: audio.releaseYear,
    original_name: audio.originalName,
    filename: audio.filename,
    mime_type: audio.mimeType,
    size: audio.size,
    duration_ms: audio.durationMs,
    waveform_peaks: audio.waveformPeaks,
    category_id: audio.categoryId,
    tag_ids: audio.tagIds,
    license_model_ids: audio.licenseModelIds,
    cover_original_name: audio.coverOriginalName,
    cover_mime_type: audio.coverMimeType,
    cover_size: audio.coverSize,
    cover_url: audio.coverFilename ? `/uploads/covers/${audio.coverFilename}` : null,
    stream_url: `/uploads/audio/${audio.filename}`,
    created_at: audio.createdAt,
  }))

  res.json({ items: result })
}