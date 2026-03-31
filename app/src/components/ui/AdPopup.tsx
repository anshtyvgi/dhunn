"use client";

import { X, Volume2, VolumeX } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface AdPopupProps {
  onComplete: () => void;
  onClose: () => void;
}

/**
 * Rewarded ad popup — GAM (Google Ad Manager) integration point.
 *
 * In production, replace the mock ad with:
 * - googletag.cmd.push(() => googletag.defineSlot('/your-network/rewarded', ...))
 * - Or AdSense rewarded ad unit
 *
 * This mock simulates a 15-second rewarded video ad.
 */
export function AdPopup({ onComplete, onClose }: AdPopupProps) {
  const [secondsLeft, setSecondsLeft] = useState(15);
  const [muted, setMuted] = useState(false);
  const [canSkip, setCanSkip] = useState(false);

  const handleComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      handleComplete();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timer);
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, handleComplete]);

  // Allow skip after 5 seconds
  useEffect(() => {
    const skipTimer = setTimeout(() => setCanSkip(true), 5000);
    return () => clearTimeout(skipTimer);
  }, []);

  const progress = ((15 - secondsLeft) / 15) * 100;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center">
      {/* Ad container */}
      <div className="relative w-full max-w-lg mx-4">
        {/* Close / Skip */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
          <button
            onClick={() => setMuted(!muted)}
            className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          {canSkip ? (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <div className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white/40 text-[10px] font-medium">
              Skip in {5 - Math.min(15 - secondsLeft, 5)}s
            </div>
          )}
        </div>

        {/* Mock ad content — replace with GAM ad unit */}
        <div className="aspect-video bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl overflow-hidden relative">
          {/* Simulated ad creative */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4">
              <span className="text-2xl">🎵</span>
            </div>
            <p className="text-white/80 text-sm font-semibold mb-1">Sponsored</p>
            <p className="text-white/40 text-xs mb-6">Watch to unlock your track for free</p>

            {/* Mock brand ad */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 max-w-xs w-full">
              <p className="text-white/60 text-xs">Ad Placeholder — GAM Rewarded Unit</p>
              <p className="text-white/30 text-[10px] mt-1">
                Slot: /dhun/rewarded_unlock
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
            <div
              className="h-full bg-white/60 transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Timer label */}
        <div className="flex items-center justify-between mt-3 px-1">
          <p className="text-white/40 text-xs">
            {secondsLeft > 0 ? `${secondsLeft}s remaining` : "Ad complete!"}
          </p>
          <p className="text-white/20 text-[10px]">Powered by Google Ad Manager</p>
        </div>
      </div>
    </div>
  );
}
