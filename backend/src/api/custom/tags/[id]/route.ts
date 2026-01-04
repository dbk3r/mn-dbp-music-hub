import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AppDataSource } from "../../../../datasource/data-source"
import { Tag } from "../../../../models/tag"

function setCors(req: MedusaRequest, res: MedusaResponse) {
  const allowed = (process.env.STORE_CORS || "http://localhost:3000")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)

  const reqOrigin = String(req.headers.origin || "")
  const origin = (reqOrigin && allowed.includes(reqOrigin) ? reqOrigin : allowed[0])
    ?.trim()

  res.header("Access-Control-Allow-Origin", origin)
  res.header("Vary", "Origin")
  res.header("Access-Control-Allow-Methods", "GET, DELETE, OPTIONS")
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, x-publishable-api-key"
  )
}

export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) {
  setCors(req, res)
  return res.sendStatus(200)
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  setCors(req, res)

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  const params = await req.params
  const id = parseInt(params.id)

  if (!id) {
    return res.status(400).json({ message: "ID is required" })
  }

  const repo = AppDataSource.getRepository(Tag)
  const item = await repo.findOne({ where: { id } } as any)

  if (!item) {
    return res.status(404).json({ message: "Tag not found" })
  }

  await repo.remove(item)

  return res.json({ message: "Tag deleted" })
}
