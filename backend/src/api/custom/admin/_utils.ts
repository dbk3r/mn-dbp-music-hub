import type { MedusaResponse } from "@medusajs/framework/http"
import { AppDataSource } from "../../../datasource/data-source"

export async function ensureDataSource() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  return AppDataSource
}

export function setAdminCors(res: MedusaResponse) {
  const origin = (process.env.ADMIN_CORS || "http://localhost:7001")
    .split(",")[0]
    ?.trim()

  res.header("Access-Control-Allow-Origin", origin)
  res.header("Vary", "Origin")
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type")
}
