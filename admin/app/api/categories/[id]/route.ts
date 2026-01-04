import { NextRequest, NextResponse } from "next/server";
import { backendUrl } from "../../_backend";

type Params = { id: string };

export async function DELETE(req: NextRequest, context: { params: Promise<Params> }) {
  const { id } = await context.params;
  const headers: Record<string, string> = {}
  const auth = (req as any).headers?.get?.("authorization")
  if (auth) headers.Authorization = auth
  const res = await fetch(backendUrl(`/custom/categories/${id}`), {
    method: "DELETE",
    headers,
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function PUT(req: NextRequest, context: { params: Promise<Params> }) {
  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  const auth = (req as any).headers?.get?.("authorization")
  if (auth) headers.Authorization = auth
  const res = await fetch(backendUrl(`/custom/categories/${id}`), {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
