import nodemailer from "nodemailer"

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

  return info
}