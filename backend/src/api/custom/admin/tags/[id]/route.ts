import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Tag } from "../../../../../models/tag"
import { ensureDataSource, setAdminCors } from "../../_utils"

export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) {
  setAdminCors(res)
  return res.sendStatus(200)
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  setAdminCors(res)

  const id = Number((req.params as any)?.id)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "invalid id" })
  }

  const name = String((req.body as any)?.name ?? "").trim()
  if (!name) {
    return res.status(400).json({ message: "name is required" })
  }

  const ds = await ensureDataSource()
  const repo = ds.getRepository(Tag)

  await repo.update({ id } as any, { name } as any)
  const updated = await repo.findOne({ where: { id } as any })

  return res.json({ item: updated })
}

export async function DELETE(
  req: MedusaRequest,
  res: MedusaResponse
) {
  setAdminCors(res)

  const id = Number((req.params as any)?.id)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "invalid id" })
  }

  const ds = await ensureDataSource()
  const repo = ds.getRepository(Tag)

  await repo.delete({ id } as any)
  return res.json({ ok: true })
}
