import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

export async function GET() {
  const { userId, getToken } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const token = await getToken();
    const response = await fetch(`${API_BASE_URL}/generate/sessions`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch sessions" }, { status: response.status });
    }

    const sessions = await response.json();

    // Map backend format to frontend Generation format
    const generations = sessions.map((s: any) => {
      const input = s.input ?? {};
      return {
        id: s.id,
        input: {
          recipientName: input.recipientName ?? "Someone",
          occasion: input.occasion ?? "love",
          relationship: input.relationship ?? "partner",
          message: input.message ?? "",
          mood: input.mood ?? "romantic",
          genre: input.genre ?? "bollywood",
          language: input.language ?? "hinglish",
          voice: input.voice ?? "female",
        },
        status: s.status === "COMPLETED" ? "completed" : s.status === "FAILED" ? "failed" : "generating-tracks",
        tracks: (s.variants ?? []).map((v: any) => ({
          id: v.id,
          status: v.audioStatus === "READY" || v.audioStatus === "PUBLISHED" ? "completed" : v.audioStatus === "FAILED" ? "failed" : "processing",
          audioUrl: v.audioUrl ?? undefined,
          coverImageUrl: v.coverImageUrl ?? undefined,
          title: v.title,
          lyrics: v.lyrics,
        })),
        lyrics: (s.variants ?? []).map((v: any) => `${v.title}\n\n${v.lyrics}`).join("\n\n---\n\n"),
        createdAt: s.createdAt,
        isPaid: false,
        isShared: false,
      };
    });

    return NextResponse.json(generations);
  } catch (error) {
    console.error("Sessions fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}
