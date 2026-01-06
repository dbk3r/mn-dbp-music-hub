import { NextRequest, NextResponse } from "next/server";
import { backendUrl } from "../_backend";

function buildHeadersFromReq(req: Request) {
  const headers: Record<string, string> = {}
  try {
    const auth = (req as any).headers?.get?.("authorization")
    if (auth) headers.Authorization = auth
  } catch (e) {}
  return headers
}

export async function GET(req: NextRequest) {
  const headers = buildHeadersFromReq(req)
  const res = await fetch(backendUrl("/custom/admin/users"), {
    cache: "no-store",
    headers,
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest) {
  const headers = buildHeadersFromReq(req)
  try {
    const body = await req.json().catch(() => ({}))
    const res = await fetch(backendUrl("/custom/admin/users"), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    })
    const contentType = res.headers.get("content-type") || ""
    if (contentType.includes("application/json")) {
      const data = await res.json().catch(() => ({}))
      return NextResponse.json(data, { status: res.status })
    }
    const text = await res.text().catch(() => "")
    return NextResponse.json({ body: text }, { status: res.status })
  } catch (e: any) {
    return NextResponse.json({ message: String(e) }, { status: 502 })
  }
}
