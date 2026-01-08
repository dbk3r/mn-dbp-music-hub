import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://backend:9000"

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")
    const formData = await request.formData()

    const headers: HeadersInit = {}
    if (token) headers.authorization = token

    const res = await fetch(`${BACKEND_URL}/custom/admin/license-template/logo`, {
      method: "POST",
      headers,
      body: formData,
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    return NextResponse.json({ message: String(err) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")
    const headers: HeadersInit = {}
    if (token) headers.authorization = token

    const res = await fetch(`${BACKEND_URL}/custom/admin/license-template/logo`, {
      method: "DELETE",
      headers,
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    return NextResponse.json({ message: String(err) }, { status: 500 })
  }
}
