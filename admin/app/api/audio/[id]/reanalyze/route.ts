import { NextResponse } from "next/server";
import { backendUrl } from "../../../_backend";

type Params = { id: string };

export async function POST(_request: Request, context: { params: Promise<Params> }) {
  const { id } = await context.params;
  const res = await fetch(backendUrl(`/custom/admin/audio/${id}/reanalyze`), {
    method: "POST",
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
