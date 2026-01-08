import PDFDocument from "pdfkit"
import { AppDataSource } from "../datasource/data-source"
import { LicenseTemplate } from "../models/license-template"
import { AudioVariant } from "../models/audio-variant"
import { AudioVariantFile } from "../models/audio-variant-file"
import { AudioFile } from "../models/audio-file"
import { LicenseModel } from "../models/license-model"
import { Order } from "../models/order"
import fs from "fs"
import path from "path"

interface LicensePDFData {
  orderId: string
  licenseNumber: string
  audioFileId: number
  licenseModelId: number
  customerEmail: string
  customerFirstname?: string
  customerLastname?: string
  customerStreet?: string
  customerHousenumber?: string
  customerZip?: string
  customerCity?: string
}

export class LicensePDFService {
  async generateLicensePDF(data: LicensePDFData): Promise<string | null> {
    try {
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize()
      }

      // Get template
      const templateRepo = AppDataSource.getRepository(LicenseTemplate)
      const template = await templateRepo.findOne({ where: { isActive: true } as any })

      if (!template) {
        console.error("[LicensePDFService] No active template found")
        return null
      }

      // Get audio file
      const audioRepo = AppDataSource.getRepository(AudioFile)
      const audio = await audioRepo.findOne({ where: { id: data.audioFileId } as any })

      // Get license model
      const licenseRepo = AppDataSource.getRepository(LicenseModel)
      const license = await licenseRepo.findOne({ where: { id: data.licenseModelId } as any })

      // Get order
      const orderRepo = AppDataSource.getRepository(Order)
      const order = await orderRepo.findOne({ where: { orderId: data.orderId } as any })

      // Prepare placeholders
      const placeholders: Record<string, string> = {
        firstname: data.customerFirstname || "",
        lastname: data.customerLastname || "",
        street: data.customerStreet || "",
        housenumber: data.customerHousenumber || "",
        zip: data.customerZip || "",
        city: data.customerCity || "",
        email: data.customerEmail || "",
        audio_title: audio?.title || "N/A",
        license_model: license?.name || "N/A",
        license_description: license?.description || "",
        order_id: data.orderId || "",
        license_number: data.licenseNumber || "",
        purchase_date: order?.createdAt ? new Date(order.createdAt).toLocaleDateString("de-DE") : new Date().toLocaleDateString("de-DE")
      }

      // Replace placeholders in template
      let html = template.templateHtml

      // Handle logo
      if (template.logoFilename) {
        const logoPath = path.join(process.cwd(), "uploads", "license-logos", template.logoFilename)
        if (fs.existsSync(logoPath)) {
          const logoBuffer = fs.readFileSync(logoPath)
          const logoBase64 = logoBuffer.toString("base64")
          const ext = path.extname(template.logoFilename).toLowerCase()
          const mimeType = ext === ".png" ? "image/png" : ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png"
          html = html.replace("{{LOGO}}", `<img class="logo" src="data:${mimeType};base64,${logoBase64}" alt="Logo" />`)
        } else {
          html = html.replace("{{LOGO}}", "")
        }
      } else {
        html = html.replace("{{LOGO}}", "")
      }

      // Replace all placeholders
      for (const [key, value] of Object.entries(placeholders)) {
        const regex = new RegExp(`\\{${key}\\}`, "g")
        html = html.replace(regex, value)
      }

      // Generate PDF with PDFKit
      const uploadDir = path.join(process.cwd(), "uploads", "variants")
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }

