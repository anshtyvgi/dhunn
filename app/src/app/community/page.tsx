"use client";

import { Heart, MessageCircle, Play, Pause, Share2, RotateCcw } from "lucide-react";
import { usePlayerStore } from "@/stores/playerStore";
import { useState } from "react";

const posts = [
  { id: "c1", user: "ansh", title: "Birthday song for Meera", occasion: "Birthday", genre: "Pop", gradient: "from-amber-300 to-rose-400", likes: 248, comments: 31, time: "2h", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: "c2", user: "priya", title: "25th Anniversary — Maa Papa", occasion: "Anniversary", genre: "Classical", gradient: "from-rose-400 to-violet-500", likes: 562, comments: 84, time: "5h", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: "c3", user: "raj", title: "Apology song — she forgave me", occasion: "Apology", genre: "Lo-fi", gradient: "from-sky-400 to-indigo-500", likes: 1420, comments: 213, time: "1d", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
  { id: "c4", user: "neha", title: "Farewell for my best friend", occasion: "Farewell", genre: "Acoustic", gradient: "from-emerald-400 to-teal-500", likes: 891, comments: 127, time: "2d", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: "c5", user: "karan", title: "Proposal song — she said YES!", occasion: "Love", genre: "Bollywood", gradient: "from-pink-400 to-red-500", likes: 3200, comments: 456, time: "3d", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: "c6", user: "simran", title: "Thank you Papa — Father's Day", occasion: "Thank You", genre: "Acoustic", gradient: "from-orange-400 to-amber-500", likes: 780, comments: 95, time: "4d", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
];

function fmt(n: number) { return n >= 1000 ? (n / 1000).toFixed(1) + "k" : n.toString(); }

type ViewMode = "feed" | "reels";

export default function CommunityPage() {
  const player = usePlayerStore();
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [activePost, setActivePost] = useState(posts[0]);
  const [viewMode, setViewMode] = useState<ViewMode>("feed");

  const toggleLike = (id: string) => {
    setLiked((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const playPost = (post: typeof posts[0]) => {
    if (player.currentTrack?.id === post.id && player.isPlaying) { player.pause(); return; }
    if (player.currentTrack?.id === post.id) { player.resume(); return; }
    player.play({ id: post.id, title: post.title, artist: `@${post.user}`, audioUrl: post.audioUrl, genre: post.genre, mood: post.occasion, gradient: post.gradient });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-[#999]">Discover what others are creating</p>
        {/* Mode toggle */}
        <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-[#F5F5F5]">
          <button
            onClick={() => setViewMode("feed")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${viewMode === "feed" ? "bg-white text-[#111] shadow-sm" : "text-[#999]"}`}
          >
            Feed
          </button>
          <button
            onClick={() => setViewMode("reels")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${viewMode === "reels" ? "bg-white text-[#111] shadow-sm" : "text-[#999]"}`}
          >
            Reels
          </button>
        </div>
      </div>

      {viewMode === "feed" ? (
        /* ═══ FEED MODE ═══ */
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* LEFT — Feed list */}
          <div className="lg:col-span-3 space-y-2">
            {posts.map((post) => {
              const isActive = activePost.id === post.id;
              const isThisPlaying = player.currentTrack?.id === post.id && player.isPlaying;
              return (
                <div
                  key={post.id}
                  onClick={() => { setActivePost(post); }}
                  className={`bg-white rounded-xl border overflow-hidden cursor-pointer transition-all ${
                    isActive ? "border-[#111] shadow-sm" : "border-[#EAEAEA] hover:border-[#CCC]"
                  }`}
                >
                  <div className="flex items-center gap-3.5 px-4 py-3">
                    {/* Poster */}
                    <div
                      className={`w-14 h-14 rounded-xl bg-gradient-to-br ${post.gradient} flex items-center justify-center shrink-0 relative`}
                      onClick={(e) => { e.stopPropagation(); playPost(post); }}
                    >
                      {isThisPlaying ? (
                        <Pause className="w-4 h-4 text-white" />
                      ) : (
                        <Play className="w-4 h-4 text-white ml-0.5" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-[#111]">@{post.user}</span>
                        <span className="text-[10px] text-[#CCC]">{post.time}</span>
                      </div>
                      <p className="text-sm font-semibold text-[#111] truncate">{post.title}</p>
                      <p className="text-[11px] text-[#999]">{post.occasion} · {post.genre}</p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleLike(post.id); }}
                        className="flex items-center gap-1 cursor-pointer"
                      >
                        <Heart className={`w-3.5 h-3.5 transition-colors ${liked.has(post.id) ? "text-red-500 fill-red-500" : "text-[#CCC]"}`} />
                        <span className="text-[11px] text-[#999]">{fmt(post.likes + (liked.has(post.id) ? 1 : 0))}</span>
                      </button>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5 text-[#CCC]" />
                        <span className="text-[11px] text-[#999]">{post.comments}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT — Sticky player */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-[72px]">
              <div className="bg-white rounded-2xl border border-[#EAEAEA] overflow-hidden">
                {/* Poster */}
                <div className={`aspect-square bg-gradient-to-br ${activePost.gradient} relative flex items-center justify-center`}>
                  <div className="absolute inset-0 banner-overlay opacity-30" />
                  <button
                    onClick={() => playPost(activePost)}
                    className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors relative z-10"
                  >
                    {player.currentTrack?.id === activePost.id && player.isPlaying ? (
                      <Pause className="w-7 h-7 text-white" />
                    ) : (
                      <Play className="w-7 h-7 text-white ml-1" />
                    )}
                  </button>
                  <div className="absolute bottom-3 left-3 z-10">
                    <p className="text-white font-bold text-sm">{activePost.title}</p>
                    <p className="text-white/60 text-xs">@{activePost.user}</p>
                  </div>
                </div>

                {/* Info + actions */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-[#666]">
                    <span>{activePost.occasion}</span>
                    <span className="w-1 h-1 rounded-full bg-[#DDD]" />
                    <span>{activePost.genre}</span>
                  </div>

                  {/* Progress */}
                  {player.currentTrack?.id === activePost.id && (
                    <div className="h-1 rounded-full bg-[#F0F0F0]">
                      <div className="h-full rounded-full bg-[#111] transition-all" style={{ width: `${player.progress}%` }} />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleLike(activePost.id)}
                      className={`flex-1 py-2 rounded-lg border text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-colors ${
                        liked.has(activePost.id)
                          ? "bg-red-50 border-red-200 text-red-500"
                          : "bg-[#FAFAFA] border-[#EAEAEA] text-[#666] hover:border-[#CCC]"
                      }`}
                    >
                      <Heart className={`w-3 h-3 ${liked.has(activePost.id) ? "fill-red-500" : ""}`} /> Like
                    </button>
                    <button className="flex-1 py-2 rounded-lg bg-[#FAFAFA] border border-[#EAEAEA] text-xs font-semibold text-[#666] hover:border-[#CCC] transition-colors cursor-pointer flex items-center justify-center gap-1.5">
                      <MessageCircle className="w-3 h-3" /> Comment
                    </button>
                    <button className="flex-1 py-2 rounded-lg bg-[#FAFAFA] border border-[#EAEAEA] text-xs font-semibold text-[#666] hover:border-[#CCC] transition-colors cursor-pointer flex items-center justify-center gap-1.5">
                      <RotateCcw className="w-3 h-3" /> Remix
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ═══ REELS MODE ═══ */
        <div className="max-w-sm mx-auto space-y-4">
          {posts.map((post) => {
            const isThisPlaying = player.currentTrack?.id === post.id && player.isPlaying;
            return (
              <div
                key={post.id}
                className="bg-white rounded-2xl border border-[#EAEAEA] overflow-hidden"
              >
                <div
                  className={`aspect-[9/16] max-h-[500px] bg-gradient-to-br ${post.gradient} relative flex items-center justify-center cursor-pointer`}
                  onClick={() => playPost(post)}
                >
                  <div className="absolute inset-0 banner-overlay opacity-30" />
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center relative z-10">
                    {isThisPlaying ? <Pause className="w-7 h-7 text-white" /> : <Play className="w-7 h-7 text-white ml-1" />}
                  </div>

                  {/* Bottom info */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                    <p className="text-white font-bold">{post.title}</p>
                    <p className="text-white/60 text-xs mt-0.5">@{post.user} · {post.genre}</p>
                  </div>

                  {/* Right actions */}
                  <div className="absolute right-3 bottom-20 flex flex-col items-center gap-4 z-10">
                    <button onClick={(e) => { e.stopPropagation(); toggleLike(post.id); }} className="flex flex-col items-center gap-0.5">
                      <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Heart className={`w-5 h-5 ${liked.has(post.id) ? "text-red-500 fill-red-500" : "text-white"}`} />
                      </div>
                      <span className="text-white text-[10px]">{fmt(post.likes)}</span>
                    </button>
                    <button onClick={(e) => e.stopPropagation()} className="flex flex-col items-center gap-0.5">
                      <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-white text-[10px]">{post.comments}</span>
                    </button>
                    <button onClick={(e) => e.stopPropagation()} className="flex flex-col items-center gap-0.5">
                      <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Share2 className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-white text-[10px]">Share</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
