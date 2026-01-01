import { NextResponse } from "next/server";
import { backendUrl } from "../_backend";

export async function GET() {
  const res = await fetch(backendUrl("/custom/admin/audio"), {
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "file is required" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  const target = new URL(backendUrl("/custom/admin/audio"));
  target.searchParams.set("filename", file.name);
  if (file.type) target.searchParams.set("mime", file.type);

  const res = await fetch(target.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream" },
    body: bytes,
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
