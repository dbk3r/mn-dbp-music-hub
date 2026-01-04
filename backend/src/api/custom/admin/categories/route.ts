import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AppDataSource } from "../../../../datasource/data-source"
import { Category } from "../../../../models/category"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  console.log("[custom/admin/categories] auth header:", req.headers.authorization)
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization");

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  const repo = AppDataSource.getRepository(Category)
  const categories = await repo.find()

  const result = categories.map(cat => ({ id: cat.id, name: cat.name }))
  return res.json({ items: result })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  console.log("[custom/admin/categories] auth header:", req.headers.authorization)
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

  const repo = AppDataSource.getRepository(Category)
  const category = repo.create({ name: String(name).trim() } as any)
  const saved = (await repo.save(category as any)) as Category

  return res.json({ id: saved.id, name: saved.name })
}