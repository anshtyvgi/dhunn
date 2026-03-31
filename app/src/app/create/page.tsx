"use client";

import { useStore } from "@/stores/useStore";
import { Play, Pause, Heart, Share2, ThumbsDown, Sparkles, Lock, RotateCcw, Upload, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useRef } from "react";
import { generateLyrics, generateMusic, startPolling } from "@/lib/api";
import { COIN_COSTS } from "@/types";
import type { Mood } from "@/types";
import { usePlayerStore } from "@/stores/playerStore";

const moods: { value: Mood; label: string; emoji: string }[] = [
  { value: "romantic", label: "Romantic", emoji: "💕" },
  { value: "happy", label: "Happy", emoji: "✨" },
  { value: "nostalgic", label: "Nostalgic", emoji: "🌙" },
  { value: "energetic", label: "Energetic", emoji: "⚡" },
  { value: "bittersweet", label: "Bittersweet", emoji: "🥀" },
  { value: "playful", label: "Playful", emoji: "🎈" },
  { value: "savage", label: "Savage", emoji: "🔥" },
];

const durations = [
  { value: 15, label: "15s" },
  { value: 30, label: "30s" },
  { value: 60, label: "60s" },
];

const grads = [
  "from-rose-400 to-violet-500",
  "from-amber-400 to-rose-500",
  "from-violet-400 to-indigo-500",
];

type OutputState = "empty" | "generating" | "generated";

