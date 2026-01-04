import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AppDataSource } from "../../../../datasource/data-source"
import { User } from "../../../../models/user"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  console.log("[custom/admin/users] auth header:", req.headers.authorization)
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization");

  if (!AppDataSource.isInitialized) await AppDataSource.initialize()

  const repo = AppDataSource.getRepository(User)
  const users = await repo.find()

  const mapped = users.map(u => ({
    id: u.id,
    email: u.email,
    display_name: u.displayName ?? null,
    is_active: u.isActive,
    mfa_enabled: u.mfaEnabled,
    status: u.status,
    roles: (u.roles || []).map(r => ({ id: r.id, name: r.name })),
    created_at: u.createdAt,
  }))

  return res.json({ users: mapped })
}

// PATCH/DELETE moved to users/[id]/route.ts
