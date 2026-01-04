const nodemailer = require('nodemailer')

async function main(){
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 465)
  const secure = String(process.env.SMTP_SECURE || 'false') === 'true'
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const to = process.env.SMTP_TEST_TO || 'bk.pc@gmx.de'

  if (!host) {
    console.error('SMTP_HOST is not set')
    process.exit(2)
  }

  const transportOpts = {
    host,
    port,
    secure,
  }
  if (user) transportOpts.auth = { user, pass }

  console.log('Using transport:', transportOpts)

  const transporter = nodemailer.createTransport(transportOpts)

  try {
    const info = await transporter.sendMail({
      from: 'no-reply@example.com',
      to,
      subject: 'SMTP Test from container',
      text: 'This is a test email sent from the backend container.'
    })
    console.log('Message sent:', info)
    process.exit(0)
  } catch (err) {
    console.error('Send failed:', err)
    process.exit(3)
  }
}

main()
