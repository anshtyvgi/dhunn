"use client";

import { motion } from "framer-motion";
import { Play, Pause } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { FREE_PREVIEW_SECONDS } from "@/types";

interface DiscPlayerProps {
  audioUrl?: string;
  posterUrl?: string;
  trackNumber: number;
  isPaid?: boolean;
  onPlayStateChange?: (playing: boolean) => void;
}

export function DiscPlayer({
  audioUrl,
  trackNumber,
  isPaid = false,
  onPlayStateChange,
}: DiscPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  const maxPlayTime = isPaid ? Infinity : FREE_PREVIEW_SECONDS;

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const togglePlay = () => {
    if (!audioUrl || !audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      if (intervalRef.current) clearInterval(intervalRef.current);
    } else {
      audioRef.current.play();
      intervalRef.current = setInterval(() => {
        if (!audioRef.current) return;
        const time = audioRef.current.currentTime;
        const duration = audioRef.current.duration || 1;
        setCurrentTime(time);
        setProgress((time / duration) * 100);

        if (!isPaid && time >= maxPlayTime) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          setIsPlaying(false);
          setProgress(0);
          setCurrentTime(0);
          if (intervalRef.current) clearInterval(intervalRef.current);
          onPlayStateChange?.(false);
        }
      }, 100);
    }

    setIsPlaying(!isPlaying);
    onPlayStateChange?.(!isPlaying);
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Disc */}
      <motion.div
        className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full cursor-pointer"
        onClick={togglePlay}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Outer glow */}
        {isPlaying && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(74,222,128,0.2) 0%, transparent 70%)",
            }}
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}

        {/* Disc body */}
        <motion.div
          className="absolute inset-0 rounded-full bg-bg-card overflow-hidden"
          style={{ boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset, 0 4px 24px rgba(0,0,0,0.4)" }}
          animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
          transition={isPlaying ? { duration: 8, repeat: Infinity, ease: "linear" } : { duration: 0.5 }}
        >
          {/* Grooves */}
          <div className="absolute inset-4 rounded-full border border-white/[0.03]" />
          <div className="absolute inset-8 rounded-full border border-white/[0.03]" />
          <div className="absolute inset-12 rounded-full border border-white/[0.03]" />

          {/* Center label */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
              <span className="text-black text-xs font-bold">#{trackNumber}</span>
            </div>
          </div>
        </motion.div>

        {/* Play/Pause overlay */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
              {audioUrl ? (
                <Play className="w-5 h-5 text-white ml-0.5" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Progress bar */}
      {audioUrl && (
        <div className="w-full max-w-[160px] space-y-1">
          <div className="w-full h-1 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-accent"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-text-muted">
            <span>{formatTime(currentTime)}</span>
            {!isPaid && <span className="text-accent">Free {FREE_PREVIEW_SECONDS}s</span>}
          </div>
        </div>
      )}

      {audioUrl && <audio ref={audioRef} src={audioUrl} preload="metadata" />}
    </div>
  );
}
