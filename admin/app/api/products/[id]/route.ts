import { NextRequest, NextResponse } from "next/server"
const BACKEND_URL = process.env.BACKEND_URL || "http://backend:9000"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const headers = buildHeadersFromReq(req)
    const r = await fetch(`${BACKEND_URL}/custom/admin/products/${id}`, { headers })
    const data = await r.json()
    return NextResponse.json(data, { status: r.status })
  } catch (error) {
    return NextResponse.json({ message: "backend error" }, { status: 500 })
  }
}

function buildHeadersFromReq(req: Request) {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  try {
    const auth = (req as any).headers?.get?.("authorization")
    if (auth) headers.Authorization = auth
  } catch (e) {}
  return headers
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const headers = buildHeadersFromReq(req)
    if (!headers["Content-Type"]) headers["Content-Type"] = "application/json"
    const r = await fetch(`${BACKEND_URL}/custom/admin/products/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    })
    const data = await r.json()
    return NextResponse.json(data, { status: r.status })
  } catch (error) {
    return NextResponse.json({ message: "backend error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const headers = buildHeadersFromReq(req)
    const r = await fetch(`${BACKEND_URL}/custom/admin/products/${id}`, {
      method: "DELETE",
      headers,
    })
    const data = await r.json()
    return NextResponse.json(data, { status: r.status })
  } catch (error) {
    return NextResponse.json({ message: "backend error" }, { status: 500 })
  }
}
