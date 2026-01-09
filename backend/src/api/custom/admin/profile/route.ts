import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { requireAuth, AuthenticatedRequest } from "../../../middlewares/auth"
import { AppDataSource } from "../../../../datasource/data-source"
import { User } from "../../../../models/user"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET, PATCH, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization")

  const authed = await requireAuth(req as AuthenticatedRequest, res)
  if (!authed) return

  const authReq = req as AuthenticatedRequest
  const userId = authReq.user?.id

  if (!userId) {
    return res.status(401).json({ message: "no user id" })
  }

  // Service tokens don't have real user profiles
  if (userId === "service-admin") {
    return res.json({
      id: "service-admin",
      email: "service@internal",
      display_name: "Service Admin",
      first_name: null,
      last_name: null,
      phone: null,
      address_1: null,
      address_2: null,
      city: null,
      postal_code: null,
      country_code: null,
      avatar_url: null,
      roles: ["admin"]
    })
  }

  if (!AppDataSource.isInitialized) await AppDataSource.initialize()

  try {
    const userRepo = AppDataSource.getRepository(User)
    const user = await userRepo.findOne({
      where: { id: userId },
      relations: ["roles"]
    } as any)

    if (!user) {
      return res.status(404).json({ message: "user not found" })
    }

    return res.json({
      id: user.id,
      email: user.email,
      display_name: user.displayName,
      first_name: user.firstName,
      last_name: user.lastName,
      phone: user.phone,
      address_1: user.address1,
      address_2: user.address2,
      city: user.city,
      postal_code: user.postalCode,
      country_code: user.countryCode,
      avatar_url: user.avatarUrl,
      iban: user.iban,
      bic: user.bic,
      bank_account_holder: user.bankAccountHolder,
      paypal_email: user.paypalEmail,
      tax_number: user.taxNumber,
      vat_id: user.vatId,
      roles: (user.roles || []).map((r: any) => r.name)
    })
  } catch (err: any) {
    console.error("[admin/profile GET] error:", err)
    return res.status(500).json({ message: String(err.message || err) })
  }
}

export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET, PATCH, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization")

  const authed = await requireAuth(req as AuthenticatedRequest, res)
  if (!authed) return

  const authReq = req as AuthenticatedRequest
  const userId = authReq.user?.id

  if (!userId) {
    return res.status(401).json({ message: "no user id" })
  }

  // Service tokens can't update profiles
  if (userId === "service-admin") {
    return res.status(403).json({ message: "service tokens cannot modify profiles" })
  }

  const { 
    display_name, first_name, last_name, phone, 
    address_1, address_2, city, postal_code, country_code,
    iban, bic, bank_account_holder, paypal_email, tax_number, vat_id 
  } = req.body as any

  if (!AppDataSource.isInitialized) await AppDataSource.initialize()

  try {
    const userRepo = AppDataSource.getRepository(User)
    
    await userRepo.update({ id: userId }, {
      displayName: display_name || null,
      firstName: first_name || null,
      lastName: last_name || null,
      phone: phone || null,
      address1: address_1 || null,
      address2: address_2 || null,
      city: city || null,
      postalCode: postal_code || null,
      countryCode: country_code || null,
      iban: iban || null,
      bic: bic || null,
      bankAccountHolder: bank_account_holder || null,
      paypalEmail: paypal_email || null,
      taxNumber: tax_number || null,
      vatId: vat_id || null
    })

    const user = await userRepo.findOne({
      where: { id: userId },
      relations: ["roles"]
    } as any)

    if (!user) {
      return res.status(404).json({ message: "user not found" })
    }

    return res.json({
      id: user.id,
      email: user.email,
      display_name: user.displayName,
      first_name: user.firstName,
      last_name: user.lastName,
      phone: user.phone,
      address_1: user.address1,
      address_2: user.address2,
      city: user.city,
      postal_code: user.postalCode,
      country_code: user.countryCode,
      avatar_url: user.avatarUrl,
      iban: user.iban,
      bic: user.bic,
      bank_account_holder: user.bankAccountHolder,
      paypal_email: user.paypalEmail,
      tax_number: user.taxNumber,
      vat_id: user.vatId,
      roles: (user.roles || []).map((r: any) => r.name)
    })
  } catch (err: any) {
    console.error("[admin/profile PATCH] error:", err)
    return res.status(500).json({ message: String(err.message || err) })
  }
}

export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET, PATCH, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization")
  return res.status(204).send("")
}
