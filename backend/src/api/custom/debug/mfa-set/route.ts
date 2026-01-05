// Debug route removed — returning 410 Gone to avoid accidental test PIN issuance.
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function POST(_req: MedusaRequest, res: MedusaResponse) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization")
  return res.status(410).json({ message: "debug endpoint removed" })
}
