"use client";

import { Play, Pause, Settings, Share2, Music, Users, BarChart3 } from "lucide-react";
import { usePlayerStore } from "@/stores/playerStore";
import { useStore } from "@/stores/useStore";
import Link from "next/link";

const creatorTracks = [
  { id: "ct1", title: "Neon Dreams", genre: "Lo-fi", mood: "Chill", plays: "157K", gradient: "from-indigo-500 to-violet-600", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: "ct2", title: "Golden Hour", genre: "Pop", mood: "Happy", plays: "301K", gradient: "from-amber-400 to-orange-500", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: "ct3", title: "Static Pulse", genre: "Electronic", mood: "Energetic", plays: "189K", gradient: "from-cyan-500 to-blue-600", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
  { id: "ct4", title: "Midnight Serenade", genre: "Bollywood", mood: "Romantic", plays: "92K", gradient: "from-rose-500 to-pink-600", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: "ct5", title: "Paper Planes", genre: "Acoustic", mood: "Bittersweet", plays: "68K", gradient: "from-emerald-500 to-teal-600", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: "ct6", title: "Signal Fade", genre: "Electronic", mood: "Chill", plays: "45K", gradient: "from-sky-500 to-blue-600", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
];

const stats = [
  { label: "Tracks", value: "23", icon: Music },
  { label: "Followers", value: "3.2K", icon: Users },
  { label: "Total Plays", value: "852K", icon: BarChart3 },
];

export default function ProfilePage() {
  const player = usePlayerStore();
  const coins = useStore((s) => s.coins);

  const play = (t: typeof creatorTracks[0]) => {
    if (player.currentTrack?.id === t.id && player.isPlaying) { player.pause(); return; }
    if (player.currentTrack?.id === t.id) { player.resume(); return; }
    player.play({ id: t.id, title: t.title, artist: "Ansh", audioUrl: t.audioUrl, genre: t.genre, mood: t.mood, gradient: t.gradient });
  };

  const isPlaying = (id: string) => player.currentTrack?.id === id && player.isPlaying;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 pb-24">
      {/* Profile header */}
      <div className="bg-white rounded-2xl border border-[#EAEAEA] overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-violet-500 via-indigo-500 to-sky-500 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
        <div className="px-5 pb-5 -mt-8 relative">
          <div className="flex items-end gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-400 to-indigo-500 border-4 border-white flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">A</span>
            </div>
            <div className="flex-1 pb-1">
              <h1 className="text-lg font-bold text-[#111]">Ansh</h1>
              <p className="text-xs text-[#999]">Lo-fi / Romantic creator</p>
            </div>
            <div className="flex items-center gap-2 pb-1">
              <Link href="/settings">
                <button className="w-8 h-8 rounded-lg border border-[#EAEAEA] flex items-center justify-center text-[#999] hover:text-[#111] hover:border-[#CCC] transition-colors cursor-pointer">
                  <Settings className="w-4 h-4" />
                </button>
              </Link>
              <button className="px-4 py-2 rounded-lg bg-[#111] text-white text-xs font-semibold cursor-pointer hover:bg-[#333] transition-colors flex items-center gap-1.5">
                <Share2 className="w-3 h-3" /> Share Profile
              </button>
            </div>
          </div>

          <div className="flex gap-6 mt-4">
            {stats.map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <s.icon className="w-3.5 h-3.5 text-[#999]" />
                <div>
                  <span className="text-sm font-bold text-[#111]">{s.value}</span>
                  <span className="text-[11px] text-[#999] ml-1">{s.label}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-[#FAFAFA] border border-[#EAEAEA] w-fit">
            <span>🪙</span>
            <span className="text-sm font-bold text-[#111]">{coins}</span>
            <span className="text-xs text-[#999]">coins</span>
            <Link href="/coins">
              <span className="text-xs text-[#7B61FF] font-semibold ml-2 cursor-pointer hover:underline">Buy more</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Track grid */}
      <div>
        <h2 className="text-sm font-bold text-[#111] mb-3">Tracks</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {creatorTracks.map((t) => (
            <div key={t.id} onClick={() => play(t)} className="cursor-pointer group">
              <div className={`aspect-square rounded-2xl bg-gradient-to-br ${t.gradient} relative flex items-center justify-center overflow-hidden group-hover:shadow-lg transition-shadow`}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {isPlaying(t.id) ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
                </div>
                <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1 text-white/60 text-[10px]">
                  <Play className="w-2.5 h-2.5" />{t.plays}
                </div>
              </div>
              <p className="text-xs font-semibold text-[#111] mt-2 truncate">{t.title}</p>
              <p className="text-[10px] text-[#999]">{t.genre} · {t.mood}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
