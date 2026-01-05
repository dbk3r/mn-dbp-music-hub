import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AppDataSource } from "../../../../datasource/data-source"
import { SystemSettingsService } from "../../../../services/system-settings-service"
import jwt from "jsonwebtoken"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization")

  const JWT_SECRET = process.env.JWT_SECRET || "supersecret"
  const authHeader = (req.headers.authorization || "") as string

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "unauthorized" })
  }

  const bearer = authHeader.slice(7)
  const serviceToken = process.env.BACKEND_SERVICE_TOKEN
  const serviceKey = process.env.BACKEND_SERVICE_KEY
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
        accepted = true
      } catch (err) {
        return res.status(401).json({ message: "invalid token" })
      }
    }
  }

  if (!AppDataSource.isInitialized) await AppDataSource.initialize()
  const svc = new SystemSettingsService()

  const taxRate = await svc.getSetting("shop_tax_rate")
  const displayTaxBreakdown = await svc.getSetting("shop_display_tax_breakdown")
  const showPricesWithTax = await svc.getSetting("shop_show_prices_with_tax")
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
  const authHeader = (req.headers.authorization || "") as string
  
  const serviceToken = process.env.BACKEND_SERVICE_TOKEN

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "unauthorized" })
  }
  const bearer = authHeader.slice(7)
  if (!(serviceToken && bearer === serviceToken)) {
    try {
      const decoded = jwt.verify(bearer, JWT_SECRET) as any
      if (decoded && decoded.mfaPending) return res.status(401).json({ message: "mfa verification required" })
    } catch (err) {
      return res.status(401).json({ message: "invalid token" })
    }
  }

  if (!AppDataSource.isInitialized) await AppDataSource.initialize()
  const body = req.body as any
  if (!body) return res.status(400).json({ message: "No body" })

  const svc = new SystemSettingsService()
  try {
    if (typeof body.shop_tax_rate !== "undefined") await svc.setSetting("shop_tax_rate", String(body.shop_tax_rate), "Shop tax rate")
    if (typeof body.shop_display_tax_breakdown !== "undefined") await svc.setSetting("shop_display_tax_breakdown", String(body.shop_display_tax_breakdown), "Show tax breakdown")
    if (typeof body.shop_show_prices_with_tax !== "undefined") await svc.setSetting("shop_show_prices_with_tax", String(body.shop_show_prices_with_tax), "Show prices including tax")
    if (typeof body.stripe_publishable_key !== "undefined") await svc.setSetting("stripe_publishable_key", String(body.stripe_publishable_key), "Stripe publishable key")
    if (typeof body.stripe_secret_key !== "undefined") await svc.setSetting("stripe_secret_key", String(body.stripe_secret_key), "Stripe secret key")
    if (typeof body.stripe_webhook_secret !== "undefined") await svc.setSetting("stripe_webhook_secret", String(body.stripe_webhook_secret), "Stripe webhook secret")
    return res.json({ ok: true })
  } catch (err) {
    console.error("Error saving custom shop settings:", err)
    if (err && (err as any).stack) console.error((err as any).stack)
    const msg = process.env.NODE_ENV === "production" ? "Fehler beim Speichern der Einstellungen" : (err as any).message || "Fehler beim Speichern der Einstellungen"
    return res.status(500).json({ message: msg })
  }
}
