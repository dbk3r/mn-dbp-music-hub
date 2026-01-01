
import { Router, Request } from "express"
const router = Router()

interface ScopeSessionRequest extends Request {
  scope: any
  session: any
}

router.post("/store/auth/verify-pin", async (req, res) => {
  const { email, pin } = req.body
  const customerService = (req as ScopeSessionRequest).scope.resolve("customerService")
  const customer = await customerService.retrieveByEmail(email).catch(()=>null)
  if (!customer) return res.status(400).json({ error: "Wrong email" })
  if (Date.now() > Number(customer.twofa_expires))
    return res.status(400).json({ error: "PIN expired" })
  if (customer.twofa_pin !== pin) {
    res.status(401).json({ error: "Wrong PIN" })
    return
  }

  (req as ScopeSessionRequest).session.customer_id = customer.id
  await customerService.update(customer.id, { twofa_pin: null, twofa_expires: null })
  res.json({ status: "logged_in" })
})

export default router