import { NextResponse } from "next/server";
import { backendUrl } from "../../_backend";

type Params = { id: string };

export async function DELETE(_request: Request, context: { params: Promise<Params> }) {
  const { id } = await context.params;
  const res = await fetch(backendUrl(`/custom/admin/categories/${id}`), {
    method: "DELETE",
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function PUT(request: Request, context: { params: Promise<Params> }) {
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const res = await fetch(backendUrl(`/custom/admin/categories/${id}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
