import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AppDataSource } from "../../../../datasource/data-source"
import { Order } from "../../../../models/order"
import { AudioVariant } from "../../../../models/audio-variant"
import { AudioVariantFile } from "../../../../models/audio-variant-file"
import { LicenseModel } from "../../../../models/license-model"
import jwt from "jsonwebtoken"
import { requireAdmin } from "../../../middlewares/auth"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization")

  const JWT_SECRET = process.env.JWT_SECRET || "supersecret"
  const authHeader = (req.headers.authorization || "") as string

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "unauthorized" })
  }

  const bearer = authHeader.slice(7)
  const serviceToken = process.env.BACKEND_SERVICE_TOKEN
  const serviceKey = process.env.BACKEND_SERVICE_KEY

  if (serviceToken && bearer === serviceToken) {
    // deprecated static token path
  }

    if (!(serviceToken && bearer === serviceToken)) {
      let accepted = false
    // 1) try service JWT signed with BACKEND_SERVICE_KEY
    if (serviceKey) {
      try {
        const decodedSvc = jwt.verify(bearer, serviceKey, { algorithms: ["HS256"] }) as any
        if (decodedSvc && decodedSvc.service === "admin") accepted = true
      } catch (e) {
        // ignore and try next
      }
    }

    // 2) fallback: try user/admin JWT signed with JWT_SECRET
    if (!accepted) {
      try {
        const decoded = jwt.verify(bearer, JWT_SECRET) as any
        if (decoded && decoded.mfaPending) return res.status(401).json({ message: "mfa verification required" })
        // set a temporary field so requireAdmin can reuse verification
        ;(req as any).__decoded_jwt = decoded
        accepted = true
      } catch (err) {
        return res.status(401).json({ message: "invalid token" })
      }
    }
  }
  // If accepted via service token, allow. Otherwise enforce admin role.
  if (!(serviceToken && bearer === serviceToken)) {
    // reuse requireAdmin which verifies token again; but if we have decoded JWT already, stash userId
    const ok = await requireAdmin(req as any, res as any)
    if (!ok) return
  }
  if (!AppDataSource.isInitialized) await AppDataSource.initialize()
  try {
    // Fetch orders joined with customer info and return buyer name/email and
    // purchased product titles. Use raw SQL for a stable shape that works
    // independently of TypeORM mapping issues.
    const rows: any[] = await AppDataSource.query(`
      SELECT o.id, o.order_id, o.license_number, o.status, o."totalPriceCents", o."currencyCode", o.items, o."createdAt",
             o.vendor_paid, o.vendor_paid_at, o.vendor_paid_by,
             c.email as customer_email, c.first_name as customer_first_name, c.last_name as customer_last_name
      FROM orders o
      LEFT JOIN customer c ON c.id::text = o."customerId"::text
      ORDER BY o."createdAt" DESC
    `)

    const audioVariantRepo = AppDataSource.getRepository(AudioVariant)
    const audioVariantFileRepo = AppDataSource.getRepository(AudioVariantFile)
    const licenseModelRepo = AppDataSource.getRepository(LicenseModel)

    const finalOrders = await Promise.all((rows || []).map(async (r: any) => {
      let items = r.items
      try {
        if (typeof items === 'string' && items.trim()) items = JSON.parse(items)
      } catch (e) {
        items = []
      }

      console.log(`[Orders] Processing order ${r.order_id}, items:`, items)

      // Enrich items with variant and file data
      const enrichedItems = await Promise.all(
        (Array.isArray(items) ? items : []).map(async (item: any) => {
          const audioFileId = item.audio_file_id || item.audio_id
          const licenseModelId = item.license_model_id

          if (!audioFileId || !licenseModelId) {
            console.log('[Orders] Skipping item - missing IDs:', { audioFileId, licenseModelId, item })
            return item
          }

          console.log(`[Orders] Looking for variant: audioFileId=${audioFileId}, licenseModelId=${licenseModelId}`)

          // Find the audio variant
          const variant = await audioVariantRepo.findOne({
            where: {
              audioFileId,
              licenseModelId,
            },
          })

          if (!variant) {
            console.log('[Orders] No variant found for:', { audioFileId, licenseModelId })
            return item
          }

          // Get license model name
          const licenseModel = await licenseModelRepo.findOne({
            where: { id: licenseModelId },
          })

          // Get variant files
          const files = await audioVariantFileRepo.find({
            where: { audioVariantId: variant.id },
            order: { createdAt: "ASC" },
          })

          console.log('[Orders] Enriched item:', { 
            audioFileId, 
            licenseModelId, 
            variantId: variant.id,
            variantName: variant.name,
            filesCount: files.length,
            fileNames: files.map(f => f.filename)
          })

          return {
            ...item,
            variant: {
              id: variant.id,
              name: variant.name,
              license_model_name: licenseModel?.name || "Unknown License",
              files: files
                .filter(file => {
                  // Include non-PDF files
                  if (!file.filename.endsWith('.pdf')) return true
                  // For PDFs, only include if they match this order
                  return file.filename.includes(`license-${r.order_id}-`)
                })
                .map((file) => ({
                  id: file.id,
                  filename: file.filename,
                  originalName: file.originalName,
                  mimeType: file.mimeType,
                  size: file.size,
                  createdAt: file.createdAt,
                })),
            },
          }
        })
      )

      const productTitles = enrichedItems.map((it: any) => it.title).filter(Boolean)
      return {
        id: r.order_id || (`order_${r.id}`),
        numeric_id: r.id,
        license_number: r.license_number || null,
        status: (r.status || '').toUpperCase(),
        totalPriceCents: r.totalPriceCents || 0,
        currencyCode: r.currencyCode || 'EUR',
        customer_email: r.customer_email || null,
        customer_name: [r.customer_first_name, r.customer_last_name].filter(Boolean).join(' ') || null,
        createdAt: r.createdAt,
        items: enrichedItems,
        product_titles: productTitles,
        vendor_paid: r.vendor_paid || false,
        vendor_paid_at: r.vendor_paid_at || null,
        vendor_paid_by: r.vendor_paid_by || null,
      }
    }))

    // Map to admin-friendly shape including buyer name/email and product titles
    const out = (finalOrders || []).map((o: any) => ({
      id: `order_${o.id}`,
      order_id: o.id,
      license_number: o.license_number,
      status: (o.status && typeof o.status === 'string') ? o.status.toUpperCase() : null,
      totalPriceCents: o.totalPriceCents || o.totalpricecents || 0,
      currency: o.currencyCode || o.currencycode || 'EUR',
      customer_email: o.customer_email || null,
      customer_name: o.customer_name || null,
      product_titles: Array.isArray(o.product_titles) ? o.product_titles : (o.product_titles ? String(o.product_titles).split(',').map((s: string) => s.trim()) : []),
      created_at: o.createdAt || o.createdat || null,
      items: o.items || [],
      vendor_paid: o.vendor_paid || false,
      vendor_paid_at: o.vendor_paid_at || null,
      vendor_paid_by: o.vendor_paid_by || null,
    }))

    return res.json(out)
  } catch (err: any) {
    console.error('Error fetching orders', err)
    return res.status(500).json({ message: err.message || 'Error fetching orders' })
  }
}
