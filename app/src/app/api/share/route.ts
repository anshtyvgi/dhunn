import { NextRequest, NextResponse } from "next/server";

// In-memory store for shared dedications (mirrors generationStore pattern)
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

// POST /api/share
// Creates a shareable link for a dedication
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { generationId, recipientName, occasion, mood, genre, message, creatorName, posterUrl, audioUrl, lyrics } = body;

    if (!generationId) {
      return NextResponse.json({ error: "Missing generation ID" }, { status: 400 });
    }

    const shared: SharedDedication = {
      id: generationId,
      recipientName: recipientName || "Someone special",
      occasion: occasion || "love",
      mood: mood || "romantic",
      genre: genre || "pop",
      message: message || "",
      creatorName: creatorName || "A friend",
      posterUrl: posterUrl || null,
      audioUrl: audioUrl || null,
      lyrics: lyrics || null,
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

// GET /api/share?id={generationId}
// Fetches public dedication data for the share page
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing ID" }, { status: 400 });
  }

  // Check shared store first
  const shared = global.sharedStore?.get(id);
  if (shared) {
    return NextResponse.json(shared);
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
