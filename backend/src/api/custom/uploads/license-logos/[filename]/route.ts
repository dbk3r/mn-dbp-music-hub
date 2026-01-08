import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import fs from "fs"
import path from "path"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { filename } = req.params
    
    if (!filename || typeof filename !== "string") {
      return res.status(400).json({ message: "Filename required" })
    }

    const filepath = path.join(process.cwd(), "uploads", "license-logos", filename)

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ message: "File not found" })
    }

    const stats = fs.statSync(filepath)
    const ext = path.extname(filename).toLowerCase()
    
    let contentType = "application/octet-stream"
    if (ext === ".png") contentType = "image/png"
    else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg"
    else if (ext === ".gif") contentType = "image/gif"
    else if (ext === ".svg") contentType = "image/svg+xml"

    res.setHeader("Content-Type", contentType)
    res.setHeader("Content-Length", stats.size)
    res.setHeader("Cache-Control", "public, max-age=31536000")

    const stream = fs.createReadStream(filepath)
    stream.pipe(res)
  } catch (err) {
    console.error("[uploads/license-logos] Error:", err)
    return res.status(500).json({ message: "Error serving file" })
  }
}
