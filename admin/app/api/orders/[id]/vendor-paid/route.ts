import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { vendor_paid } = body;

    const token = req.headers.get("authorization");
    const backendUrl = process.env.BACKEND_URL || "http://localhost:9000";

    const backendRes = await fetch(
      `${backendUrl}/custom/admin/orders/${id}/vendor-paid`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: token }),
        },
        body: JSON.stringify({ vendor_paid }),
      }
    );

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(data, { status: backendRes.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error updating vendor_paid status:", error);
    return NextResponse.json(
      { message: "Fehler beim Aktualisieren des Status", error: error.message },
      { status: 500 }
    );
  }
}
