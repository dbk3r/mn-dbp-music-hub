import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AppDataSource } from "../../../datasource/data-source"
import { Customer } from "../../../models/customer"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "supersecret"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET, PATCH, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization")

  const authHeader = (req.headers.authorization || "") as string
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "unauthorized" })
  }

  const token = authHeader.slice(7)
  let decoded: any
  try {
    decoded = jwt.verify(token, JWT_SECRET)
  } catch (err) {
    return res.status(401).json({ message: "invalid token" })
  }

  const customerId = decoded.customer_id || decoded.customerId
  if (!customerId) {
    return res.status(401).json({ message: "no customer_id in token" })
  }

  if (!AppDataSource.isInitialized) await AppDataSource.initialize()

  try {
    // Load customer with address
    const customer = await AppDataSource.query(`
      SELECT 
        c.id, c.email, c.first_name, c.last_name, c.phone, c.avatar_url,
        ca.id as address_id, ca.address_1, ca.address_2, ca.city, 
        ca.postal_code, ca.country_code, ca.province
      FROM customer c
      LEFT JOIN customer_address ca ON ca.customer_id = c.id AND ca.is_default_billing = true
      WHERE c.id = $1
      LIMIT 1
    `, [customerId])

    if (!customer || customer.length === 0) {
      return res.status(404).json({ message: "customer not found" })
    }

    const c = customer[0]
    return res.json({
      id: c.id,
      email: c.email,
      first_name: c.first_name,
      last_name: c.last_name,
      phone: c.phone,
      avatar_url: c.avatar_url,
      address: c.address_id ? {
        id: c.address_id,
        address_1: c.address_1,
        address_2: c.address_2,
        city: c.city,
        postal_code: c.postal_code,
        country_code: c.country_code || "DE",
        province: c.province
      } : null
    })
  } catch (err: any) {
    console.error("[profile GET] error:", err)
    return res.status(500).json({ message: String(err.message || err) })
  }
}

export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET, PATCH, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization")

  const authHeader = (req.headers.authorization || "") as string
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "unauthorized" })
  }

  const token = authHeader.slice(7)
  let decoded: any
  try {
    decoded = jwt.verify(token, JWT_SECRET)
  } catch (err) {
    return res.status(401).json({ message: "invalid token" })
  }

  const customerId = decoded.customer_id || decoded.customerId
  if (!customerId) {
    return res.status(401).json({ message: "no customer_id in token" })
  }

  const { first_name, last_name, phone, address } = req.body as any

  if (!AppDataSource.isInitialized) await AppDataSource.initialize()

  try {
    // Update customer
    await AppDataSource.query(`
      UPDATE customer 
      SET first_name = $1, last_name = $2, phone = $3, updated_at = NOW()
      WHERE id = $4
    `, [first_name || null, last_name || null, phone || null, customerId])

    // Handle address
    if (address) {
      // Check if address exists
      const existing = await AppDataSource.query(`
        SELECT id FROM customer_address 
        WHERE customer_id = $1 AND is_default_billing = true
        LIMIT 1
      `, [customerId])

      if (existing && existing.length > 0) {
        // Update existing address
        await AppDataSource.query(`
          UPDATE customer_address
          SET address_1 = $1, address_2 = $2, city = $3, postal_code = $4, 
              country_code = $5, province = $6, updated_at = NOW()
          WHERE id = $7
        `, [
          address.address_1 || null,
          address.address_2 || null,
          address.city || null,
          address.postal_code || null,
          address.country_code || "DE",
          address.province || null,
          existing[0].id
        ])
      } else {
        // Create new address
        await AppDataSource.query(`
          INSERT INTO customer_address 
          (id, customer_id, first_name, last_name, address_1, address_2, city, postal_code, country_code, province, is_default_billing, is_default_shipping)
          VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9, true, true)
        `, [
          customerId,
          first_name || null,
          last_name || null,
          address.address_1 || null,
          address.address_2 || null,
          address.city || null,
          address.postal_code || null,
          address.country_code || "DE",
          address.province || null
        ])
      }
    }

    // Return updated profile
    const updated = await AppDataSource.query(`
      SELECT 
        c.id, c.email, c.first_name, c.last_name, c.phone,
        ca.id as address_id, ca.address_1, ca.address_2, ca.city, 
        ca.postal_code, ca.country_code, ca.province
      FROM customer c
      LEFT JOIN customer_address ca ON ca.customer_id = c.id AND ca.is_default_billing = true
      WHERE c.id = $1
      LIMIT 1
    `, [customerId])

    const c = updated[0]
    return res.json({
      id: c.id,
      email: c.email,
      first_name: c.first_name,
      last_name: c.last_name,
      phone: c.phone,
      address: c.address_id ? {
        id: c.address_id,
        address_1: c.address_1,
        address_2: c.address_2,
        city: c.city,
        postal_code: c.postal_code,
        country_code: c.country_code || "DE",
        province: c.province
      } : null
    })
  } catch (err: any) {
    console.error("[profile PATCH] error:", err)
    return res.status(500).json({ message: String(err.message || err) })
  }
}

export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET, PATCH, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization")
  return res.status(204).send("")
}
