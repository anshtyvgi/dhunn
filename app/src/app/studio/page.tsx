"use client";

import { useStore } from "@/stores/useStore";
import { usePlayerStore } from "@/stores/playerStore";
import { Play, Pause, Heart, Share2, ThumbsDown, Sparkles, Lock, RotateCcw, Shuffle, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useRef } from "react";
import { generateLyrics, generateMusic, startPolling } from "@/lib/api";
import { COIN_COSTS, GENRES, LANGUAGES, MOODS } from "@/types";
import type { VoiceType, Mood, Genre, Language } from "@/types";

const voices: { value: VoiceType; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "duet", label: "Duet" },
];

const studioPrompts = [
  "A song about chasing dreams in a big city...",
  "The feeling when it rains and you miss someone...",
  "Dancing alone at midnight, feeling alive...",
  "A letter to my younger self...",
  "Letting go of what no longer serves you...",
];

const grads = [
  "from-rose-400 to-violet-500",
  "from-amber-400 to-rose-500",
  "from-violet-400 to-indigo-500",
];

type OutputState = "empty" | "generating" | "generated";

export default function StudioPage() {
  const store = useStore();
  const player = usePlayerStore();
  const { dedication, coins, isFirstTime, currentGeneration, generationStatus } = store;

  const [prompt, setPrompt] = useState("");
  const [customLyrics, setCustomLyrics] = useState("");
  const [genre, setGenre] = useState<Genre>("bollywood");
  const [mood, setMood] = useState<Mood>("romantic");
  const [language, setLanguage] = useState<Language>("hinglish");
  const [voice, setVoice] = useState<VoiceType>("female");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTrackIndex, setActiveTrackIndex] = useState(0);
  const stopRef = useRef<(() => void) | null>(null);

  const cost = isFirstTime ? 0 : COIN_COSTS.generate;

  const outputState: OutputState =
    isGenerating || (generationStatus !== "idle" && generationStatus !== "completed" && generationStatus !== "failed")
      ? "generating"
      : generationStatus === "completed" && currentGeneration
      ? "generated"
      : "empty";

  const handleCreate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    store.setMood(mood);
    store.setGenre(genre);
    store.setLanguage(language);
    store.setVoice(voice);
    store.setMessage(prompt);

    const input = { ...dedication, recipientName: "Studio Track", mood, genre, language, voice, message: prompt, occasion: "custom" as const, relationship: "custom" as const };

    try {
      const result = await generateLyrics(input);

      if (!isFirstTime && !store.deductCoins(cost)) { setIsGenerating(false); return; }

      store.setGenerationStatus("generating-tracks");

      const musicResult = await generateMusic({
        lyrics: result.options.map((o) => o.lyrics),
        tags: result.options.map((o) => o.tags),
        titles: result.options.map((o) => o.title),
        vibes: result.options.map((o) => o.vibe),
        recipientName: "Studio Track",
        occasion: "custom",
        relationship: "custom",
        message: prompt,
        mood,
        genre,
        language,
        voice,
      });

      const gen = {
        id: musicResult.id,
        input: { ...dedication, recipientName: "Studio Track", mood, genre, language, voice, occasion: "custom" as const, relationship: "custom" as const },
        status: "generating-tracks" as const,
        tracks: musicResult.tracks.map((t) => ({ id: t.id, status: t.status as "pending" | "processing" | "completed" | "failed" })),
        lyrics: result.options.map((o) => `${o.title}\n\n${o.lyrics}`).join("\n\n---\n\n"),
        createdAt: new Date().toISOString(),
        isPaid: false,
        isShared: false,
      };

      store.setCurrentGeneration(gen);

      stopRef.current = startPolling(musicResult.id, (data) => {
        const done = data.status === "completed";
        const updated = { ...gen, status: done ? ("completed" as const) : ("generating-tracks" as const), posterUrl: data.posterUrl || undefined, tracks: data.tracks.map((t) => ({ id: t.id, status: t.status, audioUrl: t.audioUrl || undefined })) };
        store.setCurrentGeneration(updated);
        if (done) { store.setGenerationStatus("completed"); store.addGeneration({ ...updated, status: "completed" }); setIsGenerating(false); }
      }, () => { store.setGenerationStatus("failed"); setIsGenerating(false); if (!isFirstTime) store.addCoins(cost); }, 5000);
    } catch { setIsGenerating(false); store.setGenerationStatus("failed"); }
  };

  const playTrack = (trackId: string, audioUrl: string, title: string, g: string, m: string, gradient: string) => {
    if (player.currentTrack?.id === trackId && player.isPlaying) { player.pause(); return; }
    if (player.currentTrack?.id === trackId) { player.resume(); return; }
    player.play({ id: trackId, title, artist: "Dhun AI", audioUrl, genre: g, mood: m, gradient });
  };

  const tracks = currentGeneration?.tracks || [];

  return (
    <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-56px)] overflow-hidden">
      {/* ═══ LEFT PANEL — Controls ═══ */}
      <div className={`w-full lg:w-[35%] xl:w-[400px] shrink-0 bg-white lg:border-r border-[#F0F0F0] flex flex-col ${outputState !== "empty" ? "hidden lg:flex" : ""}`}>
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Header */}
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-[#111]">Studio</h2>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#111] text-white font-bold uppercase tracking-wider">Pro</span>
          </div>

          {/* Prompt */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-semibold text-[#999] uppercase tracking-wider">Prompt</label>
              <button onClick={() => setPrompt(studioPrompts[Math.floor(Math.random() * studioPrompts.length)])} className="flex items-center gap-1 text-[10px] text-[#7B61FF] font-semibold cursor-pointer hover:underline">
                <Shuffle className="w-3 h-3" /> Inspire
              </button>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the song you want to create..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-[#FAFAFA] text-[#111] text-sm placeholder:text-[#CCC] focus:outline-none focus:ring-2 focus:ring-[#111]/10 border border-[#EAEAEA] resize-none"
            />
          </div>

          {/* Tags */}
          <div className="space-y-3">
            {/* Genre */}
            <div>
              <label className="text-[11px] font-semibold text-[#999] uppercase tracking-wider mb-1.5 block">Genre</label>
              <div className="flex flex-wrap gap-1">
                {GENRES.map((g) => (
                  <button key={g.value} onClick={() => setGenre(g.value)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] cursor-pointer transition-all ${genre === g.value ? "bg-[#111] text-white font-semibold" : "bg-[#FAFAFA] text-[#888] border border-[#EAEAEA]"}`}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Mood */}
            <div>
              <label className="text-[11px] font-semibold text-[#999] uppercase tracking-wider mb-1.5 block">Mood</label>
              <div className="flex flex-wrap gap-1">
                {MOODS.map((m) => (
                  <button key={m.value} onClick={() => setMood(m.value)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] cursor-pointer transition-all ${mood === m.value ? "bg-[#111] text-white font-semibold" : "bg-[#FAFAFA] text-[#888] border border-[#EAEAEA]"}`}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Language + Voice */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[11px] font-semibold text-[#999] uppercase tracking-wider mb-1.5 block">Language</label>
                <div className="flex flex-wrap gap-1">
                  {LANGUAGES.map((l) => (
                    <button key={l.value} onClick={() => setLanguage(l.value)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] cursor-pointer transition-all ${language === l.value ? "bg-[#111] text-white font-semibold" : "bg-[#FAFAFA] text-[#888] border border-[#EAEAEA]"}`}>
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="w-[140px] shrink-0">
                <label className="text-[11px] font-semibold text-[#999] uppercase tracking-wider mb-1.5 block">Voice</label>
                <div className="flex gap-1">
                  {voices.map((v) => (
                    <button key={v.value} onClick={() => setVoice(v.value)}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] cursor-pointer transition-all ${voice === v.value ? "bg-[#111] text-white font-semibold" : "bg-[#FAFAFA] text-[#888] border border-[#EAEAEA]"}`}>
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Advanced (collapsible) */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-[11px] text-[#999] font-semibold uppercase tracking-wider cursor-pointer hover:text-[#111] transition-colors"
            >
              Advanced
              <ChevronDown className={`w-3 h-3 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
            </button>
            {showAdvanced && (
              <div className="mt-3 space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#999] uppercase tracking-wider mb-1.5 block">Custom lyrics</label>
                  <textarea
                    value={customLyrics}
                    onChange={(e) => setCustomLyrics(e.target.value)}
                    placeholder="Write your own lyrics or leave blank for AI..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-[#FAFAFA] text-[#111] text-sm placeholder:text-[#CCC] focus:outline-none focus:ring-2 focus:ring-[#111]/10 border border-[#EAEAEA] resize-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="p-4 border-t border-[#F0F0F0] bg-white">
          <button
            onClick={handleCreate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full py-3.5 rounded-xl bg-[#111] text-white font-semibold text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-[#333] transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            {isGenerating ? "Creating..." : isFirstTime ? "Generate" : `Generate · ${cost} coins`}
          </button>
        </div>
      </div>

      {/* ═══ RIGHT PANEL — Output ═══ */}
      <div className={`flex-1 flex-col bg-[#F7F7F8] overflow-y-auto ${outputState === "empty" ? "hidden lg:flex" : "flex"}`}>
        {/* EMPTY */}
        {outputState === "empty" && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-sm">
              <div className="w-20 h-20 rounded-3xl bg-white border border-[#EAEAEA] flex items-center justify-center mx-auto mb-5">
                <Sparkles className="w-8 h-8 text-[#DDD]" />
              </div>
              <h3 className="text-lg font-bold text-[#111] mb-1.5">Your tracks will appear here</h3>
              <p className="text-sm text-[#999]">Write a prompt and configure your style, then generate.</p>
            </div>
          </div>
        )}

        {/* GENERATING */}
        {outputState === "generating" && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-3xl mx-auto">
              {[0, 1, 2].map((i) => {
                const track = tracks[i];
                const isReady = track?.status === "completed";
                return (
                  <div key={i} className="bg-white rounded-2xl border border-[#EAEAEA] overflow-hidden">
                    <div className={`aspect-square bg-gradient-to-br ${grads[i]} relative flex items-center justify-center ${!isReady ? "animate-pulse" : ""}`}>
                      {isReady ? (
                        <button onClick={() => track.audioUrl && playTrack(track.id, track.audioUrl, `Track ${i + 1}`, genre, mood, grads[i])} className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors">
                          <Play className="w-6 h-6 text-white ml-0.5" />
                        </button>
                      ) : (
                        <div className="w-8 h-8 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      )}
                    </div>
                    <div className="p-3.5">
                      {isReady ? (
                        <>
                          <p className="text-sm font-semibold text-[#111]">Track {i + 1}</p>
                          <p className="text-[11px] text-[#999] capitalize mt-0.5">{mood} · {genre}</p>
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
                <p className="text-sm text-[#999]">Composing music...</p>
              </div>
            </div>
          </div>
        )}

        {/* GENERATED — identical output UX to Create */}
        {outputState === "generated" && currentGeneration && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-[#111]">Studio Output</h2>
              <div className="flex items-center gap-1">
                <button onClick={() => setActiveTrackIndex(Math.max(0, activeTrackIndex - 1))} disabled={activeTrackIndex === 0} className="w-7 h-7 rounded-full border border-[#EAEAEA] flex items-center justify-center text-[#999] hover:text-[#111] disabled:opacity-30 cursor-pointer transition-colors"><ChevronLeft className="w-3.5 h-3.5" /></button>
                <span className="text-[11px] text-[#999] font-medium px-2">{activeTrackIndex + 1} / {tracks.length}</span>
                <button onClick={() => setActiveTrackIndex(Math.min(tracks.length - 1, activeTrackIndex + 1))} disabled={activeTrackIndex === tracks.length - 1} className="w-7 h-7 rounded-full border border-[#EAEAEA] flex items-center justify-center text-[#999] hover:text-[#111] disabled:opacity-30 cursor-pointer transition-colors"><ChevronRight className="w-3.5 h-3.5" /></button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-3xl mx-auto">
              {tracks.map((track, i) => {
                const isActive = activeTrackIndex === i;
                const isThisPlaying = player.currentTrack?.id === track.id && player.isPlaying;
                return (
                  <div key={track.id} onClick={() => setActiveTrackIndex(i)} className={`bg-white rounded-2xl border overflow-hidden cursor-pointer transition-all ${isActive ? "border-[#111] shadow-md ring-1 ring-[#111]/5" : "border-[#EAEAEA] hover:border-[#CCC]"}`}>
                    <div className={`aspect-square bg-gradient-to-br ${grads[i]} relative flex items-center justify-center`}>
                      <div className="absolute inset-0 banner-overlay opacity-20" />
                      <button onClick={(e) => { e.stopPropagation(); track.audioUrl && playTrack(track.id, track.audioUrl, `Track ${i+1}`, currentGeneration.input.genre, currentGeneration.input.mood, grads[i]); }} className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors relative z-10">
                        {isThisPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white ml-0.5" />}
                      </button>
                    </div>
                    <div className="p-3.5">
                      <p className="text-sm font-semibold text-[#111]">Track {i + 1}</p>
                      <p className="text-[11px] text-[#999] capitalize mt-0.5">{currentGeneration.input.mood} · {currentGeneration.input.genre}</p>
                      <div className="flex items-center gap-1 mt-3">
                        <button className="w-7 h-7 rounded-full bg-[#FAFAFA] border border-[#EAEAEA] flex items-center justify-center text-[#CCC] hover:text-red-500 hover:border-red-200 transition-colors cursor-pointer"><Heart className="w-3 h-3" /></button>
                        <button className="w-7 h-7 rounded-full bg-[#FAFAFA] border border-[#EAEAEA] flex items-center justify-center text-[#CCC] hover:text-[#111] hover:border-[#CCC] transition-colors cursor-pointer"><ThumbsDown className="w-3 h-3" /></button>
                        <button className="w-7 h-7 rounded-full bg-[#FAFAFA] border border-[#EAEAEA] flex items-center justify-center text-[#CCC] hover:text-[#111] hover:border-[#CCC] transition-colors cursor-pointer"><Share2 className="w-3 h-3" /></button>
                        {!currentGeneration.isPaid && (
                          <button className="ml-auto px-2.5 py-1 rounded-lg border border-[#EAEAEA] text-[10px] font-semibold text-[#888] hover:border-[#111] hover:text-[#111] transition-colors cursor-pointer flex items-center gap-1"><Lock className="w-2.5 h-2.5" /> Unlock</button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-3 mt-6">
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#111] text-white text-xs font-semibold cursor-pointer hover:bg-[#333] transition-colors"><Share2 className="w-3.5 h-3.5" /> Share · {COIN_COSTS.shareFull} coins</button>
              <button onClick={() => { store.setGenerationStatus("idle"); store.setCurrentGeneration(null); setIsGenerating(false); setPrompt(""); }} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FAFAFA] border border-[#EAEAEA] text-[#999] text-xs font-semibold cursor-pointer hover:border-[#CCC] transition-colors"><RotateCcw className="w-3.5 h-3.5" /> New</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
