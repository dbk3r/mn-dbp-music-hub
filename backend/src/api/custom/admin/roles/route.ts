import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { requireAdmin } from "../../../middlewares/auth"
import { RoleService } from "../../../../services/role-service"

const svc = new RoleService()

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  if (!(await requireAdmin(req as any, res as any))) return
  console.log("[custom/admin/roles] auth header:", req.headers.authorization)
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization");

  try {
    const roles = await svc.getAllRoles()
    return res.json({ roles })
  } catch (err: any) {
    return res.status(500).json({ message: String(err.message || err) })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  console.log("[custom/admin/roles] auth header:", req.headers.authorization)
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization");

  try {
    const body = (req as any).body || {}
    const created = await svc.createRole(body.name, body.description || "", body.permission_ids || [])
    return res.status(201).json(created)
  } catch (err: any) {
    return res.status(400).json({ message: String(err.message || err) })
  }
}

export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  console.log("[custom/admin/roles/:id] auth header:", req.headers.authorization)
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization");

  const id = Number((req as any).params?.id)
  if (!id) return res.status(400).json({ message: "missing id" })

  try {
    const body = (req as any).body || {}
    const updated = await svc.updateRole(id, body.name, body.description, body.permission_ids || undefined)
    return res.json(updated)
  } catch (err: any) {
    return res.status(400).json({ message: String(err.message || err) })
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  console.log("[custom/admin/roles/:id] auth header:", req.headers.authorization)
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization");

  const id = Number((req as any).params?.id)
  if (!id) return res.status(400).json({ message: "missing id" })

  try {
    await svc.deleteRole(id)
    return res.json({ ok: true })
  } catch (err: any) {
    return res.status(400).json({ message: String(err.message || err) })
  }
}
