import { NextRequest, NextResponse } from "next/server";

// POST /api/generate
// Accepts dedication input, orchestrates the generation pipeline:
// 1. Generate prompt via Gemini
// 2. Fire 3 parallel ACE requests for audio
// 3. Fire poster request via Nano Banana
// Returns a generation ID for polling

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipientName, occasion, relationship, message, mood, genre, language, voice } = body;

    if (!recipientName || !occasion || !mood || !genre) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const generationId = crypto.randomUUID();

    // Step 1: Generate prompt via Gemini
    const prompt = await generatePrompt({
      recipientName,
      occasion,
      relationship,
      message,
      mood,
      genre,
      language,
      voice,
    });

    // Step 2: Fire 3 parallel ACE requests
    const trackPromises = Array.from({ length: 3 }, (_, i) =>
      fireACERequest({
        generationId,
        trackIndex: i,
        prompt: prompt.lyrics,
        tags: prompt.tags,
        duration: 60,
      })
    );

    // Step 3: Fire poster request
    const posterPromise = firePosterRequest({
      generationId,
      recipientName,
      occasion,
      mood,
    });

    // Fire all in parallel — don't await (polling will handle results)
    const [tracks, poster] = await Promise.all([
      Promise.allSettled(trackPromises),
      posterPromise.catch(() => null),
    ]);

    const trackIds = tracks.map((t, i) => ({
      id: `${generationId}-t${i}`,
      aceTaskId: t.status === "fulfilled" ? t.value.taskId : null,
      status: t.status === "fulfilled" ? "processing" : "failed",
    }));

    // In production: Store in Redis/DB
    // {
    //   generationId,
    //   userId,
    //   prompt,
    //   tracks: trackIds,
    //   posterTaskId: poster?.taskId,
    //   status: "processing",
    //   createdAt: new Date().toISOString(),
    // }

    return NextResponse.json({
      id: generationId,
      status: "processing",
      tracks: trackIds,
      prompt: prompt.lyrics,
      tags: prompt.tags,
    });
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}

// --- Helper functions (to be connected to real APIs) ---

interface PromptInput {
  recipientName: string;
  occasion: string;
  relationship: string;
  message: string;
  mood: string;
  genre: string;
  language: string;
  voice: string;
}

interface PromptOutput {
  lyrics: string;
  tags: string[];
}

async function generatePrompt(input: PromptInput): Promise<PromptOutput> {
  // TODO: Connect to Gemini API
  // For now, return structured mock
  const tags = [input.genre, input.mood, input.language, input.voice, input.occasion];

  return {
    lyrics: `A ${input.mood} song for ${input.recipientName} on their ${input.occasion}.\n${input.message || "You mean the world to me."}`,
    tags,
  };
}

interface ACEInput {
  generationId: string;
  trackIndex: number;
  prompt: string;
  tags: string[];
  duration: number;
}

async function fireACERequest(input: ACEInput): Promise<{ taskId: string }> {
  // TODO: Connect to ACE 1.5 API
  // POST https://api.wavespeed.ai/api/v3/wavespeed-ai/ace-step-1.5
  // Body: { duration, lyrics, tags }
  // Returns: { id, status }

  // Mock response
  return {
    taskId: `ace-${input.generationId}-${input.trackIndex}`,
  };
}

interface PosterInput {
  generationId: string;
  recipientName: string;
  occasion: string;
  mood: string;
}

async function firePosterRequest(input: PosterInput): Promise<{ taskId: string }> {
  // TODO: Connect to Nano Banana API

  // Mock response
  return {
    taskId: `poster-${input.generationId}`,
  };
}
