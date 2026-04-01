import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

export async function POST() {
  const { userId, getToken } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const token = await getToken();
    const response = await fetch(`${API_BASE_URL}/users/ad-unlock`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: "Ad unlock failed" }));
      return NextResponse.json(
        { error: err.message ?? err.error ?? "Ad unlock failed" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Ad unlock proxy error:", error);
    return NextResponse.json({ error: "Ad unlock failed" }, { status: 500 });
  }
}
