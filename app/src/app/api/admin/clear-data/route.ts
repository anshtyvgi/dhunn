import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

export async function DELETE(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const response = await fetch(`${API_BASE_URL}/admin/clear-data?token=${token}`, {
    method: "DELETE",
    cache: "no-store",
  });

  const data = await response.json();
  return NextResponse.json(data);
}
