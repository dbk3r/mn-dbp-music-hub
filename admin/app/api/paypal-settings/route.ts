import fs from "fs/promises"
import path from "path"

const DATA_FILE = path.join(process.cwd(), "admin", "data", "paypal-settings.json")

const DEFAULT = {
  paypal_mode: "sandbox",
  paypal_prod_client_id: "",
  paypal_prod_secret: "",
  paypal_sandbox_client_id: "",
  paypal_sandbox_secret: "",
}

export async function GET(req: Request) {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8")
    const data = JSON.parse(raw)
    return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } })
  } catch (err: any) {
    if (err?.code === "ENOENT") {
      return new Response(JSON.stringify(DEFAULT), { status: 200, headers: { "Content-Type": "application/json" } })
    }
    return new Response(JSON.stringify({ message: "Fehler beim Laden" }), { status: 500, headers: { "Content-Type": "application/json" } })
  }
}

export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization")
    if (!auth) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } })
    }

    const body = await req.json()
    const allowed = [
      "paypal_mode",
      "paypal_prod_client_id",
      "paypal_prod_secret",
      "paypal_sandbox_client_id",
      "paypal_sandbox_secret",
    ]
    const out: Record<string, string> = {}
    for (const k of allowed) {
      out[k] = String(body[k] ?? "")
    }

    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true })
    await fs.writeFile(DATA_FILE, JSON.stringify(out, null, 2), "utf8")

    return new Response(JSON.stringify({ message: "Gespeichert" }), { status: 200, headers: { "Content-Type": "application/json" } })
  } catch (err) {
    return new Response(JSON.stringify({ message: "Fehler beim Speichern" }), { status: 500, headers: { "Content-Type": "application/json" } })
  }
}
