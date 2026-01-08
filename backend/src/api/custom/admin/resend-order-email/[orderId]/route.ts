import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AppDataSource } from "../../../../../datasource/data-source"
import { Order } from "../../../../../models/order"
import { EmailService } from "../../../../../services/email.service"
import { requireAdmin, type AuthenticatedRequest } from "../../../../middlewares/auth"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const isAdmin = await requireAdmin(req as AuthenticatedRequest, res)
  if (!isAdmin) {
    return
  }

  const { orderId } = req.params

  if (!orderId) {
    return res.status(400).json({ message: "orderId required" })
  }

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  try {
    const orderRepo = AppDataSource.getRepository(Order)
    const order = await orderRepo.findOne({
      where: { orderId } as any
    })

    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    // Check if order has required data for email
    if (!order.licenseNumber) {
      return res.status(400).json({ message: "Order has no license number" })
    }

    if (!order.orderId) {
      return res.status(400).json({ message: "Order has no order ID" })
    }

    // Get customer info from database
    const customerRows: any[] = await AppDataSource.query(
      `SELECT email, first_name, last_name FROM customer WHERE id = $1`,
      [order.customerId]
    )
    const customer = customerRows && customerRows[0] ? customerRows[0] : null

    if (!customer || !customer.email) {
      return res.status(400).json({ message: "Order has no customer email" })
    }

    // Send email
    const emailService = new EmailService()
    await emailService.sendOrderConfirmation({
      orderId: order.orderId,
      licenseNumber: order.licenseNumber,
      customerEmail: customer.email || "",
      customerFirstname: customer.first_name || "",
      customerLastname: customer.last_name || ""
    })

    return res.json({ 
      success: true, 
      message: `Email sent to ${customer.email}` 
    })
  } catch (err: any) {
    console.error("[resend-order-email] Error:", err)
    return res.status(500).json({ message: err.message })
  }
}
