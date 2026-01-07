import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AppDataSource } from "../../../datasource/data-source"
import { Order } from "../../../models/order"
import { Product } from "../../../models/product"
import { ProductVariant } from "../../../models/product-variant"
import { VariantFile } from "../../../models/variant-file"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-me"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  if (!res.headersSent) {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Methods", "GET, OPTIONS")
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, x-publishable-api-key")
  }

  // Manually validate JWT token
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    if (!res.headersSent) {
      return res.status(401).json({ message: "Nicht authentifiziert" })
    }
    return
  }

  const token = authHeader.substring(7)
  let customerId: string | null = null

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    const userId = decoded.userId || decoded.sub
    
    if (!userId) {
      if (!res.headersSent) {
        return res.status(401).json({ message: "Keine User ID im Token" })
      }
      return
    }

    // Map userId to customerId via email lookup
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize()
    }

    const User = require("../../../models/user").User
    const userRepo = AppDataSource.getRepository(User)
    const user = await userRepo.findOne({ where: { id: userId } as any })
    
    if (user && (user as any).email) {
      const email = (user as any).email
      const rows: any[] = await AppDataSource.query(
        `SELECT id FROM customer WHERE email = $1 LIMIT 1`,
        [email]
      )
      if (rows && rows.length > 0) {
        customerId = String(rows[0].id)
      }
    }
  } catch (err) {
    console.log("[store/orders] Token validation failed:", String(err))
    if (!res.headersSent) {
      return res.status(401).json({ message: "Ungültiger Token" })
    }
    return
  }

  if (!customerId) {
    if (!res.headersSent) {
      return res.status(401).json({ message: "Keine Customer ID im Token" })
    }
    return
  }

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  try {
    const orderRepo = AppDataSource.getRepository(Order)
    const productRepo = AppDataSource.getRepository(Product)
    const variantRepo = AppDataSource.getRepository(ProductVariant)
    const fileRepo = AppDataSource.getRepository(VariantFile)

    // Find orders for this customer
    const orders = await orderRepo.find({
      where: { customerId: customerId as string },
      order: { createdAt: "DESC" } as any
    })

    console.log(`[store/orders] Found ${orders.length} orders for customer ${customerId}`)

    // Enrich orders with download files
    const enriched = await Promise.all(orders.map(async (order) => {
      const enrichedItems = await Promise.all((order.items || []).map(async (item) => {
        // 1. Find product by audio_file_id (which is item.audio_id)
        const product = await productRepo.findOne({
          where: { audioFileId: item.audio_id } as any
        })

        console.log(`[store/orders] Item audio_id=${item.audio_id} → product=${product?.id}`)

        if (!product) {
          console.log(`[store/orders] No product found for audio_id=${item.audio_id}`)
          return {
            ...item,
            title: item.title,
            unit_price: item.price_cents / 100,
            variant: { files: [] }
          }
        }

        // 2. Find variant by product_id and license_model_id
        const variant = await variantRepo.findOne({
          where: { 
            productId: product.id,
            licenseModelId: item.license_model_id 
          } as any
        })

        console.log(`[store/orders] Product ${product.id} + license ${item.license_model_id} → variant=${variant?.id}`)

        if (!variant) {
          console.log(`[store/orders] No variant found for product=${product.id} license=${item.license_model_id}`)
          return {
            ...item,
            title: item.title,
            unit_price: item.price_cents / 100,
            variant: { files: [] }
          }
        }

        // 3. Get files for this variant
        const files = await fileRepo.find({
          where: { variantId: variant.id } as any
        })

        console.log(`[store/orders] Variant ${variant.id} → ${files.length} files`)

        const fileList = files.map(f => ({
          id: f.id,
          filename: f.filename,
          original_name: f.originalName,
          size: f.size,
          download_url: `/custom/uploads/variants/${f.filename}`,
          url: `/custom/uploads/variants/${f.filename}`
        }))

        return {
          ...item,
          title: item.title,
          unit_price: item.price_cents / 100,
          variant: {
            files: fileList
          }
        }
      }))

      return {
        id: order.id,
        order_id: order.orderId,
        created_at: order.createdAt,
        status: order.status,
        total: order.totalPriceCents / 100,
        currency_code: order.currencyCode,
        items: enrichedItems
      }
    }))

    console.log(`[store/orders] Returning ${enriched.length} orders with enriched items`)
    
    if (!res.headersSent) {
      res.status(200).json(enriched)
      return
    }
  } catch (err) {
    console.error("[store/orders] Error:", err)
    if (!res.headersSent) {
      return res.status(500).json({ message: "Fehler beim Laden der Bestellungen" })
    }
  }
}

export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, x-publishable-api-key")
  res.status(204).send("")
}
