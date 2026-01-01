import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { LicenseModel } from "../../../../models/license-model"
import { ensureDataSource, setAdminCors } from "../_utils"

export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) {
  setAdminCors(res)
  return res.sendStatus(200)
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  setAdminCors(res)

  const ds = await ensureDataSource()
  const repo = ds.getRepository(LicenseModel)

  const items = await repo.find({ order: { id: "DESC" } as any })
  return res.json({ items })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  setAdminCors(res)

  const body = (req.body as any) || {}
  const name = String(body?.name ?? "").trim()
  if (!name) {
    return res.status(400).json({ message: "name is required" })
  }

  const icon = body?.icon != null ? String(body.icon).trim() || null : null
  const description =
    body?.description != null ? String(body.description).trim() || null : null
  const legalDescription =
    body?.legalDescription != null
      ? String(body.legalDescription).trim() || null
      : null

  const priceCentsRaw = body?.priceCents
  const priceCents = Number.isFinite(Number(priceCentsRaw))
    ? Math.max(0, Math.trunc(Number(priceCentsRaw)))
    : 0

  const ds = await ensureDataSource()
  const repo = ds.getRepository(LicenseModel)

  const created = repo.create({
    name,
    icon,
    description,
    legalDescription,
    priceCents,
  } as any)
  const saved = await repo.save(created)

  return res.status(201).json({ item: saved })
}
