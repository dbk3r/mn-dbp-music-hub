import nodemailer from "nodemailer"

export async function sendPinMail(to: string, pin: string): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  }  
  })
  await transporter.sendMail({
    from: '"Audio-Shop" <no-reply@example.com>',
    to,
    subject: "Ihr Einmal-PIN",
    text: `Ihr Einmal-Code lautet: ${pin}`
  })
}