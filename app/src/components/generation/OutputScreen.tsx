"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/stores/useStore";
import { WaveformLoader } from "@/components/ui/WaveformLoader";
import { DiscPlayer } from "@/components/player/DiscPlayer";
import { Button } from "@/components/ui/Button";
import { COIN_COSTS } from "@/types";
import { Share2, Download, Heart, ThumbsDown, RotateCcw } from "lucide-react";

const statusMessages: Record<string, string> = {
  "generating-prompt": "Crafting the perfect words...",
  "generating-poster": "Designing your dedication poster...",
  "generating-tracks": "Composing 3 unique tracks...",
  partial: "Almost there...",
  completed: "Your Dhun is ready!",
  failed: "Something went wrong. Let's try again.",
};

export function OutputScreen() {
  const { generationStatus, currentGeneration, coins } = useStore();
  const isComplete = generationStatus === "completed";
  const isGenerating = !isComplete && generationStatus !== "failed";

  return (
    <div className="space-y-10 max-w-lg mx-auto">
      {/* Status header */}
      <div className="text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={generationStatus}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {isGenerating && (
              <div className="mb-6">
                <WaveformLoader size="lg" />
              </div>
            )}
            <h2 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-display)]">
              {isComplete && currentGeneration?.input.recipientName
                ? `For ${currentGeneration.input.recipientName}`
                : statusMessages[generationStatus] || "Creating..."}
            </h2>
            {isGenerating && (
              <p className="text-text-secondary mt-2 text-sm">
                {statusMessages[generationStatus]}
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Poster */}
      <AnimatePresence>
        {currentGeneration?.posterUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="rounded-3xl overflow-hidden aspect-square bg-gradient-to-br from-neon-purple/20 to-hot-pink/20 border border-border flex items-center justify-center"
          >
            {/* Placeholder poster — will use real image */}
            <div className="text-center p-8">
              <p className="text-4xl mb-4">🎵</p>
              <p className="text-xl font-bold font-[family-name:var(--font-display)] gradient-text">
                {currentGeneration.input.recipientName}
              </p>
              <p className="text-text-secondary text-sm mt-2">
                A Dhun, just for you
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tracks */}
      <div className="space-y-4">
        <AnimatePresence>
          {currentGeneration?.tracks.map((track, i) => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.3 }}
              className="rounded-2xl bg-bg-card border border-border p-6 flex items-center gap-6"
            >
              <DiscPlayer
                audioUrl={track.audioUrl}
                trackNumber={i + 1}
                isPaid={currentGeneration.isPaid}
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-text">
                  Track {i + 1}
                </p>
                <p className="text-text-muted text-sm capitalize">
                  {track.status === "completed"
                    ? `${currentGeneration.input.genre} · ${currentGeneration.input.mood}`
                    : track.status}
                </p>

                {/* Feedback buttons */}
                {track.status === "completed" && (
                  <div className="flex gap-2 mt-3">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center text-text-muted hover:text-acid-green hover:border-acid-green/30 transition-colors cursor-pointer"
                    >
                      <Heart className="w-3.5 h-3.5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center text-text-muted hover:text-hot-pink hover:border-hot-pink/30 transition-colors cursor-pointer"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                )}
              </div>

              {/* Loading state */}
              {track.status === "processing" && (
                <WaveformLoader bars={6} size="sm" />
              )}
              {track.status === "pending" && (
                <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-text-muted animate-pulse" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Lyrics */}
      {currentGeneration?.lyrics && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl bg-bg-card border border-border p-6"
        >
          <h3 className="text-sm font-medium text-text-secondary mb-3">Lyrics</h3>
          <p className="text-text text-sm leading-relaxed whitespace-pre-line">
            {currentGeneration.lyrics}
          </p>
        </motion.div>
      )}

      {/* Actions */}
      {isComplete && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          {/* Share */}
          <Button size="lg" fullWidth>
            <Share2 className="w-5 h-5" />
            Share Dhun · {COIN_COSTS.shareFull} coins
          </Button>

          {/* Download */}
          <Button variant="secondary" size="lg" fullWidth>
            <Download className="w-5 h-5" />
            Download · {COIN_COSTS.download} coins
          </Button>

          {/* Regenerate */}
          <Button variant="ghost" size="md" fullWidth>
            <RotateCcw className="w-4 h-4" />
            Regenerate · {COIN_COSTS.generate} coins
          </Button>

          <p className="text-center text-text-muted text-xs">
            Balance: {coins} coins
          </p>
        </motion.div>
      )}
    </div>
  );
}
