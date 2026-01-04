import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AppDataSource } from "../../../../../datasource/data-source"
import { User } from "../../../../../models/user"
import { Role } from "../../../../../models/role"

export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  console.log("[custom/admin/users/:id] PATCH auth header:", req.headers.authorization)
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS, PUT, DELETE, PATCH");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization");

  if (!AppDataSource.isInitialized) await AppDataSource.initialize()

  const id = (req as any).params?.id
  const body = (req as any).body || {}
  console.log('[custom/admin/users/:id] id=', id, 'body=', body)

  if (!id) return res.status(400).json({ message: "missing id" })

  const repo = AppDataSource.getRepository(User)
  const user = await repo.findOne({ where: { id } } as any)
  if (!user) return res.status(404).json({ message: "not found" })

  if (body.is_active !== undefined) user.isActive = !!body.is_active
  if (body.display_name !== undefined) user.displayName = body.display_name

  if (Array.isArray(body.role_ids)) {
    const roleRepo = AppDataSource.getRepository(Role)
    const roles = await roleRepo.findByIds(body.role_ids as number[])
    user.roles = roles as any
  }

  const saved = await repo.save(user as any)

  const mapped = {
    id: saved.id,
    email: saved.email,
    display_name: saved.displayName ?? null,
    is_active: saved.isActive,
    mfa_enabled: saved.mfaEnabled,
    status: saved.status,
    roles: (saved.roles || []).map(r => ({ id: r.id, name: r.name })),
    created_at: saved.createdAt,
  }

  return res.json({ ok: true, user: mapped })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  console.log("[custom/admin/users/:id] DELETE auth header:", req.headers.authorization)
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS, PUT, DELETE, PATCH");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization");

  if (!AppDataSource.isInitialized) await AppDataSource.initialize()

  const id = (req as any).params?.id
  console.log('[custom/admin/users/:id] delete id=', id)
  if (!id) return res.status(400).json({ message: "missing id" })

  const repo = AppDataSource.getRepository(User)
  const user = await repo.findOne({ where: { id } } as any)
  if (!user) return res.status(404).json({ message: "not found" })

  await repo.remove(user as any)
  return res.json({ ok: true })
}