      // Sanitize filename parts
      const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9äöüÄÖÜß\-_]/g, '_').substring(0, 50)
      const audioTitle = sanitize(audio?.title || "Audio")
      const licenseName = sanitize(license?.name || "Lizenz")
      const licenseNum = data.licenseNumber || "UNKNOWN"
      
      const filename = `license-${data.orderId}-${data.audioFileId}-${data.licenseModelId}-${Date.now()}.pdf`
      const displayName = `${audioTitle}_${licenseName}_${licenseNum}.pdf`
      const filepath = path.join(uploadDir, filename)

      // Create PDF document
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      })

      const writeStream = fs.createWriteStream(filepath)
      doc.pipe(writeStream)

      // Add logo if exists
      if (template.logoFilename) {
        const logoPath = path.join(process.cwd(), "uploads", "license-logos", template.logoFilename)
        if (fs.existsSync(logoPath)) {
          try {
            doc.image(logoPath, { width: 150, align: "center" })
            doc.moveDown(2)
          } catch (err) {
            console.warn("[LicensePDFService] Could not embed logo:", err)
          }
        }
      }

      // Title
      doc.fontSize(20).font("Helvetica-Bold").text("Lizenzdokument", { align: "center" })
      doc.moveDown(2)

      // Customer Information
      doc.fontSize(12).font("Helvetica-Bold").text("Kunde:", { underline: true })
      doc.moveDown(0.5)
      doc.fontSize(11).font("Helvetica")
      doc.text(`${placeholders.firstname} ${placeholders.lastname}`)
      if (placeholders.street || placeholders.housenumber) {
        doc.text(`${placeholders.street} ${placeholders.housenumber}`)
      }
      if (placeholders.zip || placeholders.city) {
        doc.text(`${placeholders.zip} ${placeholders.city}`)
      }
      doc.text(`E-Mail: ${placeholders.email}`)
      doc.moveDown(2)

      // Order Information
      doc.fontSize(12).font("Helvetica-Bold").text("Bestellinformationen:", { underline: true })
      doc.moveDown(0.5)
      doc.fontSize(11).font("Helvetica")
      doc.text(`Bestellnummer: ${placeholders.order_id}`)
      doc.text(`Kaufdatum: ${placeholders.purchase_date}`)
      doc.moveDown(2)

      // Audio Information
      doc.fontSize(12).font("Helvetica-Bold").text("Audio:", { underline: true })
      doc.moveDown(0.5)
      doc.fontSize(11).font("Helvetica")
      doc.text(`Titel: ${placeholders.audio_title}`)
      doc.moveDown(2)

      // License Information
      doc.fontSize(12).font("Helvetica-Bold").text("Lizenzmodell:", { underline: true })
      doc.moveDown(0.5)
      doc.fontSize(11).font("Helvetica")
      doc.text(`${placeholders.license_model}`, { continued: false })
      if (placeholders.license_description) {
        doc.moveDown(0.5)
        doc.fontSize(10).text(placeholders.license_description, { align: "justify" })
      }
      doc.moveDown(2)

      // Footer
      doc.fontSize(9).font("Helvetica-Oblique")
      doc.text("Dieses Dokument bestätigt die Lizenzierung des oben genannten Audio-Materials.", { align: "center" })

      doc.end()

      // Wait for write to finish
      await new Promise<void>((resolve, reject) => {
        writeStream.on("finish", resolve)
        writeStream.on("error", reject)
      })

      console.log(`[LicensePDFService] PDF generated: ${filename}`)

      // Save as AudioVariantFile
      const variantRepo = AppDataSource.getRepository(AudioVariant)
      const variant = await variantRepo.findOne({
        where: {
          audioFileId: data.audioFileId,
          licenseModelId: data.licenseModelId
        } as any
      })

      if (variant) {
        const fileRepo = AppDataSource.getRepository(AudioVariantFile)
        const stats = fs.statSync(filepath)

        const variantFile = fileRepo.create({
          audioVariantId: variant.id,
          originalName: displayName,
          filename: filename,
          mimeType: "application/pdf",
          size: stats.size,
          description: "Lizenzdokument"
        })

        await fileRepo.save(variantFile)
        console.log(`[LicensePDFService] PDF saved as AudioVariantFile ID: ${variantFile.id}`)
      }

      return filename
    } catch (err) {
      console.error("[LicensePDFService] Error generating PDF:", err)
      return null
    }
  }
}
