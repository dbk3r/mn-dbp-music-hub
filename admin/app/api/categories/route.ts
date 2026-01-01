import { NextResponse } from "next/server";
import { backendUrl } from "../_backend";

export async function GET() {
  const res = await fetch(backendUrl("/custom/admin/categories"), {
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const res = await fetch(backendUrl("/custom/admin/categories"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
