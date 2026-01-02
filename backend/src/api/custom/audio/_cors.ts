import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export function setStoreCors(req: MedusaRequest, res: MedusaResponse) {
  const allowed = (process.env.STORE_CORS || "http://localhost:3000")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)

  const reqOrigin = String(req.headers.origin || "")
  const origin = (reqOrigin && allowed.includes(reqOrigin) ? reqOrigin : allowed[0])
    ?.trim()

  res.header("Access-Control-Allow-Origin", origin)
  res.header("Vary", "Origin")
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type")
}
