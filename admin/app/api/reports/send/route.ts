import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year");
    const month = searchParams.get("month");
    
    const token = req.headers.get("authorization");
    const backendUrl = process.env.BACKEND_URL || "http://localhost:9000";
    
    const params = new URLSearchParams();
    if (year) params.set("year", year);
    if (month) params.set("month", month);
    
    const backendRes = await fetch(`${backendUrl}/custom/admin/reports/send?${params.toString()}`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: token }),
      },
    });

    const data = await backendRes.json();
    
    if (!backendRes.ok) {
      return NextResponse.json(data, { status: backendRes.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error sending report:", error);
    return NextResponse.json(
      { message: "Fehler beim Versenden des Reports", error: error.message },
      { status: 500 }
    );
  }
}
