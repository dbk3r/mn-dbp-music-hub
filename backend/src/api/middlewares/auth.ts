import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import jwt from "jsonwebtoken"
import { AppDataSource } from "../../datasource/data-source"
import { User } from "../../models/user"

const JWT_SECRET = process.env.JWT_SECRET || "supersecret"

export interface AuthenticatedRequest extends MedusaRequest {
  user?: User
}

// Hinweis: Benutzer können mehrere Rollen besitzen. `requireAuth` prüft
// lediglich die Identität und `isActive`-Status; spezifische Rechte
// werden durch `requirePermission` oder `requireAdmin` geprüft.

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
  // Allow short-lived service JWTs signed with BACKEND_SERVICE_KEY (server-to-server)
  const serviceKey = process.env.BACKEND_SERVICE_KEY
  if (serviceKey) {
    try {
      const decodedSvc = jwt.verify(token, serviceKey, { algorithms: ["HS256"] }) as any
      if (decodedSvc && decodedSvc.service === "admin") {
        console.log("service jwt accepted - treating as admin service token")
        // Create a minimal synthetic admin user so downstream permission checks pass
        req.user = {
          id: "service-admin",
          email: "service@internal",
          isActive: true,
          roles: [
            {
              id: 0,
              name: "admin",
              permissions: [],
            },
          ],
        } as any
        if (next) next()
        return true
      }
    } catch (e) {
      // Not a valid service token; fallthrough to normal user verification
      console.log("service jwt verify failed (fallthrough):", e && (e as any).message ? (e as any).message : e)
    }
  }

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

export async function requireAdmin(
  req: AuthenticatedRequest,
  res: MedusaResponse
): Promise<boolean> {
  const authed = await requireAuth(req, res)
  if (!authed) return false

  const user = req.user!
  if (!user.roles || !user.roles.some(r => r.name === "admin")) {
    res.status(403).json({ message: "admin only" })
    return false
  }

  return true
}
