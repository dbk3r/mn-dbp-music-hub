import { NextRequest, NextResponse } from "next/server";
import { backendUrl } from "../../../../_backend";

function buildHeadersFromReq(req: Request) {
  const headers: Record<string, string> = {}
  try {
    const auth = (req as any).headers?.get?.("authorization")
    if (auth) headers.Authorization = auth
  } catch (e) {}
  return headers
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string; variantId: string }> }) {
  const { id, variantId } = await params
  const headers = buildHeadersFromReq(req)
  const res = await fetch(backendUrl(`/custom/admin/audio/${id}/variants/${variantId}`), {
    cache: "no-store",
    headers,
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; variantId: string }> }) {
  const { id, variantId } = await params
  const headers = buildHeadersFromReq(req)
  const body = await req.json()
  const res = await fetch(backendUrl(`/custom/admin/audio/${id}/variants/${variantId}`), {
    method: "PATCH",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; variantId: string }> }) {
  const { id, variantId } = await params
  const headers = buildHeadersFromReq(req)
  const res = await fetch(backendUrl(`/custom/admin/audio/${id}/variants/${variantId}`), {
    method: "DELETE",
    headers,
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
