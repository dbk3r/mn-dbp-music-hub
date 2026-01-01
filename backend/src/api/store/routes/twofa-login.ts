
import { Router, Request } from "express"
import crypto from "crypto"
import { sendPinMail } from "../../../services/mail-service"

interface ScopeRequest extends Request {
  scope: any
}

const router = Router()

router.post("/store/auth/init", async (req, res) => {
  const { email, password } = req.body
  const customerService = (req as ScopeRequest).scope.resolve("customerService")
  const customer = await customerService.retrieveByEmail(email).catch(()=>null)
  if (!customer || !(await customerService.validatePassword(customer.id, password)))
    return res.status(401).json({ error: "Wrong credentials" })

  const pin = crypto.randomInt(100000, 999999).toString()
  const expires = Date.now() + 5*60*1000
  await customerService.update(customer.id, { twofa_pin: pin, twofa_expires: expires })
  await sendPinMail(email, pin)
  res.json({ status: "require_pin" })
})

export default router