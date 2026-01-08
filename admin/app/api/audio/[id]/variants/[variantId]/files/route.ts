import { NextRequest, NextResponse } from "next/server";
import { backendUrl } from "../../../../../_backend";

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
  const res = await fetch(backendUrl(`/custom/admin/audio/${id}/variants/${variantId}/files`), {
    cache: "no-store",
    headers,
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; variantId: string }> }) {
  const { id, variantId } = await params
  const headers = buildHeadersFromReq(req)
  const body = await req.arrayBuffer()
  const searchParams = req.nextUrl.searchParams
  const filename = searchParams.get("filename") || "file"
  const mime = searchParams.get("mime") || "application/octet-stream"
  
  const res = await fetch(backendUrl(`/custom/admin/audio/${id}/variants/${variantId}/files?filename=${encodeURIComponent(filename)}&mime=${encodeURIComponent(mime)}`), {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": mime,
    },
    body: body,
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
