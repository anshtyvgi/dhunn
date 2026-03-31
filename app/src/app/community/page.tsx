"use client";

import { Heart, MessageCircle, Play, Pause, Share2, RotateCcw, ChevronRight, Music } from "lucide-react";
import { usePlayerStore } from "@/stores/playerStore";
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";

/**
 * Community = Studio-only, creator-driven music feed.
 * NO dedications. NO personal context. NO "For X" labels.
 * This is a music platform, not WhatsApp.
 */

interface CommunityTrack {
  id: string;
  title: string;
  creator: string;
  genre: string;
  mood: string;
  gradient: string;
  audioUrl: string;
  likes: number;
  comments: number;
  remixes: number;
  plays: string;
  tags: string[];
}

const tracks: CommunityTrack[] = [
  { id: "r1", title: "Neon Dreams", creator: "ansh_creates", genre: "Lo-fi", mood: "Chill", gradient: "from-indigo-500 to-violet-600", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", likes: 1420, comments: 89, remixes: 34, plays: "157K", tags: ["lo-fi", "chill", "night"] },
  { id: "r2", title: "Golden Hour", creator: "priya_music", genre: "Pop", mood: "Happy", gradient: "from-amber-400 to-orange-500", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", likes: 3200, comments: 215, remixes: 67, plays: "301K", tags: ["pop", "upbeat", "summer"] },
  { id: "r3", title: "Midnight in Mumbai", creator: "raj_beats", genre: "Bollywood", mood: "Nostalgic", gradient: "from-rose-500 to-pink-600", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", likes: 891, comments: 127, remixes: 22, plays: "92K", tags: ["bollywood", "nostalgic", "city"] },
  { id: "r4", title: "Static Pulse", creator: "neha_vibes", genre: "Electronic", mood: "Energetic", gradient: "from-cyan-500 to-blue-600", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", likes: 2100, comments: 156, remixes: 45, plays: "189K", tags: ["electronic", "energy", "synth"] },
  { id: "r5", title: "Paper Planes", creator: "karan_dhun", genre: "Acoustic", mood: "Bittersweet", gradient: "from-emerald-500 to-teal-600", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", likes: 780, comments: 64, remixes: 18, plays: "68K", tags: ["acoustic", "indie", "raw"] },
  { id: "r6", title: "Kundalini", creator: "simran_mel", genre: "Classical", mood: "Spiritual", gradient: "from-purple-500 to-fuchsia-600", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", likes: 560, comments: 42, remixes: 11, plays: "41K", tags: ["classical", "fusion", "deep"] },
];

const timestampComments = [
  { time: "0:12", user: "dev_music", text: "that drop is insane" },
  { time: "0:30", user: "simran_mel", text: "hook is crazy 🔥" },
  { time: "1:05", user: "raj_beats", text: "the production here..." },
  { time: "1:22", user: "neha_vibes", text: "remix potential is wild" },
];

function fmt(n: number) { return n >= 1000 ? (n / 1000).toFixed(1) + "k" : n.toString(); }

export default function CommunityPage() {
  const player = usePlayerStore();
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [activeIndex, setActiveIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const reelsRef = useRef<HTMLDivElement>(null);

  const activeTrack = tracks[activeIndex];

  const toggleLike = (id: string) => {
    setLiked((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const playTrack = useCallback((track: CommunityTrack) => {
    if (player.currentTrack?.id === track.id && player.isPlaying) { player.pause(); return; }
    if (player.currentTrack?.id === track.id) { player.resume(); return; }
    player.play({ id: track.id, title: track.title, artist: `@${track.creator}`, audioUrl: track.audioUrl, genre: track.genre, mood: track.mood, gradient: track.gradient });
  }, [player]);

  // Auto-play on index change
  useEffect(() => {
    playTrack(tracks[activeIndex]);
  }, [activeIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const goNext = () => setActiveIndex((i) => Math.min(tracks.length - 1, i + 1));
  const goPrev = () => setActiveIndex((i) => Math.max(0, i - 1));

  // Scroll/swipe detection for reels
  useEffect(() => {
    const el = reelsRef.current;
    if (!el) return;
    let startY = 0;
    const onTouchStart = (e: TouchEvent) => { startY = e.touches[0].clientY; };
    const onTouchEnd = (e: TouchEvent) => {
      const diff = startY - e.changedTouches[0].clientY;
      if (Math.abs(diff) > 50) { diff > 0 ? goNext() : goPrev(); }
    };
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => { el.removeEventListener("touchstart", onTouchStart); el.removeEventListener("touchend", onTouchEnd); };
  }, []);

  const isPlaying = (id: string) => player.currentTrack?.id === id && player.isPlaying;

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">
      {/* ═══ REELS FEED (LEFT 60%) ═══ */}
      <div ref={reelsRef} className="flex-1 flex items-center justify-center bg-black relative overflow-hidden">
        {/* Current reel */}
        <div className="w-full h-full max-w-md mx-auto relative">
          <div className={`absolute inset-0 bg-gradient-to-br ${activeTrack.gradient}`}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
          </div>

          {/* Center play button */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <button
              onClick={() => playTrack(activeTrack)}
              className="w-20 h-20 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center cursor-pointer hover:bg-white/25 transition-colors"
            >
              {isPlaying(activeTrack.id) ? (
                <Pause className="w-8 h-8 text-white" />
              ) : (
                <Play className="w-8 h-8 text-white ml-1" />
              )}
            </button>
          </div>

          {/* Bottom info */}
          <div className="absolute bottom-0 left-0 right-16 p-5 z-10">
            <p className="text-white font-bold text-xl">{activeTrack.title}</p>
            <Link href={`/profile?user=${activeTrack.creator}`}>
              <p className="text-white/70 text-sm mt-1 hover:text-white transition-colors cursor-pointer">@{activeTrack.creator}</p>
            </Link>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-white/50 text-xs">{activeTrack.genre}</span>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span className="text-white/50 text-xs">{activeTrack.mood}</span>
            </div>
            {/* Tags */}
            <div className="flex gap-1.5 mt-3">
              {activeTrack.tags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-[10px]">#{tag}</span>
              ))}
            </div>

            {/* Progress bar */}
            {player.currentTrack?.id === activeTrack.id && (
              <div className="mt-3 h-0.5 rounded-full bg-white/20">
                <div className="h-full rounded-full bg-white/60 transition-all" style={{ width: `${player.progress}%` }} />
              </div>
            )}
          </div>

          {/* Right action bar */}
          <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5 z-10">
            {/* Like */}
            <button onClick={() => toggleLike(activeTrack.id)} className="flex flex-col items-center gap-1">
              <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <Heart className={`w-5 h-5 ${liked.has(activeTrack.id) ? "text-red-400 fill-red-400" : "text-white"}`} />
              </div>
              <span className="text-white/60 text-[10px]">{fmt(activeTrack.likes + (liked.has(activeTrack.id) ? 1 : 0))}</span>
            </button>

            {/* Comments */}
            <button onClick={() => setShowComments(!showComments)} className="flex flex-col items-center gap-1">
              <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-white/60 text-[10px]">{activeTrack.comments}</span>
            </button>

            {/* Remix — PRIMARY action */}
            <Link href={`/studio?remix=${activeTrack.id}&prompt=${encodeURIComponent(activeTrack.title)}&genre=${activeTrack.genre}&mood=${activeTrack.mood}`}>
              <button className="flex flex-col items-center gap-1">
                <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20">
                  <RotateCcw className="w-5 h-5 text-white" />
                </div>
                <span className="text-white/60 text-[10px]">{activeTrack.remixes}</span>
              </button>
            </Link>

            {/* Share */}
            <button
              onClick={async () => {
                if (navigator.share) await navigator.share({ title: activeTrack.title, url: window.location.origin }).catch(() => {});
                else await navigator.clipboard.writeText(window.location.origin);
              }}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <Share2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-white/60 text-[10px]">Share</span>
            </button>

            {/* Creator avatar */}
            <Link href={`/profile?user=${activeTrack.creator}`}>
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-white/20 to-white/5 border-2 border-white/30 flex items-center justify-center">
                <span className="text-white font-bold text-sm">{activeTrack.creator[0].toUpperCase()}</span>
              </div>
            </Link>
          </div>

          {/* Navigation hints */}
          <div className="absolute top-4 left-0 right-0 flex items-center justify-center gap-1.5 z-10">
            {tracks.map((_, i) => (
              <button key={i} onClick={() => setActiveIndex(i)}
                className={`h-0.5 rounded-full transition-all cursor-pointer ${i === activeIndex ? "w-6 bg-white" : "w-3 bg-white/30"}`}
              />
            ))}
          </div>

          {/* Keyboard nav */}
          <div className="absolute top-1/2 left-2 z-10">
            <button onClick={goPrev} disabled={activeIndex === 0}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/40 hover:text-white disabled:opacity-0 cursor-pointer transition-all">
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
          </div>
          <div className="absolute top-1/2 right-16 z-10">
            <button onClick={goNext} disabled={activeIndex === tracks.length - 1}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/40 hover:text-white disabled:opacity-0 cursor-pointer transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ═══ RIGHT SIDEBAR — Lyrics + Comments ═══ */}
      <div className="hidden lg:flex w-[320px] xl:w-[360px] flex-col bg-white border-l border-[#F0F0F0]">
        {/* Tabs */}
        <div className="flex border-b border-[#F0F0F0]">
          <button onClick={() => setShowComments(false)}
            className={`flex-1 py-3 text-xs font-semibold text-center transition-colors ${!showComments ? "text-[#111] border-b-2 border-[#111]" : "text-[#999]"}`}>
            Lyrics
          </button>
          <button onClick={() => setShowComments(true)}
            className={`flex-1 py-3 text-xs font-semibold text-center transition-colors ${showComments ? "text-[#111] border-b-2 border-[#111]" : "text-[#999]"}`}>
            Comments ({activeTrack.comments})
          </button>
        </div>

        {!showComments ? (
          /* Lyrics panel */
          <div className="flex-1 overflow-y-auto p-5">
            <div className="mb-4">
              <p className="text-sm font-bold text-[#111]">{activeTrack.title}</p>
              <p className="text-xs text-[#999]">@{activeTrack.creator} · {activeTrack.genre}</p>
            </div>
            <div className="space-y-1.5 text-sm text-[#555] leading-relaxed">
              <p className="text-[10px] text-[#BBB] uppercase tracking-wider font-semibold">[Verse]</p>
              <p>A melody for you tonight</p>
              <p>Every note is burning bright</p>
              <p>Words I never said out loud</p>
              <p>Singing them above the crowd</p>
              <p className="h-3" />
              <p className="text-[10px] text-[#BBB] uppercase tracking-wider font-semibold">[Chorus]</p>
              <p>This is your dhun, your melody</p>
              <p>A song that speaks what words can&apos;t say</p>
              <p>From my heart to yours today</p>
              <p>Every rhythm, every rhyme</p>
              <p>Crafted just for you this time</p>
            </div>
            {/* Stats */}
            <div className="mt-6 pt-4 border-t border-[#F0F0F0] grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-sm font-bold text-[#111]">{activeTrack.plays}</p>
                <p className="text-[10px] text-[#999]">Plays</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-[#111]">{fmt(activeTrack.likes)}</p>
                <p className="text-[10px] text-[#999]">Likes</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-[#111]">{activeTrack.remixes}</p>
                <p className="text-[10px] text-[#999]">Remixes</p>
              </div>
            </div>
          </div>
        ) : (
          /* Timestamp comments */
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-3">
              {timestampComments.map((c, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-[10px] font-mono text-[#BBB] bg-[#F5F5F5] px-1.5 py-0.5 rounded mt-0.5 shrink-0">{c.time}</span>
                  <div>
                    <span className="text-xs font-semibold text-[#111]">@{c.user}</span>
                    <p className="text-xs text-[#555] mt-0.5">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Comment input */}
            <div className="sticky bottom-0 p-3 bg-white border-t border-[#F0F0F0]">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 rounded-lg bg-[#F5F5F5] text-xs text-[#111] placeholder:text-[#CCC] focus:outline-none"
                />
                <button className="px-3 py-2 rounded-lg bg-[#111] text-white text-xs font-semibold cursor-pointer hover:bg-[#333] transition-colors">
                  Post
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Remix CTA at bottom */}
        <div className="p-3 border-t border-[#F0F0F0]">
          <Link href={`/studio?remix=${activeTrack.id}&prompt=${encodeURIComponent(activeTrack.title)}&genre=${activeTrack.genre}&mood=${activeTrack.mood}`}>
            <button className="w-full py-3 rounded-xl bg-[#111] text-white text-sm font-semibold cursor-pointer hover:bg-[#333] transition-colors flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4" /> Remix this track
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
