import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { requireAdmin } from "../../../../middlewares/auth"
import { AppDataSource } from "../../../../../datasource/data-source"
import { SystemSettingsService } from "../../../../../services/system-settings-service"
import jwt from "jsonwebtoken"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  if (!(await requireAdmin(req as any, res as any))) return
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
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
      // ignore and try fallback
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

  if (!AppDataSource.isInitialized) await AppDataSource.initialize()
  const svc = new SystemSettingsService()

  const apiKey = await svc.getSetting("tinymce_api_key")

  return res.json({
    tinymce_api_key: apiKey || "",
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!(await requireAdmin(req as any, res as any))) return
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
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
      // ignore and try fallback
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

  if (!AppDataSource.isInitialized) await AppDataSource.initialize()

  const { tinymce_api_key } = req.body as { tinymce_api_key?: string }

  if (typeof tinymce_api_key !== "string") {
    return res.status(400).json({ message: "tinymce_api_key is required" })
  }

  const svc = new SystemSettingsService()
  await svc.setSetting("tinymce_api_key", tinymce_api_key, "TinyMCE Rich Text Editor API Key")

  return res.json({ message: "TinyMCE API-Key gespeichert" })
}

export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization")
  return res.status(204).send("")
}
