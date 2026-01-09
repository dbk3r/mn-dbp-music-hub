import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { requireAdmin, AuthenticatedRequest } from "../../../middlewares/auth"
import { AppDataSource } from "../../../../datasource/data-source"
import { Role } from "../../../../models/role"
import { Permission } from "../../../../models/permission"
import jwt from "jsonwebtoken"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization")

  const JWT_SECRET = process.env.JWT_SECRET || "supersecret"
  const authHeader = (req.headers.authorization || "") as string

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "unauthorized" })
  }

  const bearer = authHeader.slice(7)
  const serviceKey = process.env.BACKEND_SERVICE_KEY

  let accepted = false
  if (serviceKey) {
    try {
      const decodedSvc = jwt.verify(bearer, serviceKey, { algorithms: ["HS256"] }) as any
      if (decodedSvc && decodedSvc.service === "admin") accepted = true
    } catch (e) {
      // ignore
    }
  }

  if (!accepted) {
    try {
      const decoded = jwt.verify(bearer, JWT_SECRET) as any
      if (decoded && decoded.mfaPending) return res.status(401).json({ message: "mfa verification required" })
      accepted = true
    } catch (err) {
      return res.status(401).json({ message: "invalid token" })
    }
  }

  if (!accepted) {
    return res.status(401).json({ message: "unauthorized" })
  }

  const authed = await requireAdmin(req as AuthenticatedRequest, res)
  if (!authed) return

  if (!AppDataSource.isInitialized) await AppDataSource.initialize()

  const roleRepo = AppDataSource.getRepository(Role)
  const permRepo = AppDataSource.getRepository(Permission)

  // Lade alle Rollen mit ihren Permissions
  const roles = await roleRepo
    .createQueryBuilder("role")
    .leftJoinAndSelect("role.permissions", "permission")
    .orderBy("role.name", "ASC")
    .getMany()

  // Lade alle verfügbaren Permissions
  const allPermissions = await permRepo.find({ 
    order: { resource: "ASC", action: "ASC" } 
  } as any)

  // Gruppiere Permissions nach Resource
  const permissionsByResource = allPermissions.reduce((acc: any, p: any) => {
    if (!acc[p.resource]) {
      acc[p.resource] = []
    }
    acc[p.resource].push({
      id: p.id,
      resource: p.resource,
      action: p.action,
      description: p.description,
    })
    return acc
  }, {})

  const rolesData = roles.map((role: any) => ({
    id: role.id,
    name: role.name,
    description: role.description,
    permissions: (role.permissions || []).map((p: any) => ({
      id: p.id,
      resource: p.resource,
      action: p.action,
      description: p.description,
    })),
  }))

  return res.json({ 
    roles: rolesData,
    availablePermissions: permissionsByResource,
  })
}

export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization")

  const authed = await requireAdmin(req as AuthenticatedRequest, res)
  if (!authed) return

  const { roleId, permissionIds } = req.body as any

  if (!roleId || !Array.isArray(permissionIds)) {
    return res.status(400).json({ message: "roleId and permissionIds array are required" })
  }

  if (!AppDataSource.isInitialized) await AppDataSource.initialize()

  const roleRepo = AppDataSource.getRepository(Role)
  const permRepo = AppDataSource.getRepository(Permission)

  const role = await roleRepo.findOne({ 
    where: { id: roleId },
    relations: ["permissions"]
  } as any)

  if (!role) {
    return res.status(404).json({ message: "Role not found" })
  }

  // Lade die neuen Permissions
  const newPermissions = await permRepo.findByIds(permissionIds)

  // Setze die neuen Permissions
  role.permissions = newPermissions

  await roleRepo.save(role)

  return res.json({
    id: role.id,
    name: role.name,
    description: role.description,
    permissions: role.permissions.map((p: any) => ({
      id: p.id,
      resource: p.resource,
      action: p.action,
      description: p.description,
    })),
  })
}

export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization")
  return res.status(204).send("")
}

