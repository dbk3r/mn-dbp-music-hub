import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AppDataSource } from "../../../../../datasource/data-source"
import { AudioFile } from "../../../../../models/audio-file"

export async function PATCH(
  req: MedusaRequest,
  res: MedusaResponse
) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "PATCH, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  const { id } = req.params
  const audioId = Number(id)

  if (!Number.isFinite(audioId)) {
    return res.status(400).json({ message: "Invalid ID" })
  }

  const repo = AppDataSource.getRepository(AudioFile)
  const audio = await repo.findOne({ where: { id: audioId } })

  if (!audio) {
    return res.status(404).json({ message: "Audio file not found" })
  }

  const body = req.body as any
  const {
    title,
    artist,
    description,
    release_year,
    category_id,
    tag_ids,
    license_model_ids,
  } = body

  // Update metadata
  if (title !== undefined) audio.title = String(title)
  if (artist !== undefined) audio.artist = artist ? String(artist) : null
  if (description !== undefined) audio.description = description ? String(description) : null
  if (release_year !== undefined) audio.releaseYear = release_year ? Number(release_year) : null

  // Update product assignments
  if (category_id !== undefined) audio.categoryId = category_id ? Number(category_id) : null
  if (Array.isArray(tag_ids)) audio.tagIds = tag_ids.map(Number)
  if (Array.isArray(license_model_ids)) audio.licenseModelIds = license_model_ids.map(Number)

  await repo.save(audio)

  res.json({
    item: {
      id: audio.id,
      title: audio.title,
      artist: audio.artist,
      description: audio.description,
      release_year: audio.releaseYear,
      category_id: audio.categoryId,
      tag_ids: audio.tagIds,
      license_model_ids: audio.licenseModelIds,
    }
  })
}
