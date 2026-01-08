import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AppDataSource } from "../../../../../../datasource/data-source"
import { Order } from "../../../../../../models/order"
import { LicensePDFService } from "../../../../../../services/license-pdf.service"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  try {
    const { orderId } = req.params

    if (!orderId) {
      return res.status(400).json({ message: "Order ID required" })
    }

    // Get order
    const orderRepo = AppDataSource.getRepository(Order)
    const order = await orderRepo.findOne({ where: { orderId: orderId as string } as any })

    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    if (!order.orderId) {
      return res.status(400).json({ message: "Order ID is missing" })
    }

    // Get customer info
    const customerRows: any[] = await AppDataSource.query(
      `SELECT email, first_name, last_name FROM customer WHERE id = $1`,
      [order.customerId]
    )
    const customer = customerRows && customerRows[0] ? customerRows[0] : null

    const pdfService = new LicensePDFService()
    const results: Array<{
      audio_id: any
      license_model_id: any
      success: boolean
      filename?: any
      error?: string
    }> = []

    // Generate PDF for each item
    for (const item of order.items || []) {
      try {
        const filename = await pdfService.generateLicensePDF({
          orderId: order.orderId,
          licenseNumber: order.licenseNumber || "UNKNOWN",
          audioFileId: item.audio_id,
          licenseModelId: item.license_model_id,
          customerEmail: customer?.email || "",
          customerFirstname: customer?.first_name || "",
          customerLastname: customer?.last_name || ""
        })

        results.push({
          audio_id: item.audio_id,
          license_model_id: item.license_model_id,
          success: !!filename,
          filename
        })
      } catch (err) {
        console.error(`[generate-pdf] Failed for item:`, err)
        results.push({
          audio_id: item.audio_id,
          license_model_id: item.license_model_id,
          success: false,
          error: String(err)
        })
      }
    }

    res.status(200).json({
      message: "PDF generation completed",
      order_id: order.orderId,
      results
    })
  } catch (err) {
    console.error("[generate-pdf] Error:", err)
    res.status(500).json({ message: "Error generating PDFs" })
  }
}
