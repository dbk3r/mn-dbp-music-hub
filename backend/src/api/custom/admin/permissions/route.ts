import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { requireAdmin, AuthenticatedRequest } from "../../../middlewares/auth"
import { AppDataSource } from "../../../../datasource/data-source"
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

  // Nur für Admins
  const authed = await requireAdmin(req as AuthenticatedRequest, res)
  if (!authed) return

  if (!AppDataSource.isInitialized) await AppDataSource.initialize()

  const repo = AppDataSource.getRepository(Permission)
  const permissions = await repo.find({ order: { resource: "ASC", action: "ASC" } } as any)

  // Gruppiere nach Resource
  const grouped = permissions.reduce((acc: any, p: any) => {
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

  return res.json({ permissions, grouped })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization")

  const authed = await requireAdmin(req as AuthenticatedRequest, res)
  if (!authed) return

  const { resource, action, description } = req.body as any

  if (!resource || !action) {
    return res.status(400).json({ message: "resource and action are required" })
  }

  if (!AppDataSource.isInitialized) await AppDataSource.initialize()

  const repo = AppDataSource.getRepository(Permission)
  
  // Prüfe ob bereits existiert
  const existing = await repo.findOne({
    where: { resource, action }
  } as any)

  if (existing) {
    return res.status(409).json({ message: "Permission already exists" })
  }

  const permission = repo.create({
    resource,
    action,
    description: description || `${resource}:${action}`,
  })

  await repo.save(permission)

  return res.json({
    id: permission.id,
    resource: permission.resource,
    action: permission.action,
    description: permission.description,
  })
}

export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization")

  const authed = await requireAdmin(req as AuthenticatedRequest, res)
  if (!authed) return

  const { id, description } = req.body as any

  if (!id) {
    return res.status(400).json({ message: "id is required" })
  }

  if (!AppDataSource.isInitialized) await AppDataSource.initialize()

  const repo = AppDataSource.getRepository(Permission)
  const permission = await repo.findOne({ where: { id } } as any)

  if (!permission) {
    return res.status(404).json({ message: "Permission not found" })
  }

  if (description !== undefined) {
    permission.description = description
  }

  await repo.save(permission)

  return res.json({
    id: permission.id,
    resource: permission.resource,
    action: permission.action,
    description: permission.description,
  })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization")

  const authed = await requireAdmin(req as AuthenticatedRequest, res)
  if (!authed) return

  const url = new URL(req.url!, `http://${req.headers.host}`)
  const id = url.searchParams.get("id")

  if (!id) {
    return res.status(400).json({ message: "id is required" })
  }

  if (!AppDataSource.isInitialized) await AppDataSource.initialize()

  const repo = AppDataSource.getRepository(Permission)
  const permission = await repo.findOne({ where: { id: parseInt(id) } } as any)

  if (!permission) {
    return res.status(404).json({ message: "Permission not found" })
  }

  await repo.remove(permission)

  return res.json({ message: "Permission deleted" })
}

export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization")
  return res.status(204).send("")
}
