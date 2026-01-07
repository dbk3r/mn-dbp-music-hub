import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import path from "path"
import fs from "fs"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const filename = (req as any).params?.filename
  if (!filename) {
    return res.status(400).json({ message: "filename required" })
  }

  const filePath = path.resolve(process.cwd(), 'uploads', 'variants', filename)

  // Security: check file exists and is in variants folder
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "file not found" })
  }

  // Send file
  res.setHeader("Content-Type", "application/octet-stream")
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`)
  
  const fileStream = fs.createReadStream(filePath)
  fileStream.pipe(res)
}

export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization")
  res.status(204).send("")
}
