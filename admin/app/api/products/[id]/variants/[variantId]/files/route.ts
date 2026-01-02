import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://backend:9000"

export async function GET(req: NextRequest, { params }: { params: { id: string; variantId: string } }) {
  try {
    const { id, variantId } = params
    const r = await fetch(`${BACKEND_URL}/custom/admin/products/${id}/variants/${variantId}/files`, {
      headers: { "Content-Type": "application/json" },
    })
    const data = await r.json()
    return NextResponse.json(data, { status: r.status })
  } catch (error) {
    return NextResponse.json({ message: "backend error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string; variantId: string } }) {
  try {
    const { id, variantId } = params
    const { searchParams } = new URL(req.url)
    const filename = searchParams.get("filename") || "file"
    const mime = searchParams.get("mime") || "application/octet-stream"

    const body = await req.arrayBuffer()

    const r = await fetch(`${BACKEND_URL}/custom/admin/products/${id}/variants/${variantId}/files?filename=${encodeURIComponent(filename)}&mime=${encodeURIComponent(mime)}`, {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body,
    })
    const data = await r.json()
    return NextResponse.json(data, { status: r.status })
  } catch (error) {
    return NextResponse.json({ message: "backend error" }, { status: 500 })
  }
}
