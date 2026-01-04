import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AppDataSource } from "../../../../datasource/data-source"
import { Tag } from "../../../../models/tag"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  console.log("[custom/admin/tags] auth header:", req.headers.authorization)
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization");

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  const repo = AppDataSource.getRepository(Tag)
  const tags = await repo.find()
  return res.json({ items: tags.map(t => ({ id: t.id, name: t.name })) })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  console.log("[custom/admin/tags] auth header:", req.headers.authorization)
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS, POST, PATCH, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization");

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  const { name } = (req as any).body || {}
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: "Name required" })
  }

  const repo = AppDataSource.getRepository(Tag)
  const tag = repo.create({ name: String(name).trim() } as any)
  const saved = (await repo.save(tag as any)) as Tag

  return res.json({ id: saved.id, name: saved.name })
}