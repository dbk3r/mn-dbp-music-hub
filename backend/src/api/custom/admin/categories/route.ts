import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Category } from "../../../../models/category"
import { ensureDataSource, setAdminCors } from "../_utils"

export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) {
  setAdminCors(res)
  return res.sendStatus(200)
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  setAdminCors(res)

  const ds = await ensureDataSource()
  const repo = ds.getRepository(Category)

  const items = await repo.find({ order: { id: "DESC" } as any })
  return res.json({ items })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  setAdminCors(res)

  const name = String((req.body as any)?.name ?? "").trim()
  if (!name) {
    return res.status(400).json({ message: "name is required" })
  }

  const ds = await ensureDataSource()
  const repo = ds.getRepository(Category)

  const created = repo.create({ name } as any)
  const saved = await repo.save(created)

  return res.status(201).json({ item: saved })
}
