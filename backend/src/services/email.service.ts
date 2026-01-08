import nodemailer from "nodemailer"
import { AppDataSource } from "../datasource/data-source"
import { EmailTemplate } from "../models/email-template"
import { Order } from "../models/order"
import { AudioVariant } from "../models/audio-variant"
import { AudioVariantFile } from "../models/audio-variant-file"
import { AudioFile } from "../models/audio-file"
import { LicenseModel } from "../models/license-model"

interface OrderEmailData {
  orderId: string
  licenseNumber: string
  customerEmail: string
  customerFirstname?: string
  customerLastname?: string
}

export class EmailService {
  private transporter: nodemailer.Transporter

  constructor() {
    // Configure transporter from environment variables
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })
  }

  async sendOrderConfirmation(data: OrderEmailData): Promise<boolean> {
    try {
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize()
      }

      // Get email template
      const templateRepo = AppDataSource.getRepository(EmailTemplate)
      const template = await templateRepo.findOne({
        where: { templateName: "order_confirmation", isActive: true } as any
      })

      if (!template) {
        console.error("[EmailService] No active order_confirmation template found")
        return false
      }

      // Get order
      const orderRepo = AppDataSource.getRepository(Order)
      const order = await orderRepo.findOne({
        where: { orderId: data.orderId } as any
      })

      if (!order) {
        console.error("[EmailService] Order not found:", data.orderId)
        return false
      }

      // Build downloads HTML
      const downloadsHtml = await this.buildDownloadsHtml(order)

      // Replace placeholders
      const placeholders: Record<string, string> = {
        firstname: data.customerFirstname || "",
        lastname: data.customerLastname || "",
        email: data.customerEmail || "",
        order_id: data.orderId || "",
        license_number: data.licenseNumber || "",
        purchase_date: order.createdAt ? new Date(order.createdAt).toLocaleDateString("de-DE") : new Date().toLocaleDateString("de-DE"),
        downloads: downloadsHtml
      }

      let subject = template.subject
      let bodyHtml = template.bodyHtml

      for (const [key, value] of Object.entries(placeholders)) {
        const regex = new RegExp(`\\{${key}\\}`, "g")
        subject = subject.replace(regex, value)
        bodyHtml = bodyHtml.replace(regex, value)
      }

      // Send email
      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: data.customerEmail,
        subject: subject,
        html: bodyHtml
      })

      console.log("[EmailService] Email sent:", info.messageId)
      return true
    } catch (err) {
      console.error("[EmailService] Error sending email:", err)
      return false
    }
  }

  private async buildDownloadsHtml(order: Order): Promise<string> {
    const variantRepo = AppDataSource.getRepository(AudioVariant)
    const variantFileRepo = AppDataSource.getRepository(AudioVariantFile)
    const audioRepo = AppDataSource.getRepository(AudioFile)
    const licenseRepo = AppDataSource.getRepository(LicenseModel)

    const downloadSections: string[] = []

    for (const item of order.items || []) {
      const audioFileId = item.audio_id
      const licenseModelId = item.license_model_id

      if (!audioFileId || !licenseModelId) continue

      // Get audio and license info
      const audio = await audioRepo.findOne({ where: { id: audioFileId } as any })
      const license = await licenseRepo.findOne({ where: { id: licenseModelId } as any })

      // Find variant
      const variant = await variantRepo.findOne({
        where: { audioFileId, licenseModelId } as any
      })

      if (!variant) continue

      // Get files for this variant (filtered by order)
      const files = await variantFileRepo.find({
        where: { audioVariantId: variant.id } as any,
        order: { createdAt: "ASC" }
      })

      // Filter PDF files to only show those matching this order
      const orderFiles = files.filter(file => {
        if (!file.filename.endsWith('.pdf')) return true
        return file.filename.includes(`license-${order.orderId}-`)
      })

      if (orderFiles.length === 0) continue

      const baseUrl = process.env.PUBLIC_URL || "http://localhost"
      const fileLinks = orderFiles
        .map(file => `<a href="${baseUrl}/custom/uploads/variants/${file.filename}" class="download-link">📎 ${file.originalName || file.filename}</a>`)
        .join("\n")

      downloadSections.push(`
        <div style="margin: 15px 0; padding: 15px; background: white; border: 1px solid #ddd;">
          <strong>${audio?.title || "Audio"}</strong> - ${license?.name || "Lizenz"}<br>
          ${fileLinks}
        </div>
      `)
    }

    return downloadSections.join("\n")
  }
}
