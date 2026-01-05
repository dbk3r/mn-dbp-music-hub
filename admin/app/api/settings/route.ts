import { NextResponse } from "next/server"
import { getBackendToken } from "../_backend"

const backendUrl = process.env.BACKEND_URL || "http://localhost:9000"

export async function GET() {
  try {
    const token = await getBackendToken()
    if (!token) {
      return NextResponse.json({ message: "Backend nicht verfügbar" }, { status: 500 })
    }

    const r = await fetch(`${backendUrl}/admin/settings`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!r.ok) {
      // If backend doesn't have settings endpoint yet, return defaults
      return NextResponse.json({
        stripe_publishable_key: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
        stripe_secret_key: "",
        stripe_webhook_secret: "",
      })
    }

    const data = await r.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Settings fetch error:", error)
    return NextResponse.json({ message: "Fehler beim Laden der Einstellungen" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const token = await getBackendToken()
    if (!token) {
      return NextResponse.json({ message: "Backend nicht verfügbar" }, { status: 500 })
    }

    const body = await request.json().catch(() => ({}))
    const { stripe_publishable_key, stripe_secret_key, stripe_webhook_secret } = body

    const r = await fetch(`${backendUrl}/admin/settings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ stripe_publishable_key, stripe_secret_key, stripe_webhook_secret }),
    })

    if (!r.ok) {
      return NextResponse.json({ message: "Fehler beim Speichern" }, { status: r.status })
    }

    const data = await r.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Settings save error:", error)
    return NextResponse.json({ message: "Fehler beim Speichern der Einstellungen" }, { status: 500 })
  }
}