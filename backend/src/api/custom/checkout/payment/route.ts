import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import Stripe from "stripe"
import { AppDataSource } from "../../../../datasource/data-source"
import { Order } from "../../../../models/order"
import { setStoreCors } from "../../audio/_cors"
import { SystemSettingsService } from "../../../../services/system-settings-service"

// Stripe client will be created at runtime after reading secret from DB (or env fallback)

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

  const body = await readJsonBody(req).catch(() => null)
  if (!body || !body.order_id) {
    return res.status(400).json({ message: "order_id required" })
  }

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  const settingsService = new SystemSettingsService()
  const stripeSettings = await settingsService.getStripeSettings()
  const secretKey = stripeSettings.stripe_secret_key || process.env.STRIPE_SECRET_KEY || ""
  const stripe = new Stripe(secretKey, { apiVersion: "2024-04-10" })

  const orderRepo = AppDataSource.getRepository(Order)
  const order = await orderRepo.findOne({ where: { id: body.order_id } as any })

  if (!order) {
    return res.status(404).json({ message: "order not found" })
  }

  if (order.status !== "pending") {
    return res.status(400).json({ message: "order not payable" })
  }

  try {
    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: order.totalPriceCents,
      currency: order.currencyCode.toLowerCase(),
      metadata: {
        order_id: order.id.toString(),
      },
    })

    return res.json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
    })
  } catch (error) {
    console.error("Stripe error:", error)
    return res.status(500).json({ message: "payment creation failed" })
  }
}