import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import path from "path"
import fs from "fs"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const filename = req.params.filename
  
  if (!filename || typeof filename !== 'string') {
    return res.status(400).json({ message: "Invalid filename" })
  }

  // Security: prevent directory traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({ message: "Invalid filename" })
  }

  const filePath = path.join(process.cwd(), "uploads", "avatars", filename)

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "File not found" })
  }

  // Get file extension to set content type
  const ext = path.extname(filename).toLowerCase()
  const contentTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp'
  }

  const contentType = contentTypes[ext] || 'application/octet-stream'

  // Set cache headers
  res.setHeader('Content-Type', contentType)
  res.setHeader('Cache-Control', 'public, max-age=31536000') // 1 year

  // Stream the file
  const fileStream = fs.createReadStream(filePath)
  fileStream.pipe(res as any)
}
