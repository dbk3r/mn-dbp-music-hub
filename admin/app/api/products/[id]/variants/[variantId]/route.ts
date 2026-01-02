import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://backend:9000"

export async function DELETE(req: NextRequest, { params }: { params: { id: string; variantId: string } }) {
  try {
    const { id, variantId } = params
    const r = await fetch(`${BACKEND_URL}/custom/admin/products/${id}/variants/${variantId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    })
    const data = await r.json()
    return NextResponse.json(data, { status: r.status })
  } catch (error) {
    return NextResponse.json({ message: "backend error" }, { status: 500 })
  }
}
