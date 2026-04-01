"use client";

import { X, Play, Lock, Coins, Download, Share2, Package, Tv } from "lucide-react";
import { useStore } from "@/stores/useStore";
import { COIN_COSTS, MAX_AD_UNLOCKS_PER_DAY } from "@/types";
import { useState } from "react";
import { AdPopup } from "./AdPopup";

type UnlockAction = "unlock" | "share" | "download" | "fullPack";

interface UnlockModalProps {
  action: UnlockAction;
  trackTitle?: string;
  onUnlock: () => void;
  onClose: () => void;
}

const actionConfig: Record<UnlockAction, { title: string; description: string; icon: typeof Lock; cost: number }> = {
  unlock: {
    title: "Unlock Full Track",
    description: "Listen to the full song without limits",
    icon: Lock,
    cost: COIN_COSTS.shareFull, // Using share cost as single unlock
  },
  share: {
    title: "Share Dedication",
    description: "Send a beautiful link they'll never forget",
    icon: Share2,
    cost: COIN_COSTS.shareFull,
  },
  download: {
    title: "Download HD Audio",
    description: "Save the track in high quality to your device",
    icon: Download,
    cost: COIN_COSTS.download,
  },
  fullPack: {
    title: "Full Pack",
    description: "Unlock all tracks + share + download",
    icon: Package,
    cost: COIN_COSTS.fullPack,
  },
};

export function UnlockModal({ action, trackTitle, onUnlock, onClose }: UnlockModalProps) {
  const { coins, deductCoins } = useStore();
  const [showAd, setShowAd] = useState(false);
  const [adCompleted, setAdCompleted] = useState(false);
  const [adUnlocksLeft, setAdUnlocksLeft] = useState<number | null>(null);
  const [adLoading, setAdLoading] = useState(false);

  const config = actionConfig[action];
  const canAfford = coins >= config.cost;
  const canWatchAd = (adUnlocksLeft === null || adUnlocksLeft > 0) && (action === "unlock");

  // Fetch remaining ad unlocks from backend on mount
  useState(() => {
    fetch("/api/users/me")
      .then((res) => res.json())
      .then((data) => setAdUnlocksLeft(data.adUnlocksRemaining ?? 0))
      .catch(() => setAdUnlocksLeft(0));
  });

  const handleCoinUnlock = () => {
    const success = deductCoins(config.cost);
    if (success) onUnlock();
  };

  const handleAdComplete = async () => {
    setAdLoading(true);
    try {
      const res = await fetch("/api/ad-unlock", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setAdCompleted(true);
        setShowAd(false);
        setAdUnlocksLeft(data.remaining);
        onUnlock();
      }
    } catch {
      console.error("Ad unlock failed");
    } finally {
      setAdLoading(false);
    }
  };

  if (showAd) {
    return <AdPopup onComplete={handleAdComplete} onClose={() => setShowAd(false)} />;
  }

  return (
    <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0F0F0]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F5F5F5] flex items-center justify-center">
              <config.icon className="w-4.5 h-4.5 text-[#111]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111]">{config.title}</h3>
              {trackTitle && <p className="text-[10px] text-[#999]">{trackTitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#F5F5F5] flex items-center justify-center text-[#999] hover:text-[#111] transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          <p className="text-xs text-[#999]">{config.description}</p>

          {/* Option 1: Watch Ad (free) — only for single track unlock */}
          {canWatchAd && (
            <button
              onClick={() => setShowAd(true)}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-[#111] bg-[#FAFAFA] cursor-pointer hover:bg-[#F0F0F0] transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#111] flex items-center justify-center shrink-0 group-hover:bg-[#333] transition-colors">
                <Tv className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-[#111]">Watch Ad — Free</p>
                <p className="text-[10px] text-[#999]">
                  15 sec video · {adUnlocksLeft ?? "…"}/{MAX_AD_UNLOCKS_PER_DAY} remaining today
                </p>
              </div>
              <div className="px-2.5 py-1 rounded-full bg-[#111] text-white text-[10px] font-bold shrink-0">
                FREE
              </div>
            </button>
          )}

          {/* Exhausted ad unlocks message */}
          {!canWatchAd && action === "unlock" && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#FFF8E1] border border-[#FFC629]/20">
              <Tv className="w-4 h-4 text-[#E6A800] shrink-0" />
              <p className="text-xs text-[#666]">
                Ad unlocks used up for today ({MAX_AD_UNLOCKS_PER_DAY}/{MAX_AD_UNLOCKS_PER_DAY}). Use coins or come back tomorrow.
              </p>
            </div>
          )}

          {/* Option 2: Pay with coins */}
          <button
            onClick={handleCoinUnlock}
            disabled={!canAfford}
            className={`w-full flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
              canAfford
                ? "border-[#EAEAEA] hover:border-[#CCC] bg-white"
                : "border-[#EAEAEA] bg-[#FAFAFA] opacity-60 cursor-not-allowed"
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
              <Coins className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-[#111]">Pay {config.cost} Coins</p>
              <p className="text-[10px] text-[#999]">
                Balance: {coins} coins {!canAfford && "— not enough"}
              </p>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-[#F5F5F5] text-[#111] text-[10px] font-bold shrink-0">
              {config.cost} 🪙
            </div>
          </button>

          {/* Buy more coins link */}
          {!canAfford && (
            <a
              href="/coins"
              className="block text-center text-xs text-[#7B61FF] font-semibold hover:underline"
            >
              Buy more coins →
            </a>
          )}
        </div>

        {/* Footer — pricing breakdown */}
        <div className="px-5 py-3 bg-[#FAFAFA] border-t border-[#F0F0F0]">
          <p className="text-[10px] font-semibold text-[#BBB] uppercase tracking-wider mb-2">Pricing</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {[
              { label: "Unlock track", cost: COIN_COSTS.shareFull, icon: "🔓" },
              { label: "Share link", cost: COIN_COSTS.shareFull, icon: "🔗" },
              { label: "Download HD", cost: COIN_COSTS.download, icon: "⬇️" },
              { label: "Full pack", cost: COIN_COSTS.fullPack, icon: "📦" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-[11px] text-[#999]">
                  {item.icon} {item.label}
                </span>
                <span className="text-[11px] font-semibold text-[#111]">{item.cost}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-[#CCC] mt-2">
            Or watch an ad to unlock 1 track free (max {MAX_AD_UNLOCKS_PER_DAY}/day)
          </p>
        </div>
      </div>
    </div>
  );
}
