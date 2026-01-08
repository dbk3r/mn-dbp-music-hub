import { NextRequest, NextResponse } from "next/server";
import { backendUrl } from "../../../../../../_backend";

function buildHeadersFromReq(req: Request) {
  const headers: Record<string, string> = {}
  try {
    const auth = (req as any).headers?.get?.("authorization")
    if (auth) headers.Authorization = auth
  } catch (e) {}
  return headers
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; variantId: string; fileId: string }> }) {
  const { id, variantId, fileId } = await params
  const headers = buildHeadersFromReq(req)
  const res = await fetch(backendUrl(`/custom/admin/audio/${id}/variants/${variantId}/files/${fileId}`), {
    method: "DELETE",
    headers,
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
