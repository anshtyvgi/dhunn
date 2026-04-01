import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

function buildAuthHeaders(token: string | null) {
  const headers = new Headers();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...payload } = body;
    const { userId, getToken } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = await getToken();

    if (action === "generate-music") {
      const response = await fetch(`${API_BASE_URL}/generate/dedicate`, {
        method: "POST",
        headers: (() => {
          const headers = buildAuthHeaders(token);
          headers.set("Content-Type", "application/json");
          return headers;
        })(),
        body: JSON.stringify({
          recipientName: payload.recipientName,
          occasion: payload.occasion,
          relationship: payload.relationship ?? "custom",
          message: payload.message ?? "",
          mood: payload.mood,
          genre: payload.genre,
          language: payload.language ?? "english",
          voice: payload.voice ?? "female",
          lyricOptions: payload.lyrics.map((lyrics: string, index: number) => ({
            title: payload.titles[index],
            vibe: payload.vibes[index],
            lyrics,
            tags: String(payload.tags[index] ?? "")
              .split(",")
              .map((tag: string) => tag.trim())
              .filter(Boolean),
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        return NextResponse.json(
          { error: data.message ?? data.error ?? "Music generation failed" },
          { status: response.status },
        );
      }

      const variants = Array.isArray(data.variants) && data.variants.length > 0
        ? data.variants
        : payload.lyrics.map((lyrics: string, index: number) => ({
            id: `${data.id}-placeholder-${index}`,
            audioStatus: "PROCESSING",
            title: payload.titles[index],
            lyrics,
          }));

      return NextResponse.json({
        id: data.id,
        status: data.status,
        tracks: variants.map(
          (variant: {
            id: string;
            audioStatus: string;
            title: string;
            lyrics: string;
          }) => ({
            id: variant.id,
            status: variant.audioStatus === "FAILED" ? "failed" : "processing",
            title: variant.title,
            lyrics: variant.lyrics,
          }),
        ),
      });
    }

    const response = await fetch(`${API_BASE_URL}/generate/lyrics-preview`, {
      method: "POST",
      headers: (() => {
        const headers = buildAuthHeaders(token);
        headers.set("Content-Type", "application/json");
        return headers;
      })(),
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: data.message ?? data.error ?? "Lyrics generation failed" },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Generate proxy error:", error);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
