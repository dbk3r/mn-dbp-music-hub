import { NextResponse } from "next/server";
import { backendUrl } from "../_backend";

export async function GET() {
  const res = await fetch(backendUrl("/custom/admin/users"), {
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
