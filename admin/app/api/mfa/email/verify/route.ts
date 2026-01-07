import { NextRequest, NextResponse } from "next/server"
import { backendUrl } from "../../../_backend"

function buildHeadersFromReq(req: Request) {
  const headers: Record<string, string> = {}
  try {
    const auth = (req as any).headers?.get?.("authorization")
    if (auth) headers.Authorization = auth
  } catch (e) {}
  return headers
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const headers = buildHeadersFromReq(req)
  console.log(`[admin proxy] POST /api/mfa/email/verify -> ${backendUrl(`/custom/admin/mfa/email/verify`)}`, body)
  const res = await fetch(backendUrl(`/custom/admin/mfa/email/verify`), {
    method: "POST",
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
