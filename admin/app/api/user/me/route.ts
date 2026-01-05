import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://backend:9000"

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization")
    const r = await fetch(`${BACKEND_URL}/custom/user/me`, {
      headers: {
        "Content-Type": "application/json",
        ...(auth ? { Authorization: auth } : {}),
      },
    })
    const data = await r.json()
    return NextResponse.json(data, { status: r.status })
  } catch (error) {
    return NextResponse.json({ message: "backend error" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization")
    const body = await req.json()
    const bodyStr = JSON.stringify(body)
    const r = await fetch(`${BACKEND_URL}/custom/user/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": String(Buffer.byteLength(bodyStr, "utf8")),
        ...(auth ? { Authorization: auth } : {}),
      },
      body: bodyStr,
    })
    const data = await r.json()
    return NextResponse.json(data, { status: r.status })
  } catch (error) {
    return NextResponse.json({ message: "backend error" }, { status: 500 })
  }
}
