import { NextRequest, NextResponse } from "next/server";

// POST /api/share
// Creates a shareable link for a dedication
// Requires payment (coins deducted client-side, verified server-side)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { generationId, userId } = body;

    if (!generationId) {
      return NextResponse.json({ error: "Missing generation ID" }, { status: 400 });
    }

    // TODO: Verify coin payment
    // TODO: Look up generation from DB
    // TODO: Mark as shared
    // TODO: Generate share URL

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

  // TODO: Fetch from DB
  // TODO: Check if paid/shared
  // TODO: Return appropriate data (full if paid, preview if not)

  return NextResponse.json({
    id,
    recipientName: "Someone special",
    occasion: "love",
    mood: "romantic",
    message: "You mean the world to me",
    posterUrl: null,
    audioUrl: null,
    isPaid: false,
  });
}
