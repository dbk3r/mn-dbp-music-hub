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
  try {
    const res = await fetch(backendUrl("/custom/admin/roles"), { cache: "no-store", headers })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (e: any) {
    return NextResponse.json({ message: String(e) }, { status: 502 })
  }
}
