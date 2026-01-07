import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { requireAdmin } from "../../../middlewares/auth"
import { RoleService } from "../../../../services/role-service"

const svc = new RoleService()

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  if (!(await requireAdmin(req as any, res as any))) return
  console.log("[custom/admin/permissions] auth header:", req.headers.authorization)
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization");

  try {
    const permissions = await svc.getAllPermissions()
    return res.json({ permissions })
  } catch (err: any) {
    return res.status(500).json({ message: String(err.message || err) })
  }
}
