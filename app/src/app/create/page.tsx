"use client";

import { useStore } from "@/stores/useStore";
import {
  Play, Pause, Heart, Share2, ThumbsDown, Sparkles, Lock, RotateCcw,
  Upload, Download, Package, Tv, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import { COIN_COSTS, FREE_PREVIEW_SECONDS, MAX_AD_UNLOCKS_PER_DAY } from "@/types";
import type { Mood, Generation } from "@/types";
import { usePlayerStore } from "@/stores/playerStore";
import { UnlockModal } from "@/components/ui/UnlockModal";
import { generateLyrics, generateMusic, startPolling } from "@/lib/api";

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
type UnlockAction = "unlock" | "share" | "download" | "fullPack";

export default function CreatePage() {
  const store = useStore();
  const player = usePlayerStore();
  const { dedication, coins, isFirstTime, currentGeneration, generationStatus } = store;

  const [nameInput, setNameInput] = useState("");
  const [selectedMood, setSelectedMood] = useState<Mood>("romantic");
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTrackIndex, setActiveTrackIndex] = useState(0);
  const [unlockModal, setUnlockModal] = useState<{ action: UnlockAction; trackId?: string } | null>(null);
  const [unlockedTracks, setUnlockedTracks] = useState<Set<string>>(new Set());
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set());

  const stopRef = useRef<(() => void) | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => { stopRef.current?.(); };
  }, []);

  // Resume polling if there's an in-progress generation (e.g. after page refresh)
  // Only runs once on mount — won't interfere with handleCreate
  const hasResumed = useRef(false);
  useEffect(() => {
    if (hasResumed.current) return;
    if (
      currentGeneration &&
      generationStatus !== "completed" &&
      generationStatus !== "failed" &&
      generationStatus !== "idle"
    ) {
      hasResumed.current = true;
      setIsGenerating(true);
      stopRef.current?.(); // kill any existing poller
      stopRef.current = startPolling(currentGeneration.id, (data) => {
        const done = data.status === "completed";
        const failed = data.status === "failed";
        const updated = {
          ...currentGeneration,
          status: done ? ("completed" as const) : failed ? ("failed" as const) : ("generating-tracks" as const),
          posterUrl: data.posterUrl || undefined,
          tracks: data.tracks.length > 0
            ? data.tracks.map((t) => ({ id: t.id, status: t.status, audioUrl: t.audioUrl || undefined }))
            : currentGeneration.tracks, // keep existing tracks if poll returns empty
        };
        store.setCurrentGeneration(updated);
        if (done) {
          store.setGenerationStatus("completed");
          store.addGeneration({ ...updated, status: "completed" });
          setIsGenerating(false);
        }
        if (failed) {
          store.setGenerationStatus("failed");
          setIsGenerating(false);
        }
      }, () => {
        store.setGenerationStatus("failed");
        setIsGenerating(false);
      }, 5000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cost = isFirstTime ? 0 : COIN_COSTS.generate;

  // Determine output state
  const outputState: OutputState =
    isGenerating
      ? "generating"
      : generationStatus === "completed" && currentGeneration
      ? "generated"
      : "empty";

  const handleCreate = useCallback(async () => {
    if (!nameInput.trim()) return;
    setIsGenerating(true);
    setUnlockedTracks(new Set());
    setLikedTracks(new Set());
    setActiveTrackIndex(0);

    store.setRecipientName(nameInput);
    store.setMood(selectedMood);

    if (!isFirstTime && !store.deductCoins(cost)) {
      setIsGenerating(false);
      return;
    }

    const input = { ...dedication, recipientName: nameInput, mood: selectedMood };

    try {
      store.setGenerationStatus("generating-prompt");
      const lyricsResult = await generateLyrics(input);

      store.setGenerationStatus("generating-tracks");
      const musicResult = await generateMusic({
        lyrics: lyricsResult.options.map((o) => o.lyrics),
        tags: lyricsResult.options.map((o) => o.tags),
        titles: lyricsResult.options.map((o) => o.title),
        vibes: lyricsResult.options.map((o) => o.vibe),
        recipientName: nameInput,
        occasion: input.occasion,
        relationship: input.relationship,
        message: input.message,
        mood: selectedMood,
        genre: input.genre,
        language: input.language,
        voice: input.voice,
      });

      const gen: Generation = {
        id: musicResult.id,
        input,
        status: "generating-tracks",
        tracks: musicResult.tracks.map((t) => ({ id: t.id, status: t.status as "pending" | "processing" | "completed" | "failed" })),
        lyrics: lyricsResult.options.map((o) => `${o.title}\n\n${o.lyrics}`).join("\n\n---\n\n"),
        createdAt: new Date().toISOString(),
        isPaid: false,
        isShared: false,
      };

      store.setCurrentGeneration(gen);
      store.setIsFirstTime(false); // first gen used

      stopRef.current?.(); // kill any existing poller
      stopRef.current = startPolling(musicResult.id, (data) => {
        const done = data.status === "completed";
        const failed = data.status === "failed";
        const updated = {
          ...gen,
          status: done ? ("completed" as const) : failed ? ("failed" as const) : ("generating-tracks" as const),
          posterUrl: data.posterUrl || undefined,
          tracks: data.tracks.length > 0
            ? data.tracks.map((t) => ({ id: t.id, status: t.status, audioUrl: t.audioUrl || undefined }))
            : gen.tracks, // keep placeholder tracks if backend hasn't created variants yet
        };
        store.setCurrentGeneration(updated);
        if (done) {
          store.setGenerationStatus("completed");
          store.addGeneration({ ...updated, status: "completed" });
          setIsGenerating(false);
        }
        if (failed) {
          store.setGenerationStatus("failed");
          setIsGenerating(false);
        }
      }, () => {
        store.setGenerationStatus("failed");
        setIsGenerating(false);
        if (!isFirstTime) store.addCoins(cost);
      }, 5000);
    } catch {
      setIsGenerating(false);
      store.setGenerationStatus("failed");
      if (!isFirstTime) store.addCoins(cost);
    }
  }, [nameInput, selectedMood, isFirstTime, cost, dedication, store]);

  const playTrack = (trackId: string, audioUrl: string, title: string, genre: string, mood: string, gradient: string) => {
    if (player.currentTrack?.id === trackId && player.isPlaying) { player.pause(); return; }
    if (player.currentTrack?.id === trackId) { player.resume(); return; }
    player.play({ id: trackId, title, artist: "Dhun AI", audioUrl, genre, mood, gradient });
  };

  const handleUnlock = (trackId: string) => {
    setUnlockedTracks((prev) => new Set(prev).add(trackId));
    setUnlockModal(null);
  };

  const handleUnlockAll = () => {
    if (!currentGeneration) return;
    currentGeneration.tracks.forEach((t) => {
      setUnlockedTracks((prev) => new Set(prev).add(t.id));
    });
    setUnlockModal(null);
  };

  const toggleLike = (trackId: string) => {
    setLikedTracks((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) next.delete(trackId); else next.add(trackId);
      return next;
    });
  };

  const tracks = currentGeneration?.tracks || [];
  const adUnlocksLeft = store.getAdUnlocksRemaining();

  return (
    <>
      <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-56px)] overflow-hidden">
        {/* ═══ LEFT PANEL — Input (35%) ═══ */}
        <div className={`w-full lg:w-[35%] xl:w-[380px] shrink-0 bg-white lg:border-r border-[#F0F0F0] flex flex-col ${outputState !== "empty" ? "hidden lg:flex" : ""}`}>
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
              <label className="text-[11px] font-semibold text-[#999] uppercase tracking-wider mb-2 block">Mood</label>
              <div className="flex flex-wrap gap-1.5">
                {moods.map((m) => (
                  <button key={m.value} onClick={() => setSelectedMood(m.value)}
                    className={`px-3 py-2 rounded-xl text-xs cursor-pointer transition-all flex items-center gap-1.5 ${
                      selectedMood === m.value ? "bg-[#111] text-white font-semibold" : "bg-[#FAFAFA] text-[#888] border border-[#EAEAEA] hover:border-[#CCC]"
                    }`}
                  >
                    <span>{m.emoji}</span>{m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="text-[11px] font-semibold text-[#999] uppercase tracking-wider mb-2 block">Duration</label>
              <div className="flex gap-2">
                {durations.map((d) => (
                  <button key={d.value} onClick={() => setSelectedDuration(d.value)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                      selectedDuration === d.value ? "bg-[#111] text-white" : "bg-[#FAFAFA] text-[#888] border border-[#EAEAEA] hover:border-[#CCC]"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Upload */}
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

          {/* CTA */}
          <div className="p-4 border-t border-[#F0F0F0] bg-white">
            <button onClick={handleCreate} disabled={isGenerating || !nameInput.trim()}
              className="w-full py-3.5 rounded-xl bg-[#111] text-white font-semibold text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-[#333] transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              {isGenerating ? "Creating..." : isFirstTime ? "Create Song" : `Create Song · ${cost} coins`}
            </button>
            {isFirstTime && <p className="text-[10px] text-center text-[#BBB] mt-2">First one&apos;s free — no coins needed</p>}
          </div>
        </div>

        {/* ═══ RIGHT PANEL — Output (65%) ═══ */}
        <div className={`flex-1 flex-col bg-[#F7F7F8] overflow-y-auto ${outputState === "empty" ? "hidden lg:flex" : "flex"}`}>

          {/* ── EMPTY ── */}
          {outputState === "empty" && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-sm">
                <div className="w-20 h-20 rounded-3xl bg-white border border-[#EAEAEA] flex items-center justify-center mx-auto mb-5">
                  <Sparkles className="w-8 h-8 text-[#DDD]" />
                </div>
                <h3 className="text-lg font-bold text-[#111] mb-1.5">Create a song in seconds</h3>
                <p className="text-sm text-[#999]">Fill in the details on the left and hit Create.<br />We&apos;ll generate 3 unique tracks for you.</p>
              </div>
            </div>
          )}

          {/* ── GENERATING ── */}
          {outputState === "generating" && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-3xl mx-auto">
                {[0, 1, 2].map((i) => {
                  const track = tracks[i];
                  const isReady = track?.status === "completed";
                  return (
                    <div key={i} className="bg-white rounded-2xl border border-[#EAEAEA] overflow-hidden flex sm:flex-col">
                      <div className={`w-24 sm:w-full aspect-square bg-gradient-to-br ${grads[i]} relative flex items-center justify-center shrink-0 ${!isReady ? "animate-pulse" : ""}`}>
                        {isReady ? (
                          <button onClick={() => track.audioUrl && playTrack(track.id, track.audioUrl, `Track ${i + 1}`, currentGeneration!.input.genre, currentGeneration!.input.mood, grads[i])}
                            className="w-10 sm:w-14 h-10 sm:h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors">
                            <Play className="w-5 sm:w-6 h-5 sm:h-6 text-white ml-0.5" />
                          </button>
                        ) : (
                          <div className="w-6 sm:w-8 h-6 sm:h-8 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                        )}
                      </div>
                      <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-center">
                        {isReady ? (
                          <>
                            <p className="text-sm font-semibold text-[#111]">Track {i + 1}</p>
                            <p className="text-[11px] text-[#999] capitalize mt-0.5">{currentGeneration?.input.mood} · {currentGeneration?.input.genre}</p>
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

          {/* ── GENERATED — Full micropayment flow ── */}
          {outputState === "generated" && currentGeneration && (
            <div className="flex-1 overflow-y-auto p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base font-bold text-[#111]">For {currentGeneration.input.recipientName}</h2>
                  <p className="text-[11px] text-[#999] capitalize">{currentGeneration.input.mood} · {currentGeneration.input.genre} · 3 tracks</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setActiveTrackIndex(Math.max(0, activeTrackIndex - 1))} disabled={activeTrackIndex === 0}
                    className="w-7 h-7 rounded-full border border-[#EAEAEA] flex items-center justify-center text-[#999] hover:text-[#111] disabled:opacity-30 cursor-pointer transition-colors">
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] text-[#999] font-medium px-2">{activeTrackIndex + 1} / {tracks.length}</span>
                  <button onClick={() => setActiveTrackIndex(Math.min(tracks.length - 1, activeTrackIndex + 1))} disabled={activeTrackIndex === tracks.length - 1}
                    className="w-7 h-7 rounded-full border border-[#EAEAEA] flex items-center justify-center text-[#999] hover:text-[#111] disabled:opacity-30 cursor-pointer transition-colors">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 3 Track Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-3xl mx-auto">
                {tracks.map((track, i) => {
                  const isActive = activeTrackIndex === i;
                  const isThisPlaying = player.currentTrack?.id === track.id && player.isPlaying;
                  const isUnlocked = unlockedTracks.has(track.id) || currentGeneration.isPaid;
                  return (
                    <div key={track.id} onClick={() => setActiveTrackIndex(i)}
                      className={`bg-white rounded-2xl border overflow-hidden cursor-pointer transition-all ${
                        isActive ? "border-[#111] shadow-md ring-1 ring-[#111]/5" : "border-[#EAEAEA] hover:border-[#CCC]"
                      }`}
                    >
                      {/* Poster */}
                      <div className={`aspect-square bg-gradient-to-br ${grads[i]} relative flex items-center justify-center`}>
                        <div className="absolute inset-0 banner-overlay opacity-20" />
                        <button onClick={(e) => { e.stopPropagation(); track.audioUrl && playTrack(track.id, track.audioUrl, `Track ${i + 1} · ${currentGeneration.input.recipientName}`, currentGeneration.input.genre, currentGeneration.input.mood, grads[i]); }}
                          className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors relative z-10">
                          {isThisPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white ml-0.5" />}
                        </button>
                        {/* Lock badge */}
                        {!isUnlocked && (
                          <div className="absolute top-2.5 right-2.5 z-10 px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5 text-white/80" />
                            <span className="text-white/80 text-[9px] font-semibold">{FREE_PREVIEW_SECONDS}s preview</span>
                          </div>
                        )}
                        {isUnlocked && (
                          <div className="absolute top-2.5 right-2.5 z-10 px-2 py-1 rounded-full bg-emerald-500/80 backdrop-blur-sm flex items-center gap-1">
                            <span className="text-white text-[9px] font-semibold">Unlocked ✓</span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-3.5">
                        <p className="text-sm font-semibold text-[#111]">Track {i + 1}</p>
                        <p className="text-[11px] text-[#999] capitalize mt-0.5">{currentGeneration.input.mood} · {currentGeneration.input.genre}</p>

                        {/* Actions row */}
                        <div className="flex items-center gap-1 mt-3">
                          <button onClick={(e) => { e.stopPropagation(); toggleLike(track.id); }}
                            className={`w-7 h-7 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                              likedTracks.has(track.id) ? "bg-red-50 border-red-200 text-red-500" : "bg-[#FAFAFA] border-[#EAEAEA] text-[#CCC] hover:text-red-500 hover:border-red-200"
                            }`}>
                            <Heart className={`w-3 h-3 ${likedTracks.has(track.id) ? "fill-red-500" : ""}`} />
                          </button>
                          <button className="w-7 h-7 rounded-full bg-[#FAFAFA] border border-[#EAEAEA] flex items-center justify-center text-[#CCC] hover:text-[#111] hover:border-[#CCC] transition-colors cursor-pointer">
                            <ThumbsDown className="w-3 h-3" />
                          </button>

                          {/* Unlock / Share per track */}
                          {!isUnlocked ? (
                            <button onClick={(e) => { e.stopPropagation(); setUnlockModal({ action: "unlock", trackId: track.id }); }}
                              className="ml-auto px-2.5 py-1 rounded-lg bg-[#111] text-white text-[10px] font-semibold cursor-pointer hover:bg-[#333] transition-colors flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" /> Unlock
                            </button>
                          ) : (
                            <button onClick={(e) => { e.stopPropagation(); setUnlockModal({ action: "share", trackId: track.id }); }}
                              className="ml-auto px-2.5 py-1 rounded-lg bg-[#FAFAFA] border border-[#EAEAEA] text-[10px] font-semibold text-[#666] cursor-pointer hover:border-[#CCC] transition-colors flex items-center gap-1">
                              <Share2 className="w-2.5 h-2.5" /> Share
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ═══ ACTION BAR — Full pricing visible ═══ */}
              <div className="mt-6 bg-white rounded-2xl border border-[#EAEAEA] p-5 max-w-3xl mx-auto">
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {/* Share */}
                  <button onClick={() => setUnlockModal({ action: "share" })}
                    className="flex flex-col items-center gap-2 p-3.5 rounded-xl border border-[#EAEAEA] hover:border-[#CCC] transition-colors cursor-pointer group">
                    <div className="w-10 h-10 rounded-xl bg-[#F5F5F5] flex items-center justify-center group-hover:bg-[#EAEAEA] transition-colors">
                      <Share2 className="w-4.5 h-4.5 text-[#666]" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-[#111]">Share</p>
                      <p className="text-[10px] text-[#999]">{COIN_COSTS.shareFull} coins</p>
                    </div>
                  </button>

                  {/* Download */}
                  <button onClick={() => setUnlockModal({ action: "download" })}
                    className="flex flex-col items-center gap-2 p-3.5 rounded-xl border border-[#EAEAEA] hover:border-[#CCC] transition-colors cursor-pointer group">
                    <div className="w-10 h-10 rounded-xl bg-[#F5F5F5] flex items-center justify-center group-hover:bg-[#EAEAEA] transition-colors">
                      <Download className="w-4.5 h-4.5 text-[#666]" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-[#111]">Download HD</p>
                      <p className="text-[10px] text-[#999]">{COIN_COSTS.download} coins</p>
                    </div>
                  </button>

                  {/* Full Pack */}
                  <button onClick={() => setUnlockModal({ action: "fullPack" })}
                    className="flex flex-col items-center gap-2 p-3.5 rounded-xl border-2 border-[#111] bg-[#FAFAFA] hover:bg-[#F0F0F0] transition-colors cursor-pointer group">
                    <div className="w-10 h-10 rounded-xl bg-[#111] flex items-center justify-center">
                      <Package className="w-4.5 h-4.5 text-white" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-[#111]">Full Pack</p>
                      <p className="text-[10px] text-[#999]">{COIN_COSTS.fullPack} coins · best deal</p>
                    </div>
                  </button>

                  {/* Watch Ad — free unlock */}
                  <button
                    onClick={() => setUnlockModal({ action: "unlock", trackId: tracks[activeTrackIndex]?.id })}
                    className="flex flex-col items-center gap-2 p-3.5 rounded-xl border border-dashed border-[#CCC] hover:border-[#111] transition-colors cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#FFF8E1] flex items-center justify-center">
                      <Tv className="w-4.5 h-4.5 text-[#E6A800]" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-[#111]">Watch Ad</p>
                      <p className="text-[10px] text-[#999]">Free · {adUnlocksLeft}/{MAX_AD_UNLOCKS_PER_DAY} left</p>
                    </div>
                  </button>
                </div>

                {/* Pricing footer */}
                <div className="mt-4 pt-3 border-t border-[#F0F0F0] flex items-center justify-between">
                  <p className="text-[10px] text-[#BBB]">Free preview: {FREE_PREVIEW_SECONDS}s per track</p>
                  <div className="flex items-center gap-3">
                    <button onClick={() => { store.setGenerationStatus("idle"); store.setCurrentGeneration(null); setIsGenerating(false); setNameInput(""); }}
                      className="flex items-center gap-1.5 text-[11px] text-[#999] font-semibold cursor-pointer hover:text-[#111] transition-colors">
                      <RotateCcw className="w-3 h-3" /> New Song
                    </button>
                    <span className="text-[10px] text-[#DDD]">·</span>
                    <span className="text-[10px] text-[#999]">Balance: <span className="font-bold text-[#111]">{coins}</span> coins</span>
                  </div>
                </div>
              </div>

              {/* Lyrics */}
              {currentGeneration.lyrics && (
                <div className="mt-5 bg-white rounded-2xl border border-[#EAEAEA] p-5 max-w-3xl mx-auto">
                  <p className="text-[11px] font-semibold text-[#999] uppercase tracking-wider mb-3">Lyrics</p>
                  <p className="text-sm text-[#555] leading-relaxed whitespace-pre-line">{currentGeneration.lyrics}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══ UNLOCK MODAL ═══ */}
      {unlockModal && (
        <UnlockModal
          action={unlockModal.action}
          trackTitle={unlockModal.trackId ? `Track ${tracks.findIndex((t) => t.id === unlockModal.trackId) + 1}` : undefined}
          onUnlock={() => {
            if (unlockModal.action === "fullPack") handleUnlockAll();
            else if (unlockModal.trackId) handleUnlock(unlockModal.trackId);
            else setUnlockModal(null);
          }}
          onClose={() => setUnlockModal(null)}
        />
      )}
    </>
  );
}