export default function CreatePage() {
  const store = useStore();
  const player = usePlayerStore();
  const { dedication, coins, isFirstTime, currentGeneration, generationStatus } = store;

  const [nameInput, setNameInput] = useState("");
  const [selectedMood, setSelectedMood] = useState<Mood>("romantic");
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTrackIndex, setActiveTrackIndex] = useState(0);
  const stopRef = useRef<(() => void) | null>(null);

  const cost = isFirstTime ? 0 : COIN_COSTS.generate;

  // Determine output state
  const outputState: OutputState =
    isGenerating || (generationStatus !== "idle" && generationStatus !== "completed" && generationStatus !== "failed")
      ? "generating"
      : generationStatus === "completed" && currentGeneration
      ? "generated"
      : "empty";

  const handleCreate = async () => {
    if (!nameInput.trim()) return;
    setIsGenerating(true);
    store.setRecipientName(nameInput);
    store.setMood(selectedMood);

    const input = {
      ...dedication,
      recipientName: nameInput,
      mood: selectedMood,
      message: "",
    };

    try {
      const result = await generateLyrics(input);

      if (!isFirstTime && !store.deductCoins(cost)) {
        setIsGenerating(false);
        return;
      }

      store.setGenerationStatus("generating-tracks");

      const musicResult = await generateMusic({
        lyrics: result.options.map((o) => o.lyrics),
        tags: result.options.map((o) => o.tags),
        titles: result.options.map((o) => o.title),
        vibes: result.options.map((o) => o.vibe),
        recipientName: nameInput,
        occasion: dedication.occasion,
        mood: selectedMood,
        genre: dedication.genre,
      });

      const gen = {
        id: musicResult.id,
        input: { ...dedication, recipientName: nameInput, mood: selectedMood },
        status: "generating-tracks" as const,
        tracks: musicResult.tracks.map((t) => ({
          id: t.id,
          status: t.status as "pending" | "processing" | "completed" | "failed",
        })),
        lyrics: result.options.map((o) => `${o.title}\n\n${o.lyrics}`).join("\n\n---\n\n"),
        createdAt: new Date().toISOString(),
        isPaid: false,
        isShared: false,
      };

      store.setCurrentGeneration(gen);

      stopRef.current = startPolling(
        musicResult.id,
        (data) => {
          const done = data.status === "completed";
          const updated = {
            ...gen,
            status: done ? ("completed" as const) : ("generating-tracks" as const),
            posterUrl: data.posterUrl || undefined,
            tracks: data.tracks.map((t) => ({
              id: t.id,
              status: t.status,
              audioUrl: t.audioUrl || undefined,
            })),
          };
          store.setCurrentGeneration(updated);
          if (done) {
            store.setGenerationStatus("completed");
            store.addGeneration({ ...updated, status: "completed" });
            setIsGenerating(false);
          }
        },
        () => {
          store.setGenerationStatus("failed");
          setIsGenerating(false);
          if (!isFirstTime) store.addCoins(cost);
        },
        5000
      );
    } catch {
      setIsGenerating(false);
      store.setGenerationStatus("failed");
    }
  };

  const playTrack = (trackId: string, audioUrl: string, title: string, genre: string, mood: string, gradient: string) => {
    if (player.currentTrack?.id === trackId && player.isPlaying) { player.pause(); return; }
    if (player.currentTrack?.id === trackId) { player.resume(); return; }
    player.play({ id: trackId, title, artist: "Dhun AI", audioUrl, genre, mood, gradient });
  };

  const tracks = currentGeneration?.tracks || [];

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">
      {/* ═══ LEFT PANEL — Input (35%) ═══ */}
      <div className="w-full lg:w-[35%] xl:w-[380px] shrink-0 bg-white border-r border-[#F0F0F0] flex flex-col">
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Who */}
          <div>
            <label className="text-[11px] font-semibold text-[#999] uppercase tracking-wider mb-2 block">
              Who is this for?
            </label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isGenerating && nameInput.trim() && handleCreate()}
              placeholder="e.g. Priya, Mom, Best Friend..."
              className="w-full px-4 py-3.5 rounded-xl bg-[#FAFAFA] text-[#111] text-sm placeholder:text-[#CCC] focus:outline-none focus:ring-2 focus:ring-[#111]/10 border border-[#EAEAEA] transition-all"
              autoFocus
            />
          </div>

          {/* Mood */}
          <div>
            <label className="text-[11px] font-semibold text-[#999] uppercase tracking-wider mb-2 block">
              Mood
            </label>
            <div className="flex flex-wrap gap-1.5">
              {moods.map((m) => (
                <button
                  key={m.value}
                  onClick={() => { setSelectedMood(m.value); store.setMood(m.value); }}
                  className={`px-3 py-2 rounded-xl text-xs cursor-pointer transition-all flex items-center gap-1.5 ${
                    selectedMood === m.value
                      ? "bg-[#111] text-white font-semibold"
                      : "bg-[#FAFAFA] text-[#888] border border-[#EAEAEA] hover:border-[#CCC]"
                  }`}
                >
                  <span>{m.emoji}</span>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="text-[11px] font-semibold text-[#999] uppercase tracking-wider mb-2 block">
              Duration
            </label>
            <div className="flex gap-2">
              {durations.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setSelectedDuration(d.value)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                    selectedDuration === d.value
                      ? "bg-[#111] text-white"
                      : "bg-[#FAFAFA] text-[#888] border border-[#EAEAEA] hover:border-[#CCC]"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Upload image (optional) */}
          <div>
            <label className="text-[11px] font-semibold text-[#999] uppercase tracking-wider mb-2 block">
              Reference image <span className="text-[#CCC] normal-case">(optional)</span>
            </label>
            <div className="border-2 border-dashed border-[#EAEAEA] rounded-xl p-6 text-center cursor-pointer hover:border-[#CCC] transition-colors">
              <Upload className="w-5 h-5 text-[#CCC] mx-auto mb-1.5" />
              <p className="text-xs text-[#BBB]">Drop an image for the poster</p>
            </div>
          </div>
        </div>

        {/* CTA — sticky bottom */}
        <div className="p-4 border-t border-[#F0F0F0] bg-white">
          <button
            onClick={handleCreate}
            disabled={isGenerating || !nameInput.trim()}
            className="w-full py-3.5 rounded-xl bg-[#111] text-white font-semibold text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-[#333] transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            {isGenerating ? "Creating..." : isFirstTime ? "Create Song" : `Create Song · ${cost} coins`}
          </button>
          {isFirstTime && (
            <p className="text-[10px] text-center text-[#BBB] mt-2">First one&apos;s free — no coins needed</p>
          )}
        </div>
      </div>

      {/* ═══ RIGHT PANEL — Output (65%) ═══ */}
      <div className="hidden lg:flex flex-1 flex-col bg-[#F7F7F8] overflow-hidden">
        {/* STATE 1: EMPTY */}
        {outputState === "empty" && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-sm">
              <div className="w-20 h-20 rounded-3xl bg-white border border-[#EAEAEA] flex items-center justify-center mx-auto mb-5">
                <Sparkles className="w-8 h-8 text-[#DDD]" />
              </div>
              <h3 className="text-lg font-bold text-[#111] mb-1.5">Create a song in seconds</h3>
              <p className="text-sm text-[#999]">
                Fill in the details on the left and hit Create.
                <br />
                We&apos;ll generate 3 unique tracks for you.
              </p>
            </div>
          </div>
        )}

        {/* STATE 2: GENERATING */}
        {outputState === "generating" && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto">
              {[0, 1, 2].map((i) => {
                const track = tracks[i];
                const isReady = track?.status === "completed";
                return (
                  <div key={i} className="bg-white rounded-2xl border border-[#EAEAEA] overflow-hidden">
                    {/* Poster placeholder */}
                    <div className={`aspect-square bg-gradient-to-br ${grads[i]} relative flex items-center justify-center ${!isReady ? "animate-pulse" : ""}`}>
                      {isReady ? (
                        <button
                          onClick={() => track.audioUrl && playTrack(track.id, track.audioUrl, `Track ${i + 1}`, currentGeneration!.input.genre, currentGeneration!.input.mood, grads[i])}
                          className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors"
                        >
                          <Play className="w-6 h-6 text-white ml-0.5" />
                        </button>
                      ) : (
                        <div className="w-8 h-8 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      )}
                    </div>
                    {/* Info */}
                    <div className="p-3.5">
                      {isReady ? (
                        <>
                          <p className="text-sm font-semibold text-[#111]">Track {i + 1}</p>
                          <p className="text-[11px] text-[#999] capitalize mt-0.5">
                            {currentGeneration?.input.mood} · {currentGeneration?.input.genre}
                          </p>
                        </>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="h-3 w-2/3 bg-[#F0F0F0] rounded animate-shimmer" />
                          <div className="h-2.5 w-1/2 bg-[#F5F5F5] rounded animate-shimmer" style={{ animationDelay: "0.15s" }} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Status text */}
            <div className="text-center mt-6">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#111] animate-pulse" />
                <p className="text-sm text-[#999]">
                  {generationStatus === "generating-prompt" && "Writing lyrics..."}
                  {generationStatus === "generating-tracks" && "Composing music..."}
                  {generationStatus === "generating-poster" && "Designing poster..."}
                  {generationStatus === "partial" && "Almost there..."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STATE 3: GENERATED */}
        {outputState === "generated" && currentGeneration && (
          <div className="flex-1 overflow-y-auto">
            {/* Track carousel */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-[#111]">
                  For {currentGeneration.input.recipientName}
                </h2>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setActiveTrackIndex(Math.max(0, activeTrackIndex - 1))}
                    disabled={activeTrackIndex === 0}
                    className="w-7 h-7 rounded-full border border-[#EAEAEA] flex items-center justify-center text-[#999] hover:text-[#111] disabled:opacity-30 cursor-pointer transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] text-[#999] font-medium px-2">
                    {activeTrackIndex + 1} / {tracks.length}
                  </span>
                  <button
                    onClick={() => setActiveTrackIndex(Math.min(tracks.length - 1, activeTrackIndex + 1))}
                    disabled={activeTrackIndex === tracks.length - 1}
                    className="w-7 h-7 rounded-full border border-[#EAEAEA] flex items-center justify-center text-[#999] hover:text-[#111] disabled:opacity-30 cursor-pointer transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Active track card */}
              <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto">
                {tracks.map((track, i) => {
                  const isActive = activeTrackIndex === i;
                  const isThisPlaying = player.currentTrack?.id === track.id && player.isPlaying;
                  return (
                    <div
                      key={track.id}
                      onClick={() => setActiveTrackIndex(i)}
                      className={`bg-white rounded-2xl border overflow-hidden cursor-pointer transition-all ${
                        isActive ? "border-[#111] shadow-md ring-1 ring-[#111]/5" : "border-[#EAEAEA] hover:border-[#CCC]"
                      }`}
                    >
                      {/* Poster */}
                      <div className={`aspect-square bg-gradient-to-br ${grads[i]} relative flex items-center justify-center`}>
                        <div className="absolute inset-0 banner-overlay opacity-20" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            track.audioUrl && playTrack(track.id, track.audioUrl, `Track ${i + 1} · ${currentGeneration.input.recipientName}`, currentGeneration.input.genre, currentGeneration.input.mood, grads[i]);
                          }}
                          className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors relative z-10"
                        >
                          {isThisPlaying ? (
                            <Pause className="w-6 h-6 text-white" />
                          ) : (
                            <Play className="w-6 h-6 text-white ml-0.5" />
                          )}
                        </button>
                      </div>

                      {/* Info + actions */}
                      <div className="p-3.5">
                        <p className="text-sm font-semibold text-[#111]">Track {i + 1}</p>
                        <p className="text-[11px] text-[#999] capitalize mt-0.5">
                          {currentGeneration.input.mood} · {currentGeneration.input.genre}
                        </p>

                        {/* Hover actions */}
                        <div className="flex items-center gap-1 mt-3">
                          <button className="w-7 h-7 rounded-full bg-[#FAFAFA] border border-[#EAEAEA] flex items-center justify-center text-[#CCC] hover:text-red-500 hover:border-red-200 transition-colors cursor-pointer">
                            <Heart className="w-3 h-3" />
                          </button>
                          <button className="w-7 h-7 rounded-full bg-[#FAFAFA] border border-[#EAEAEA] flex items-center justify-center text-[#CCC] hover:text-[#111] hover:border-[#CCC] transition-colors cursor-pointer">
                            <ThumbsDown className="w-3 h-3" />
                          </button>
                          <button className="w-7 h-7 rounded-full bg-[#FAFAFA] border border-[#EAEAEA] flex items-center justify-center text-[#CCC] hover:text-[#111] hover:border-[#CCC] transition-colors cursor-pointer">
                            <Share2 className="w-3 h-3" />
                          </button>
                          {!currentGeneration.isPaid && (
                            <button className="ml-auto px-2.5 py-1 rounded-lg border border-[#EAEAEA] text-[10px] font-semibold text-[#888] hover:border-[#111] hover:text-[#111] transition-colors cursor-pointer flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" /> Unlock
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Actions bar */}
              <div className="flex items-center justify-center gap-3 mt-6">
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#111] text-white text-xs font-semibold cursor-pointer hover:bg-[#333] transition-colors">
                  <Share2 className="w-3.5 h-3.5" />
                  Share · {COIN_COSTS.shareFull} coins
                </button>
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FAFAFA] border border-[#EAEAEA] text-[#555] text-xs font-semibold cursor-pointer hover:border-[#CCC] transition-colors">
                  <Lock className="w-3.5 h-3.5" />
                  Unlock All · {COIN_COSTS.fullPack} coins
                </button>
                <button
                  onClick={() => {
                    store.setGenerationStatus("idle");
                    store.setCurrentGeneration(null);
                    setIsGenerating(false);
                    setNameInput("");
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FAFAFA] border border-[#EAEAEA] text-[#999] text-xs font-semibold cursor-pointer hover:border-[#CCC] transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  New Song
                </button>
              </div>

              {/* Lyrics (if available) */}
              {currentGeneration.lyrics && (
                <div className="mt-6 bg-white rounded-2xl border border-[#EAEAEA] p-5 max-w-lg mx-auto">
                  <p className="text-[11px] font-semibold text-[#999] uppercase tracking-wider mb-3">Lyrics</p>
                  <p className="text-sm text-[#555] leading-relaxed whitespace-pre-line">
                    {currentGeneration.lyrics}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
