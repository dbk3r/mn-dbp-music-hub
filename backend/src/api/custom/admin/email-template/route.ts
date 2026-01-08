import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AppDataSource } from "../../../../datasource/data-source"
import { EmailTemplate } from "../../../../models/email-template"
import { requireAdmin, type AuthenticatedRequest } from "../../../middlewares/auth"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const isAdmin = await requireAdmin(req as AuthenticatedRequest, res)
  if (!isAdmin) {
    return
  }

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  try {
    const repo = AppDataSource.getRepository(EmailTemplate)
    const template = await repo.findOne({
      where: { templateName: "order_confirmation", isActive: true } as any
    })

    if (!template) {
      return res.status(404).json({ message: "Template not found" })
    }

    return res.json({
      id: template.id,
      subject: template.subject,
      bodyHtml: template.bodyHtml
    })
  } catch (err: any) {
    console.error("[email-template] GET error:", err)
    return res.status(500).json({ message: err.message })
  }
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const isAdmin = await requireAdmin(req as AuthenticatedRequest, res)
  if (!isAdmin) {
    return
  }

  const body = req.body as { subject?: string; bodyHtml?: string } | undefined
  const { subject, bodyHtml } = body || {}

  if (!subject || !bodyHtml) {
    return res.status(400).json({ message: "subject and bodyHtml required" })
  }

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  try {
    const repo = AppDataSource.getRepository(EmailTemplate)
    const template = await repo.findOne({
      where: { templateName: "order_confirmation", isActive: true } as any
    })

    if (!template) {
      return res.status(404).json({ message: "Template not found" })
    }

    template.subject = subject
    template.bodyHtml = bodyHtml
    template.updatedAt = new Date()

    await repo.save(template)

    return res.json({ success: true, message: "Template saved" })
  } catch (err: any) {
    console.error("[email-template] PUT error:", err)
    return res.status(500).json({ message: err.message })
  }
}
