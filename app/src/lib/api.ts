"use client";

import type { DedicationInput } from "@/types";

export interface LyricOption {
  title: string;
  vibe: string;
  lyrics: string;
  tags: string;
}

export interface LyricsResponse {
  status: "lyrics-ready";
  options: LyricOption[];
}

export interface GenerateMusicResponse {
  id: string;
  status: string;
  tracks: { id: string; status: string; title: string; lyrics: string }[];
}

export interface StatusResponse {
  id: string;
  status: "processing" | "completed" | "failed";
  posterUrl: string | null;
  tracks: {
    id: string;
    status: "pending" | "processing" | "completed" | "failed";
    audioUrl: string | null;
    lyrics?: string;
    title?: string;
  }[];
}

// Step 1: Generate 3 lyric options
export async function generateLyrics(input: DedicationInput): Promise<LyricsResponse> {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || "Lyrics generation failed");
  }

  return response.json();
}

// Step 2: Generate music from selected lyrics
export async function generateMusic(params: {
  lyrics: string[];
  tags: string[];
  titles: string[];
  vibes: string[];
  recipientName: string;
  occasion: string;
  relationship: string;
  message: string;
  mood: string;
  genre: string;
  language: string;
  voice: string;
}): Promise<GenerateMusicResponse> {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...params, action: "generate-music" }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || "Music generation failed");
  }

  return response.json();
}

export async function pollStatus(generationId: string): Promise<StatusResponse> {
  const response = await fetch(`/api/status?id=${generationId}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || "Status check failed");
  }
  return response.json();
}

const MAX_POLL_DURATION_MS = 480000; // 8 minutes max
const MAX_CONSECUTIVE_ERRORS = 5;

export function startPolling(
  generationId: string,
  onUpdate: (data: StatusResponse) => void,
  onError: (error: Error) => void,
  intervalMs = 5000
): () => void {
  let stopped = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let consecutiveErrors = 0;
  const startedAt = Date.now();

  const poll = async () => {
    if (stopped) return;

    if (Date.now() - startedAt > MAX_POLL_DURATION_MS) {
      if (!stopped) onError(new Error("Generation timed out — please check your library"));
      return;
    }

    try {
      const data = await pollStatus(generationId);
      consecutiveErrors = 0; // reset on success
      if (stopped) return;
      onUpdate(data);
      if (data.status === "completed" || data.status === "failed") return;
      timeoutId = setTimeout(poll, intervalMs);
    } catch (err) {
      consecutiveErrors++;
      console.warn(`[Polling] Error #${consecutiveErrors} for ${generationId}:`, err);

      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        if (!stopped) onError(err instanceof Error ? err : new Error("Polling failed after retries"));
        return;
      }

      // Retry with backoff instead of dying on first error
      if (!stopped) {
        const backoff = Math.min(intervalMs * consecutiveErrors, 15000);
        timeoutId = setTimeout(poll, backoff);
      }
    }
  };

  poll();
  return () => {
    stopped = true;
    if (timeoutId !== null) clearTimeout(timeoutId);
  };
}
