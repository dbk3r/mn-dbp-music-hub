import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

async function readJsonBody(req: MedusaRequest): Promise<any> {
  const chunks: Buffer[] = []
  for await (const chunk of req as any) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  const raw = Buffer.concat(chunks).toString("utf8")
  if (!raw.trim()) return {}
  return JSON.parse(raw)
}

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

  // Try req.body first, fallback to manual parsing
  let body = (req as any).body || {}
  if (!body || Object.keys(body).length === 0) {
    body = await readJsonBody(req).catch(() => ({}))
  }

  const { email, password, first_name, last_name } = body as any

  if (!email || !password) {
    return res.status(400).json({ message: "email and password required" })
  }

  try {
    // Resolve customerService from request scope so we use the framework service
    const scopeReq: any = req as any
    const customerService = scopeReq?.scope?.resolve && scopeReq.scope.resolve("customerService")
    if (!customerService) {
      return res.status(500).json({ message: "customerService unavailable" })
    }

    const customer = await customerService.create({
      email,
      password,
      first_name: first_name || null,
      last_name: last_name || null,
    })

    return res.status(201).json({ ok: true, customer })
  } catch (err: any) {
    console.error("/custom/auth/register error:", err)
    return res.status(500).json({ message: err?.message || "failed to create customer" })
  }
}

export {}
