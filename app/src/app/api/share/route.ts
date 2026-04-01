import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

// In-memory store as fallback (will be replaced by backend persistence)
declare global {
  var sharedStore: Map<string, SharedDedication>;
}
if (!global.sharedStore) {
  global.sharedStore = new Map();
}

interface SharedDedication {
  id: string;
  recipientName: string;
  occasion: string;
  mood: string;
  genre: string;
  message: string;
  creatorName: string;
  posterUrl: string | null;
  audioUrl: string | null;
  lyrics: string | null;
  isPaid: boolean;
  createdAt: string;
}

// POST /api/share — creates a shareable link for a dedication
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { generationId, recipientName, occasion, mood, genre, message, creatorName, posterUrl, audioUrl, lyrics } = body;

    if (!generationId || typeof generationId !== "string") {
      return NextResponse.json({ error: "Missing or invalid generation ID" }, { status: 400 });
    }

    // Prevent overwriting existing shares by other users
    const existing = global.sharedStore.get(generationId);
    if (existing && existing.creatorName !== (creatorName || "A friend")) {
      return NextResponse.json({ error: "Not authorized to modify this share" }, { status: 403 });
    }

    const shared: SharedDedication = {
      id: generationId,
      recipientName: String(recipientName || "Someone special").slice(0, 200),
      occasion: String(occasion || "love").slice(0, 100),
      mood: String(mood || "romantic").slice(0, 100),
      genre: String(genre || "pop").slice(0, 100),
      message: String(message || "").slice(0, 2000),
      creatorName: String(creatorName || "A friend").slice(0, 200),
      posterUrl: posterUrl ? String(posterUrl).slice(0, 2000) : null,
      audioUrl: audioUrl ? String(audioUrl).slice(0, 2000) : null,
      lyrics: lyrics ? String(lyrics).slice(0, 5000) : null,
      isPaid: true,
      createdAt: new Date().toISOString(),
    };

    global.sharedStore.set(generationId, shared);

    const shareUrl = `/d/${generationId}`;

    return NextResponse.json({
      shareUrl,
      generationId,
      shared: true,
    });
  } catch (error) {
    console.error("Share error:", error);
    return NextResponse.json({ error: "Failed to create share link" }, { status: 500 });
  }
}

// GET /api/share?id={generationId} — fetches public dedication data
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing ID" }, { status: 400 });
  }

  const shared = global.sharedStore?.get(id);
  if (shared) {
    return NextResponse.json(shared);
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
