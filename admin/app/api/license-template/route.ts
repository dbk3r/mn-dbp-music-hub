import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://backend:9000"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")
    const headers: HeadersInit = { "Content-Type": "application/json" }
    if (token) headers.authorization = token

    const res = await fetch(`${BACKEND_URL}/custom/admin/license-template`, {
      method: "GET",
      headers,
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    return NextResponse.json({ message: String(err) }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")
    const body = await request.json()

    const headers: HeadersInit = { "Content-Type": "application/json" }
    if (token) headers.authorization = token

    const res = await fetch(`${BACKEND_URL}/custom/admin/license-template`, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    return NextResponse.json({ message: String(err) }, { status: 500 })
  }
}
