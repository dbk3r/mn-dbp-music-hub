import { NextRequest, NextResponse } from "next/server";
import { backendUrl } from "../../_backend";

type Params = { id: string };

function buildHeadersFromReq(req: Request) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  try {
    const auth = (req as any).headers?.get?.("authorization");
    if (auth) headers.Authorization = auth;
  } catch (e) {}
  return headers;
}

export async function DELETE(req: NextRequest, context: { params: Promise<Params> }) {
  const { id } = await context.params;
  const headers = buildHeadersFromReq(req as Request);
  const res = await fetch(backendUrl(`/custom/admin/audio/${id}`), {
    method: "DELETE",
    headers,
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function PATCH(req: NextRequest, context: { params: Promise<Params> }) {
  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));
  const headers = buildHeadersFromReq(req as Request);
  if (!headers["Content-Type"]) headers["Content-Type"] = "application/json";
  const res = await fetch(backendUrl(`/custom/admin/audio/${id}`), {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
