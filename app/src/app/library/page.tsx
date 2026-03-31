"use client";

import { useStore } from "@/stores/useStore";
import { usePlayerStore } from "@/stores/playerStore";
import { Play, Pause, Heart, Share2, Lock, Music, Plus } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

const grads = [
  "from-rose-400 to-violet-500",
  "from-amber-400 to-rose-500",
  "from-violet-400 to-indigo-500",
  "from-emerald-400 to-teal-500",
  "from-pink-400 to-red-500",
];

export default function LibraryPage() {
  const generations = useStore((s) => s.generations);
  const player = usePlayerStore();

  // Group by person
  const grouped = useMemo(() => {
    const groups: Record<string, typeof generations> = {};
    generations.forEach((gen) => {
      const name = gen.input.recipientName;
      if (!groups[name]) groups[name] = [];
      groups[name].push(gen);
    });
    return groups;
  }, [generations]);

  const personNames = Object.keys(grouped);
  const mostRecent = generations[0];

  // Drafts = not paid
  const drafts = generations.filter((g) => !g.isPaid);

  const playTrack = (trackId: string, audioUrl: string, title: string, genre: string, mood: string, gradient: string) => {
    if (player.currentTrack?.id === trackId && player.isPlaying) { player.pause(); return; }
    if (player.currentTrack?.id === trackId) { player.resume(); return; }
    player.play({ id: trackId, title, artist: "Dhun AI", audioUrl, genre, mood, gradient });
  };

  if (generations.length === 0) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-3xl bg-white border border-[#EAEAEA] flex items-center justify-center mx-auto mb-5">
            <Music className="w-8 h-8 text-[#DDD]" />
          </div>
          <h2 className="text-lg font-bold text-[#111] mb-1.5">No songs yet</h2>
          <p className="text-sm text-[#999] mb-6">Create your first dedication and it&apos;ll show up here</p>
          <Link href="/create">
            <button className="px-6 py-3 rounded-xl bg-[#111] text-white text-sm font-semibold cursor-pointer hover:bg-[#333] transition-colors flex items-center gap-2 mx-auto">
              <Plus className="w-4 h-4" /> Create your first Dhun
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8 pb-24">
      {/* ═══ 1. HERO — Most Recent ═══ */}
      {mostRecent && (
        <div className="bg-white rounded-2xl border border-[#EAEAEA] overflow-hidden">
          <div className="flex flex-col sm:flex-row">
            {/* Poster */}
            <div className={`sm:w-48 aspect-square sm:aspect-auto bg-gradient-to-br ${grads[0]} relative flex items-center justify-center shrink-0`}>
              <div className="absolute inset-0 banner-overlay opacity-20" />
              {mostRecent.tracks[0]?.audioUrl && (
                <button
                  onClick={() => playTrack(mostRecent.tracks[0].id, mostRecent.tracks[0].audioUrl!, `For ${mostRecent.input.recipientName}`, mostRecent.input.genre, mostRecent.input.mood, grads[0])}
                  className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors relative z-10"
                >
                  {player.currentTrack?.id === mostRecent.tracks[0].id && player.isPlaying ? (
                    <Pause className="w-7 h-7 text-white" />
                  ) : (
                    <Play className="w-7 h-7 text-white ml-1" />
                  )}
                </button>
              )}
            </div>
            {/* Info */}
            <div className="flex-1 p-5">
              <p className="text-[10px] font-semibold text-[#999] uppercase tracking-wider mb-1">Most Recent</p>
              <h3 className="text-lg font-bold text-[#111]">For {mostRecent.input.recipientName}</h3>
              <p className="text-sm text-[#999] capitalize mt-0.5">
                {mostRecent.input.occasion} · {mostRecent.input.mood} · {mostRecent.input.genre}
              </p>
              <div className="flex items-center gap-2 mt-4">
                {mostRecent.tracks[0]?.audioUrl && (
                  <button
                    onClick={() => playTrack(mostRecent.tracks[0].id, mostRecent.tracks[0].audioUrl!, `For ${mostRecent.input.recipientName}`, mostRecent.input.genre, mostRecent.input.mood, grads[0])}
                    className="px-4 py-2 rounded-lg bg-[#111] text-white text-xs font-semibold cursor-pointer hover:bg-[#333] transition-colors flex items-center gap-1.5"
                  >
                    <Play className="w-3 h-3" /> Play
                  </button>
                )}
                <button className="px-4 py-2 rounded-lg bg-[#FAFAFA] border border-[#EAEAEA] text-[#666] text-xs font-semibold cursor-pointer hover:border-[#CCC] transition-colors flex items-center gap-1.5">
                  <Share2 className="w-3 h-3" /> Share
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ 2. GROUPED BY PERSON ═══ */}
      {personNames.map((name) => {
        const gens = grouped[name];
        const nameHash = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
        const emojis = ["💛", "🙏", "🌙", "💕", "✨", "🔥", "🎵"];
        const emoji = emojis[nameHash % emojis.length];

        return (
          <div key={name}>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-bold text-[#111]">For {name}</h3>
              <span>{emoji}</span>
              <span className="text-[11px] text-[#CCC]">{gens.length} song{gens.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {gens.map((gen, gi) => (
                gen.tracks.filter((t) => t.status === "completed").map((track, ti) => {
                  const grad = grads[(gi + ti) % grads.length];
                  const isThisPlaying = player.currentTrack?.id === track.id && player.isPlaying;
                  return (
                    <div
                      key={track.id}
                      className="shrink-0 w-[160px] cursor-pointer group"
                      onClick={() => track.audioUrl && playTrack(track.id, track.audioUrl, `For ${name}`, gen.input.genre, gen.input.mood, grad)}
                    >
                      <div className={`w-full aspect-square rounded-2xl bg-gradient-to-br ${grad} relative flex items-center justify-center overflow-hidden group-hover:shadow-lg transition-shadow`}>
                        <div className="absolute inset-0 banner-overlay opacity-20" />
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity relative z-10">
                          {isThisPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
                        </div>
                        {!gen.isPaid && (
                          <div className="absolute top-2 right-2 z-10">
                            <Lock className="w-3 h-3 text-white/60" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-[#111] mt-2 truncate">Track {ti + 1}</p>
                      <p className="text-[10px] text-[#999] capitalize">{gen.input.mood} · {gen.input.genre}</p>
                    </div>
                  );
                })
              ))}
            </div>
          </div>
        );
      })}

      {/* ═══ 3. DRAFTS / LOCKED ═══ */}
      {drafts.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-[#111] mb-3">Drafts & Locked</h3>
          <div className="bg-white rounded-2xl border border-[#EAEAEA] divide-y divide-[#F5F5F5]">
            {drafts.map((gen, i) => (
              <div key={gen.id} className="flex items-center gap-4 px-4 py-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${grads[i % grads.length]} flex items-center justify-center shrink-0 opacity-50`}>
                  <Lock className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#111] truncate opacity-60">For {gen.input.recipientName}</p>
                  <p className="text-[11px] text-[#999] capitalize">{gen.input.occasion} · {gen.input.mood}</p>
                </div>
                <button className="px-3 py-1.5 rounded-lg border border-[#EAEAEA] text-[10px] font-semibold text-[#888] hover:border-[#111] hover:text-[#111] transition-colors cursor-pointer flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Unlock
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
