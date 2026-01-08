import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AppDataSource } from "../../../../datasource/data-source"
import { Order } from "../../../../models/order"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { licenseNumber } = req.params

  if (!licenseNumber) {
    return res.status(400).json({ 
      valid: false,
      message: "Lizenz-Nummer erforderlich" 
    })
  }

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  try {
    const orderRepo = AppDataSource.getRepository(Order)
    const order = await orderRepo.findOne({
      where: { licenseNumber: licenseNumber as string } as any
    })

    if (!order) {
      return res.status(404).json({
        valid: false,
        message: "Ungültige Lizenz-Nummer"
      })
    }

    // Get customer info
    const customerRows: any[] = await AppDataSource.query(
      `SELECT email, first_name, last_name FROM customer WHERE id = $1`,
      [order.customerId]
    )
    const customer = customerRows && customerRows[0] ? customerRows[0] : null

    return res.json({
      valid: true,
      license_number: order.licenseNumber,
      order_id: order.orderId,
      status: order.status,
      purchase_date: order.createdAt,
      customer_name: customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : null,
      items: order.items.map((item: any) => ({
        title: item.title,
        license_model: item.license_model_name
      }))
    })
  } catch (err: any) {
    console.error('[verify-license] Error:', err)
    return res.status(500).json({
      valid: false,
      message: "Fehler bei der Verifizierung"
    })
  }
}
