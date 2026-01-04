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
  const res = await fetch(backendUrl("/custom/tags"), { cache: "no-store", headers });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const headers = buildHeadersFromReq(request as Request)
  if (!headers["Content-Type"]) headers["Content-Type"] = "application/json"
  const res = await fetch(backendUrl("/custom/tags"), {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
