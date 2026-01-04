import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AppDataSource } from "../../../datasource/data-source"
import { AudioFile } from "../../../models/audio-file"
import { LicenseModel } from "../../../models/license-model"
import { Order, OrderStatus } from "../../../models/order"
import { setStoreCors } from "../audio/_cors"

async function readJsonBody(req: MedusaRequest): Promise<any> {
  const chunks: Buffer[] = []
  for await (const chunk of req as any) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  const raw = Buffer.concat(chunks).toString("utf8")
  if (!raw.trim()) return null
  return JSON.parse(raw)
}

export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) {
  setStoreCors(req, res)
  return res.sendStatus(200)
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  setStoreCors(req, res)

  // Check authentication
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "authentication required" })
  }

  const token = authHeader.substring(7)
  // TODO: Validate JWT token and extract customer ID
  // For now, use a dummy customer ID
  const customerId = "cus_authenticated" // Should be from JWT

  const body = await readJsonBody(req).catch(() => null)
  const items = Array.isArray(body?.items) ? body.items : []

  if (!items.length) {
    return res.status(400).json({ message: "items required" })
  }

  const normalized = items
    .map((it: any) => ({
      audioId: Number(it.audio_id ?? it.audioId),
      licenseModelId: Number(it.license_model_id ?? it.licenseModelId),
    }))
    .filter((it: any) => Number.isFinite(it.audioId) && Number.isFinite(it.licenseModelId))
    .map((it: any) => ({ audioId: Math.trunc(it.audioId), licenseModelId: Math.trunc(it.licenseModelId) }))

  if (!normalized.length) {
    return res.status(400).json({ message: "invalid items" })
  }

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  const audioRepo = AppDataSource.getRepository(AudioFile)
  const licenseRepo = AppDataSource.getRepository(LicenseModel)
  const orderRepo = AppDataSource.getRepository(Order)

  const audioIds = Array.from(new Set(normalized.map((i) => i.audioId)))
  const licenseIds = Array.from(new Set(normalized.map((i) => i.licenseModelId)))

  const [audios, licenses] = await Promise.all([
    audioRepo.findBy({ id: audioIds as any } as any),
    licenseRepo.findBy({ id: licenseIds as any } as any),
  ])

  const audioById = new Map(audios.map((a) => [a.id, a]))
  const licenseById = new Map(licenses.map((l) => [l.id, l]))

  const detailed: Array<{
    audio_id: number
    title: string
    license_model_id: number
    license_model_name: string
    price_cents: number
  }> = []

  let totalPriceCents = 0

  for (const it of normalized) {
    const audio = audioById.get(it.audioId)
    const license = licenseById.get(it.licenseModelId)

    if (!audio || !license) {
      return res.status(400).json({ message: "unknown audio or license model" })
    }

    const allowed = Array.isArray(audio.licenseModelIds)
      ? audio.licenseModelIds.map((x) => Number(x)).filter((n) => Number.isFinite(n)).map((n) => Math.trunc(n))
      : []

    if (!allowed.includes(license.id)) {
      return res.status(400).json({ message: "license model not allowed for audio" })
    }

    const priceCents = Number(license.priceCents)
    if (!Number.isFinite(priceCents) || priceCents < 0) {
      return res.status(400).json({ message: "invalid license price" })
    }

    detailed.push({
      audio_id: audio.id,
      title: audio.title,
      license_model_id: license.id,
      license_model_name: license.name,
      price_cents: Math.trunc(priceCents),
    })

    totalPriceCents += Math.trunc(priceCents)
  }

  // Create order with authenticated customer
  const order = orderRepo.create({
    customerId,
    status: OrderStatus.PENDING,
    totalPriceCents,
    currencyCode: "EUR",
    items: detailed,
  })

  await orderRepo.save(order)

  return res.json({
    order_id: order.id,
    items: detailed,
    total_price_cents: totalPriceCents,
    currency_code: "eur",
    status: "pending",
  })
}
