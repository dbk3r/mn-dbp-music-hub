import { NextRequest, NextResponse } from "next/server";
import { backendUrl } from "../../_backend";

function buildHeadersFromReq(req: Request) {
  const headers: Record<string, string> = {}
  try {
    const auth = (req as any).headers?.get?.("authorization")
    if (auth) headers.Authorization = auth
  } catch (e) {}
  return headers
}

export async function GET(req: NextRequest, { params }: { params: any }) {
  const resolvedParams = await params
  const { id } = resolvedParams
  const headers = buildHeadersFromReq(req)
  console.log(`[admin proxy] GET /api/users/${id} -> ${backendUrl(`/custom/admin/users/${id}`)}`)
  const res = await fetch(backendUrl(`/custom/admin/users/${id}`), {
    cache: "no-store",
    headers,
  })
  console.log(`[admin proxy] backend status: ${res.status}`)
  const contentType = res.headers.get("content-type") || ""
  if (contentType.includes("application/json")) {
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  }
  const text = await res.text().catch(() => "")
  return NextResponse.json({ body: text }, { status: res.status });
}

export async function PATCH(req: NextRequest, { params }: { params: any }) {
  const resolvedParams = await params
  const { id } = resolvedParams
  const body = await req.json().catch(() => ({}))
  const headers = buildHeadersFromReq(req)
  console.log(`[admin proxy] PATCH /api/users/${id} -> ${backendUrl(`/custom/admin/users/${id}`)}`, body)
  const res = await fetch(backendUrl(`/custom/admin/users/${id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  })
  console.log(`[admin proxy] backend status: ${res.status}`)
  const contentType = res.headers.get("content-type") || ""
  if (contentType.includes("application/json")) {
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  }
  const text = await res.text().catch(() => "")
  return NextResponse.json({ body: text }, { status: res.status })
}

export async function DELETE(req: NextRequest, { params }: { params: any }) {
  const resolvedParams = await params
  const { id } = resolvedParams
  const headers = buildHeadersFromReq(req)
  console.log(`[admin proxy] DELETE /api/users/${id} -> ${backendUrl(`/custom/admin/users/${id}`)}`)
  const res = await fetch(backendUrl(`/custom/admin/users/${id}`), {
    method: "DELETE",
    headers,
  })
  console.log(`[admin proxy] backend status: ${res.status}`)
  const contentType = res.headers.get("content-type") || ""
  if (contentType.includes("application/json")) {
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  }
  const text = await res.text().catch(() => "")
  return NextResponse.json({ body: text }, { status: res.status });
}
