import nodemailer from "nodemailer"

export async function sendPinMail(to: string, pin: string): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email", // Demo/Tests: https://ethereal.email
    port: 587,
    auth: {
      user: "ETHEREAL_USER", // Ethereal Mail Zugang!
      pass: "ETHEREAL_PASS"
    }
  })
  await transporter.sendMail({
    from: '"Audio-Shop" <no-reply@example.com>',
    to,
    subject: "Ihr Einmal-PIN",
    text: `Ihr Einmal-Code lautet: ${pin}`
  })
}