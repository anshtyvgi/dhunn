"use client";

import { Play, Pause, Heart, Search, ChevronRight, TrendingUp, Clock, Music } from "lucide-react";
import { usePlayerStore } from "@/stores/playerStore";
import { useState } from "react";
import Link from "next/link";

/**
 * Explore = discovery layer before entering Community reels.
 * Trending / New / Genre filters → click opens Community filtered.
 */

const trending = [
  { id: "t1", title: "Neon Dreams", creator: "ansh_creates", genre: "Lo-fi", plays: "157K", gradient: "from-indigo-500 to-violet-600", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: "t2", title: "Golden Hour", creator: "priya_music", genre: "Pop", plays: "301K", gradient: "from-amber-400 to-orange-500", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: "t3", title: "Midnight in Mumbai", creator: "raj_beats", genre: "Bollywood", plays: "92K", gradient: "from-rose-500 to-pink-600", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
  { id: "t4", title: "Static Pulse", creator: "neha_vibes", genre: "Electronic", plays: "189K", gradient: "from-cyan-500 to-blue-600", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
];

const newReleases = [
  { id: "n1", title: "Paper Planes", creator: "karan_dhun", genre: "Acoustic", plays: "12K", gradient: "from-emerald-500 to-teal-600", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: "n2", title: "Kundalini", creator: "simran_mel", genre: "Classical", plays: "8K", gradient: "from-purple-500 to-fuchsia-600", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
  { id: "n3", title: "Signal Fade", creator: "dev_music", genre: "Electronic", plays: "5K", gradient: "from-sky-500 to-blue-600", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: "n4", title: "Bittersweet", creator: "mak_muzical", genre: "R&B", plays: "3K", gradient: "from-rose-400 to-red-600", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
];

const genres = [
  { name: "Pop", gradient: "from-pink-400 to-rose-600", count: 312 },
  { name: "Bollywood", gradient: "from-amber-400 to-orange-600", count: 287 },
  { name: "Lo-fi", gradient: "from-indigo-400 to-violet-600", count: 198 },
  { name: "Acoustic", gradient: "from-emerald-400 to-teal-600", count: 156 },
  { name: "Classical", gradient: "from-amber-300 to-yellow-600", count: 89 },
  { name: "Hip-hop", gradient: "from-red-400 to-rose-600", count: 134 },
  { name: "Electronic", gradient: "from-cyan-400 to-blue-600", count: 167 },
  { name: "R&B", gradient: "from-violet-400 to-purple-600", count: 112 },
];

const topCreators = [
  { name: "priya_music", followers: "5.2K", tracks: 23, gradient: "from-violet-400 to-indigo-500" },
  { name: "ansh_creates", followers: "3.2K", tracks: 18, gradient: "from-rose-400 to-pink-500" },
  { name: "raj_beats", followers: "4.0K", tracks: 31, gradient: "from-amber-400 to-orange-500" },
  { name: "neha_vibes", followers: "3.8K", tracks: 15, gradient: "from-emerald-400 to-teal-500" },
  { name: "karan_dhun", followers: "5.9K", tracks: 27, gradient: "from-sky-400 to-blue-500" },
];

export default function ExplorePage() {
  const player = usePlayerStore();
  const [search, setSearch] = useState("");

  const play = (t: { id: string; title: string; creator: string; audioUrl: string; gradient: string; genre: string }) => {
    if (player.currentTrack?.id === t.id && player.isPlaying) { player.pause(); return; }
    if (player.currentTrack?.id === t.id) { player.resume(); return; }
    player.play({ id: t.id, title: t.title, artist: `@${t.creator}`, audioUrl: t.audioUrl, genre: t.genre, mood: "Chill", gradient: t.gradient });
  };

  const isPlaying = (id: string) => player.currentTrack?.id === id && player.isPlaying;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8 pb-24">
      {/* Search */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-[#EAEAEA]">
        <Search className="w-4 h-4 text-[#CCC]" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tracks, creators, or genres"
          className="flex-1 bg-transparent text-sm text-[#111] placeholder:text-[#CCC] focus:outline-none" />
      </div>

      {/* Quick filters → link to Community */}
      <div className="flex gap-2">
        <Link href="/community" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#111] text-white text-xs font-semibold cursor-pointer hover:bg-[#333] transition-colors">
          <TrendingUp className="w-3.5 h-3.5" /> Trending
        </Link>
        <Link href="/community" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#EAEAEA] text-[#666] text-xs font-semibold cursor-pointer hover:border-[#CCC] transition-colors">
          <Clock className="w-3.5 h-3.5" /> New
        </Link>
        <Link href="/community" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#EAEAEA] text-[#666] text-xs font-semibold cursor-pointer hover:border-[#CCC] transition-colors">
          <Music className="w-3.5 h-3.5" /> For You
        </Link>
      </div>

      {/* Trending */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-[#111]">Trending</p>
          <Link href="/community" className="text-xs text-[#999] font-semibold cursor-pointer hover:text-[#111] flex items-center gap-0.5">
            See all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {trending.map((s, i) => (
            <div key={s.id} onClick={() => play(s)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${player.currentTrack?.id === s.id ? "bg-white border border-[#111] shadow-sm" : "hover:bg-white border border-transparent"}`}>
              <span className="text-[11px] font-bold text-[#CCC] w-4">{i + 1}</span>
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${s.gradient} flex items-center justify-center shrink-0`}>
                {isPlaying(s.id) ? <Pause className="w-3.5 h-3.5 text-white" /> : <Play className="w-3.5 h-3.5 text-white ml-0.5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#111] truncate">{s.title}</p>
                <p className="text-[11px] text-[#999]">@{s.creator} · {s.genre}</p>
              </div>
              <span className="text-[11px] text-[#CCC] shrink-0">{s.plays}</span>
            </div>
          ))}
        </div>
      </div>

      {/* New Releases */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-[#111]">New Releases</p>
          <Link href="/community" className="text-xs text-[#999] font-semibold cursor-pointer hover:text-[#111] flex items-center gap-0.5">
            See all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {newReleases.map((s) => (
            <div key={s.id} onClick={() => play(s)} className="shrink-0 w-[160px] cursor-pointer group">
              <div className={`w-full aspect-square rounded-2xl bg-gradient-to-br ${s.gradient} relative flex items-center justify-center overflow-hidden group-hover:shadow-lg transition-shadow`}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {isPlaying(s.id) ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
                </div>
              </div>
              <p className="text-xs font-semibold text-[#111] mt-2 truncate">{s.title}</p>
              <p className="text-[10px] text-[#999]">@{s.creator}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Genres */}
      <div>
        <p className="text-sm font-bold text-[#111] mb-3">Genres</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {genres.map((g) => (
            <Link key={g.name} href="/community">
              <div className={`rounded-xl bg-gradient-to-br ${g.gradient} p-4 relative overflow-hidden cursor-pointer hover:shadow-lg transition-shadow h-20 flex items-end`}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="relative z-10">
                  <p className="text-white font-bold text-sm">{g.name}</p>
                  <p className="text-white/50 text-[10px]">{g.count} tracks</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Top Creators */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-[#111]">Top Creators</p>
          <button className="text-xs text-[#999] font-semibold cursor-pointer hover:text-[#111] flex items-center gap-0.5">
            See all <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="flex gap-5 overflow-x-auto pb-2">
          {topCreators.map((c) => (
            <Link key={c.name} href={`/profile?user=${c.name}`}>
              <div className="shrink-0 flex flex-col items-center gap-2 cursor-pointer group">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${c.gradient} flex items-center justify-center text-white text-lg font-bold group-hover:shadow-lg transition-shadow`}>
                  {c.name[0].toUpperCase()}
                </div>
                <p className="text-xs font-semibold text-[#111] truncate max-w-[80px]">@{c.name}</p>
                <p className="text-[10px] text-[#999]">{c.followers}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
