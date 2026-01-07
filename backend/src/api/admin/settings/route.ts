import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AppDataSource } from "../../../datasource/data-source"
import jwt from "jsonwebtoken"
import { SystemSettingsService } from "../../../services/system-settings-service"

export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization")
  return res.sendStatus(200)
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization")
  const JWT_SECRET = process.env.JWT_SECRET || "supersecret"

  // Require either a valid backend-signed JWT or the configured service token
  const authHeader = (req.headers.authorization || "") as string
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "unauthorized" })
  }
  const bearer = authHeader.slice(7)
  const serviceKey = process.env.BACKEND_SERVICE_KEY

  // 1) Prefer service JWT signed with BACKEND_SERVICE_KEY (HS256)
  let accepted = false
  if (serviceKey) {
    try {
      const decodedSvc = jwt.verify(bearer, serviceKey, { algorithms: ["HS256"] }) as any
      if (decodedSvc && decodedSvc.service === "admin") accepted = true
    } catch (e) {
      // ignore and try fallback to user JWT
    }
  }

  // 2) Fallback: accept a normal user/admin JWT signed with JWT_SECRET
  if (!accepted) {
    try {
      const decoded = jwt.verify(bearer, JWT_SECRET) as any
      if (decoded && decoded.mfaPending) return res.status(401).json({ message: "mfa verification required" })
      accepted = true
    } catch (err) {
      return res.status(401).json({ message: "invalid token" })
    }
  }

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  const svc = new SystemSettingsService()

  const taxRate = await svc.getSetting("shop_tax_rate")
  const displayTaxBreakdown = await svc.getSetting("shop_display_tax_breakdown")
  const showPricesWithTax = await svc.getSetting("shop_show_prices_with_tax")

  // include Stripe settings for admin UI
  const stripeSettings = await svc.getStripeSettings()

  return res.json({
    shop_tax_rate: taxRate ?? "0.19",
    shop_display_tax_breakdown: displayTaxBreakdown ?? "true",
    shop_show_prices_with_tax: showPricesWithTax ?? "false",
    stripe_publishable_key: stripeSettings.stripe_publishable_key || "",
    stripe_secret_key: stripeSettings.stripe_secret_key ? "" : "",
    stripe_webhook_secret: stripeSettings.stripe_webhook_secret ? "" : "",
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization")
  const JWT_SECRET = process.env.JWT_SECRET || "supersecret"

  // Require either a valid backend-signed JWT or the configured service token
  const authHeader = (req.headers.authorization || "") as string
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "unauthorized" })
  }
  const bearer = authHeader.slice(7)
  const serviceToken = process.env.BACKEND_SERVICE_TOKEN
  if (serviceToken && bearer === serviceToken) {
    // allowed
  } else {
    try {
      const decoded = jwt.verify(bearer, JWT_SECRET) as any
      if (decoded && decoded.mfaPending) {
        return res.status(401).json({ message: "mfa verification required" })
      }
    } catch (err) {
      console.error("settings auth verify failed:", err && (err as any).message ? (err as any).message : err)
      return res.status(401).json({ message: "invalid token" })
    }
  }

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  const body = req.body as any
  if (!body) return res.status(400).json({ message: "No body" })

  const svc = new SystemSettingsService()

  try {
    if (typeof body.shop_tax_rate !== "undefined") {
      await svc.setSetting("shop_tax_rate", String(body.shop_tax_rate), "Shop tax rate (decimal, e.g. 0.19)")
    }
    if (typeof body.shop_display_tax_breakdown !== "undefined") {
      await svc.setSetting("shop_display_tax_breakdown", String(body.shop_display_tax_breakdown), "Show tax breakdown in cart")
    }
    if (typeof body.shop_show_prices_with_tax !== "undefined") {
      await svc.setSetting("shop_show_prices_with_tax", String(body.shop_show_prices_with_tax), "Show prices including tax")
    }

    // Accept and save Stripe keys from admin UI. For security, do not return secret values in GET responses
    if (typeof body.stripe_publishable_key !== "undefined") {
      await svc.setSetting("stripe_publishable_key", String(body.stripe_publishable_key), "Stripe Publishable Key für Frontend")
    }
    if (typeof body.stripe_secret_key !== "undefined") {
      await svc.setSetting("stripe_secret_key", String(body.stripe_secret_key), "Stripe Secret Key für Backend")
    }
    if (typeof body.stripe_webhook_secret !== "undefined") {
      await svc.setSetting("stripe_webhook_secret", String(body.stripe_webhook_secret), "Stripe Webhook Secret für Validierung")
    }

    return res.json({ ok: true })
  } catch (err) {
    console.error("Error saving shop settings:", err)
    // Log stack if available for easier debugging
    if (err && (err as any).stack) console.error((err as any).stack)
    // In development, return the error message to help debug; in production keep it generic
    const msg = process.env.NODE_ENV === "production" ? "Fehler beim Speichern der Einstellungen" : (err as any).message || "Fehler beim Speichern der Einstellungen"
    return res.status(500).json({ message: msg })
  }
}
