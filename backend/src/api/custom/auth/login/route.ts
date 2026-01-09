import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import crypto from "crypto"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { sendPinMail } from "../../../../services/mail-service"
import CustomerService from "../../../../services/customer-service"

export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) {
	res.header("Access-Control-Allow-Origin", "*")
	res.header("Access-Control-Allow-Methods", "POST, OPTIONS")
	res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization")
	return res.sendStatus(200)
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
	res.header("Access-Control-Allow-Origin", "*")
	res.header("Access-Control-Allow-Methods", "POST, OPTIONS")
	res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization")

	const contentType = String(req.headers['content-type'] || '')
	if (!contentType.includes('application/json')) {
		if (!res.headersSent) return res.status(400).json({ error: 'invalid_content_type', detail: contentType })
		return
	}

	const body = req.body as any
	const { email, password } = body

	const JWT_SECRET = process.env.JWT_SECRET || "supersecret"

	try {
		const scopeReq: any = req as any
		let customerService: any = null
		if (scopeReq?.scope && typeof scopeReq.scope.resolve === 'function') {
			try {
				customerService = scopeReq.scope.resolve("customerService")
			} catch (e) {
				customerService = null
			}
		}
		if (!customerService) {
			customerService = new CustomerService()
		}

		const customer = await customerService.retrieveByEmail(email).catch(() => null)
		const passwordValid = customer ? await customerService.validatePassword(customer.id, password).catch(() => false) : false
		if (!customer || !passwordValid) {
			if (!res.headersSent) {
				return res.status(401).json({ error: "Wrong credentials" })
			}
			return
		}

		if (customer.mfaEnabled) {
			const pin = crypto.randomInt(100000, 999999).toString()
			const expiresAt = new Date(Date.now() + 5 * 60 * 1000)
			const hashedPin = await bcrypt.hash(pin, 10)

			await customerService.update(customer.id, {
				twofa_pin: pin,
				twofa_expires: Date.now() + 5 * 60 * 1000,
				mfaPinHash: hashedPin,
				mfaPinExpiresAt: expiresAt,
			})

			try {
				await sendPinMail(email, pin)
			} catch (e) {
				console.error("failed to send PIN email", e)
			}

			const tempToken = jwt.sign({ userId: customer.id, mfaPending: true }, JWT_SECRET, { expiresIn: "5m" })
			if (!res.headersSent) {
				return res.status(200).json({ mfa_required: true, temp_token: tempToken, user: { id: customer.id, email: customer.email, display_name: (customer as any).displayName } })
			}
			return
		}

		const token = jwt.sign({
			userId: customer.id,
			email: customer.email,
			roles: (customer as any).roles ? (customer as any).roles.map((r: any) => ({
				name: r.name,
				permissions: r.permissions || []
			})) : [],
		}, JWT_SECRET, { expiresIn: "7d" })

		if (!res.headersSent) {
			return res.status(200).json({ token, user: { id: customer.id, email: customer.email, display_name: (customer as any).displayName, mfa_enabled: customer.mfaEnabled } })
		}
		return
	} catch (err: any) {
		console.error("custom auth login error", err)
		if (!res.headersSent) {
			return res.status(500).json({ error: "internal_error" })
		}
	}
}
