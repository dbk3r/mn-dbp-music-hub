import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9000";
const SERVICE_TOKEN = process.env.MEDUSA_SERVICE_TOKEN;

export async function GET() {
  try {
    const response = await fetch(
      `${BACKEND_URL}/custom/admin/settings/commission`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(SERVICE_TOKEN && { Authorization: `Bearer ${SERVICE_TOKEN}` }),
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to fetch commission rate" }));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Commission GET proxy error:", error);
    return NextResponse.json(
      { message: "Failed to fetch commission rate" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();

    const response = await fetch(
      `${BACKEND_URL}/custom/admin/settings/commission`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(SERVICE_TOKEN && { Authorization: `Bearer ${SERVICE_TOKEN}` }),
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to update commission rate" }));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Commission PATCH proxy error:", error);
    return NextResponse.json(
      { message: "Failed to update commission rate" },
      { status: 500 }
    );
  }
}
