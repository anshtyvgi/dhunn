import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

export async function GET() {
  const { userId, getToken } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getToken();

  const response = await fetch(`${API_BASE_URL}/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    // Don't cache — always get fresh coin balance
    cache: "no-store",
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Failed to fetch user" }, { status: response.status });
  }

  const data = await response.json();
  return NextResponse.json(data);
}
