import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import jwt from "jsonwebtoken"
import { AppDataSource } from "../../datasource/data-source"
import { User } from "../../models/user"

const JWT_SECRET = process.env.JWT_SECRET || "supersecret"

export interface AuthenticatedRequest extends MedusaRequest {
  user?: User
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: MedusaResponse,
  next?: () => void
): Promise<boolean> {
  const auth = req.headers.authorization
  console.log("auth header:", typeof auth === 'string' ? auth.slice(0, 30) + (auth.length > 30 ? '...' : '') : auth)
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ message: "unauthorized" })
    return false
  }

  const token = auth.slice(7)

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    console.log("token decoded for userId:", (decoded && decoded.userId) || null)
    
    if (decoded.mfaPending) {
      res.status(401).json({ message: "mfa verification required" })
      return false
    }

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize()
    }

    const repo = AppDataSource.getRepository(User)
    const user = await repo.findOne({
      where: { id: decoded.userId },
      relations: ["roles", "roles.permissions"]
    } as any)

    if (!user || !user.isActive) {
      res.status(401).json({ message: "unauthorized" })
      return false
    }

    req.user = user
    if (next) next()
    return true
  } catch (err) {
    console.error("jwt verify error:", err && err.message ? err.message : err)
    res.status(401).json({ message: "invalid token" })
    return false
  }
}

export async function requirePermission(
  req: AuthenticatedRequest,
  res: MedusaResponse,
  resource: string,
  action: string
): Promise<boolean> {
  if (!req.user) {
    const authed = await requireAuth(req, res)
    if (!authed) return false
  }

  const user = req.user!
  
  // Admin-Rolle hat immer alle Rechte
  if (user.roles.some(r => r.name === "admin")) {
    return true
  }

  // Prüfe ob User die erforderliche Berechtigung hat
  const hasPermission = user.roles.some(role =>
    role.permissions?.some(p => p.resource === resource && p.action === action)
  )

  if (!hasPermission) {
    res.status(403).json({ message: "insufficient permissions" })
    return false
  }

  return true
}
