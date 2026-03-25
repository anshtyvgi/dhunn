import { NextRequest, NextResponse } from "next/server";

// GET /api/status?id={generationId}
// Polls the status of a generation
// Checks ACE task status for each track + poster status

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const generationId = searchParams.get("id");

  if (!generationId) {
    return NextResponse.json({ error: "Missing generation ID" }, { status: 400 });
  }

  try {
    // TODO: Look up generation from Redis/DB
    // TODO: For each track, check ACE status via:
    //   GET https://api.wavespeed.ai/api/v3/predictions/{taskId}
    // TODO: Check poster status

    // Mock response showing progressive completion
    const mockResponse = {
      id: generationId,
      status: "processing",
      posterUrl: null,
      tracks: [
        { id: `${generationId}-t0`, status: "completed", audioUrl: "https://example.com/track1.mp3" },
        { id: `${generationId}-t1`, status: "processing", audioUrl: null },
        { id: `${generationId}-t2`, status: "pending", audioUrl: null },
      ],
      lyrics: null,
    };

    // Determine overall status
    const allComplete = mockResponse.tracks.every((t) => t.status === "completed");
    const anyFailed = mockResponse.tracks.some((t) => t.status === "failed");

    if (allComplete) {
      mockResponse.status = "completed";
    } else if (anyFailed) {
      mockResponse.status = "failed";
    }

    return NextResponse.json(mockResponse);
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json({ error: "Failed to check status" }, { status: 500 });
  }
}
