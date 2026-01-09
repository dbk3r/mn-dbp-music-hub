import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AppDataSource } from "../../../../datasource/data-source"
import { AudioFile } from "../../../../models/audio-file"
import { requireAuth, AuthenticatedRequest } from "../../../middlewares/auth"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  console.log("[custom/admin/audio] auth header:", req.headers.authorization)
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization");

  // Authentifizierung erforderlich
  const authed = await requireAuth(req as AuthenticatedRequest, res)
  if (!authed) return

  const authReq = req as AuthenticatedRequest
  const user = authReq.user!

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  const repo = AppDataSource.getRepository(AudioFile)
  
  // Prüfe ob User Admin ist oder Vendor-Rolle hat
  const isAdmin = user.roles.some(r => r.name === "admin")
  const isVendor = user.roles.some(r => r.name === "vendor")
  
  let audioFiles: AudioFile[] = []
  
  if (isAdmin) {
    // Admin sieht alle Dateien
    audioFiles = await repo.find()
  } else if (isVendor) {
    // Vendor sieht nur seine eigenen Uploads
    audioFiles = await repo.find({
      where: { uploadedBy: user.id }
    } as any)
  } else {
    // Andere Rollen haben keinen Zugriff
    return res.status(403).json({ message: "insufficient permissions" })
  }

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
    uploaded_by: audio.uploadedBy,
    created_at: audio.createdAt,
  }))

  res.json({ items: result })
}