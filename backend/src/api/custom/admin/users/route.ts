import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { requireAdmin } from "../../../middlewares/auth"
import { AppDataSource } from "../../../../datasource/data-source"
import { User } from "../../../../models/user"
import { Role } from "../../../../models/role"
import bcrypt from "bcrypt"
import { randomUUID } from "crypto"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  if (!(await requireAdmin(req as any, res as any))) return
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

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!(await requireAdmin(req as any, res as any))) return
  console.log("[custom/admin/users] POST auth header:", req.headers.authorization)
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS, PUT, DELETE, POST");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization");

  if (!AppDataSource.isInitialized) await AppDataSource.initialize()

  const body = (req as any).body || {}
  const { email, display_name, password, roles } = body as any

  if (!email) return res.status(400).json({ message: "missing email" })
  if (!password) return res.status(400).json({ message: "missing password" })

  const userRepo = AppDataSource.getRepository(User)
  const roleRepo = AppDataSource.getRepository(Role)

  // hash password
  const passwordHash = await bcrypt.hash(String(password), 10)

  // resolve roles if provided
  let roleEntities: Role[] = []
  if (Array.isArray(roles) && roles.length > 0) {
    try {
      roleEntities = await roleRepo.findByIds(roles as number[])
    } catch (e) {
      roleEntities = []
    }
  }

  // create user with explicit id similar to create-admin script
  const id = `user_${randomUUID().replace(/-/g, "")}`
  const user = userRepo.create({
    id,
    email,
    passwordHash,
    displayName: display_name || null,
    isActive: true,
    mfaEnabled: false,
    status: "active",
    roles: roleEntities,
  } as any)

  const saved = await userRepo.save(user as any)

  // If requested, also create a customer entity (for store/customer accounts)
  try {
    const createCustomer = (body as any).create_customer === true || (Array.isArray(roles) && roleEntities.some(r => r.name === "customer"))
    if (createCustomer) {
      const scopeReq: any = req as any
      if (scopeReq?.scope?.resolve) {
        const customerService = scopeReq.scope.resolve("customerService")
        if (customerService) {
          // best-effort: ignore errors but log
          await customerService.create({ email, password, first_name: display_name || null })
        }
      }
    }
  } catch (e) {
    console.error("failed to create linked customer:", e)
  }

  const s: any = saved
  const mapped = {
    id: s.id,
    email: s.email,
    display_name: s.displayName ?? null,
    is_active: s.isActive,
    mfa_enabled: s.mfaEnabled,
    status: s.status,
    roles: (s.roles || []).map((r: any) => ({ id: r.id, name: r.name })),
    created_at: s.createdAt,
  }

  return res.status(201).json({ ok: true, user: mapped })
}
