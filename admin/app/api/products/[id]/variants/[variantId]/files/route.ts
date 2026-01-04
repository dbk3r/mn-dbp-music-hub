import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://backend:9000"

function buildHeadersFromReq(req: Request) {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  try {
    const auth = (req as any).headers?.get?.("authorization")
    if (auth) headers.Authorization = auth
  } catch (e) {}
  return headers
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string; variantId: string }> }) {
  try {
    const { id, variantId } = await params
    const headers = buildHeadersFromReq(req)
    const r = await fetch(`${BACKEND_URL}/custom/admin/products/${id}/variants/${variantId}/files`, { headers })
    const data = await r.json()
    return NextResponse.json(data, { status: r.status })
  } catch (error) {
    return NextResponse.json({ message: "backend error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; variantId: string }> }) {
  try {
    const { id, variantId } = await params
    const { searchParams } = new URL(req.url)
    const filename = searchParams.get("filename") || "file"
    const mime = searchParams.get("mime") || "application/octet-stream"

    const body = await req.arrayBuffer()

    const headers = buildHeadersFromReq(req)
    // Keep content-type as octet-stream for binary upload
    headers["Content-Type"] = "application/octet-stream"
    const r = await fetch(`${BACKEND_URL}/custom/admin/products/${id}/variants/${variantId}/files?filename=${encodeURIComponent(filename)}&mime=${encodeURIComponent(mime)}`, {
      method: "POST",
      headers,
      body,
    })
    const data = await r.json()
    return NextResponse.json(data, { status: r.status })
  } catch (error) {
    return NextResponse.json({ message: "backend error" }, { status: 500 })
  }
}
