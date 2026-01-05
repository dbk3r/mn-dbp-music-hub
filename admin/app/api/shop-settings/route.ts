import { NextResponse } from "next/server"
import { getBackendToken } from "../_backend"

const backendUrl = process.env.BACKEND_URL || "http://localhost:9000"

export async function GET() {
  try {
    const token = await getBackendToken()
    if (!token) return NextResponse.json({ message: "Backend nicht verfügbar" }, { status: 500 })

    const r = await fetch(`${backendUrl}/custom/admin/settings`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!r.ok) return NextResponse.json({ message: "Fehler beim Laden" }, { status: r.status })
    const data = await r.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ message: "Fehler beim Laden" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const token = await getBackendToken()
    if (!token) return NextResponse.json({ message: "Backend nicht verfügbar" }, { status: 500 })

    const body = await request.json().catch(() => ({}))

    const r = await fetch(`${backendUrl}/custom/admin/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    })

    if (!r.ok) return NextResponse.json({ message: "Fehler beim Speichern" }, { status: r.status })
    const data = await r.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ message: "Fehler beim Speichern" }, { status: 500 })
  }
}
