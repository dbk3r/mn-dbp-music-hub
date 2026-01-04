import { NextResponse } from "next/server";
import { backendUrl } from "../../../_backend";

type Params = { id: string };

export async function POST(req: Request, context: { params: Promise<Params> }) {
  const { id } = await context.params;
  const headers: Record<string, string> = {}
  try {
    const auth = (req as any).headers?.get?.("authorization")
    if (auth) headers.Authorization = auth
  } catch (e) {}
  const res = await fetch(backendUrl(`/custom/admin/audio/${id}/reanalyze`), {
    method: "POST",
    headers,
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
