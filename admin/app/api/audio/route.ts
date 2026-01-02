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
  const cover = form.get("cover");
  const title = form.get("title");
  const artist = form.get("artist");
  const description = form.get("description");
  const releaseYear = form.get("release_year");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "file is required" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  const target = new URL(backendUrl("/custom/admin/audio"));
  target.searchParams.set("filename", file.name);
  if (file.type) target.searchParams.set("mime", file.type);

  if (typeof title === "string" && title.trim()) {
    target.searchParams.set("title", title.trim());
  }
  if (typeof artist === "string" && artist.trim()) {
    target.searchParams.set("artist", artist.trim());
  }
  if (typeof description === "string" && description.trim()) {
    target.searchParams.set("description", description.trim());
  }
  if (typeof releaseYear === "string" && releaseYear.trim()) {
    target.searchParams.set("release_year", releaseYear.trim());
  }

  const res = await fetch(target.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream" },
    body: bytes,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }

  const createdId = (data as any)?.item?.id;
  if (cover instanceof File && createdId != null) {
    const coverBytes = Buffer.from(await cover.arrayBuffer());
    const coverTarget = new URL(backendUrl(`/custom/admin/audio/${createdId}/cover`));
    coverTarget.searchParams.set("filename", cover.name);
    if (cover.type) coverTarget.searchParams.set("mime", cover.type);

    const coverRes = await fetch(coverTarget.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: coverBytes,
    });

    if (!coverRes.ok) {
      const coverData = await coverRes.json().catch(() => ({}));
      return NextResponse.json(
        { message: "cover upload failed", cover: coverData, audio: data },
        { status: coverRes.status }
      );
    }
  }

  return NextResponse.json(data, { status: res.status });
}
