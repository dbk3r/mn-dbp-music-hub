import nodemailer from "nodemailer"
import { SystemSettingsService } from "./system-settings-service"
import { AppDataSource } from "../datasource/data-source"

export async function sendPinMail(to: string, pin: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  })

  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@example.com'

  const info = await transporter.sendMail({
    from: fromAddress,
    to,
    subject: "Ihr Einmal-PIN",
    text: `Ihr Einmal-Code lautet: ${pin}`,
  })

  console.log("mail-service: PIN mail sent", { to, messageId: info?.messageId })
  return info
}

export async function sendActivationEmail(to: string, token: string) {
  // Load template from system settings (admin-editable)
  if (!AppDataSource.isInitialized) await AppDataSource.initialize()
  const svc = new SystemSettingsService()

  const subject = (await svc.getSetting("activation_email_subject")) || "Aktiviere dein Konto"
  let template = (await svc.getSetting("activation_email_template")) || "Bitte aktiviere dein Konto: {{activation_link}}"

  const storeUrl = process.env.STORE_URL || process.env.STORE_CORS || "http://localhost:3000"
  const activationLink = `${storeUrl.replace(/\/$/, '')}/auth/activate?token=${encodeURIComponent(token)}`

  template = template.replace(/{{\s*activation_link\s*}}/g, activationLink)
  template = template.replace(/{{\s*token\s*}}/g, token)

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  })

  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@example.com'

  const info = await transporter.sendMail({
    from: fromAddress,
    to,
    subject,
    text: template.replace(/<[^>]+>/g, ''),
    html: template,
  })

  console.log("mail-service: Activation mail sent", { to, messageId: info?.messageId, response: info?.response })
  return info
}