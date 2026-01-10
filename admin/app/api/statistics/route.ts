import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9000";
const SERVICE_TOKEN = process.env.MEDUSA_SERVICE_TOKEN;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryString = searchParams.toString();

    // Prioritize user token from Authorization header
    const authHeader = req.headers.get("authorization");
    const token = authHeader || (SERVICE_TOKEN ? `Bearer ${SERVICE_TOKEN}` : "");

    const response = await fetch(
      `${BACKEND_URL}/custom/admin/statistics${queryString ? `?${queryString}` : ""}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: token }),
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to fetch statistics" }));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Statistics proxy error:", error);
    return NextResponse.json(
      { message: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
