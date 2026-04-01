import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

function mapSessionStatus(status: string) {
  if (status === "FAILED") return "failed";
  if (status === "COMPLETED") return "completed";
  return "processing";
}

function mapTrackStatus(status: string) {
  if (status === "READY" || status === "PUBLISHED") return "completed";
  if (status === "FAILED") return "failed";
  return "processing";
}

export async function GET(request: NextRequest) {
  const generationId = request.nextUrl.searchParams.get("id");
  if (!generationId) {
    return NextResponse.json({ error: "Missing generation ID" }, { status: 400 });
  }

  const { userId, getToken } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const token = await getToken();
    const response = await fetch(`${API_BASE_URL}/generate/session/${generationId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: "no-store",
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: data.message ?? data.error ?? "Status check failed" },
        { status: response.status },
      );
    }

    return NextResponse.json({
      id: data.id,
      status: mapSessionStatus(data.status),
      posterUrl: data.variants.find((variant: { coverImageUrl?: string | null }) => variant.coverImageUrl)?.coverImageUrl ?? null,
      tracks: data.variants.map(
        (variant: {
          id: string;
          audioStatus: string;
          audioUrl?: string | null;
          lyrics: string;
          title: string;
          coverImageUrl?: string | null;
        }) => ({
          id: variant.id,
          status: mapTrackStatus(variant.audioStatus),
          audioUrl: variant.audioUrl ?? null,
          lyrics: variant.lyrics,
          title: variant.title,
          posterUrl: variant.coverImageUrl ?? null,
        }),
      ),
      lyrics: data.variants.map((variant: { lyrics: string }) => variant.lyrics).join("\n\n---\n\n"),
    });
  } catch (error) {
    console.error("Status proxy error:", error);
    return NextResponse.json({ error: "Failed to check status" }, { status: 500 });
  }
}
