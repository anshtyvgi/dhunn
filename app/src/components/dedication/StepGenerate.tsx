"use client";

import { motion } from "framer-motion";
import { useStore } from "@/stores/useStore";
import { Button } from "@/components/ui/Button";
import { COIN_COSTS, OCCASIONS, MOODS, GENRES, LANGUAGES } from "@/types";
import { ArrowLeft, Sparkles, Coins } from "lucide-react";

export function StepGenerate() {
  const { dedication, coins, isFirstTime, deductCoins, setStep, setGenerationStatus, setCurrentGeneration } = useStore();

  const cost = isFirstTime ? 0 : COIN_COSTS.generate;
  const canAfford = isFirstTime || coins >= cost;

  const occasionLabel = OCCASIONS.find((o) => o.value === dedication.occasion)?.label;
  const moodLabel = MOODS.find((m) => m.value === dedication.mood)?.label;
  const genreLabel = GENRES.find((g) => g.value === dedication.genre)?.label;
  const languageLabel = LANGUAGES.find((l) => l.value === dedication.language)?.label;

  const handleGenerate = async () => {
    if (!canAfford) return;

    // Deduct coins (unless first time)
    if (!isFirstTime) {
      const success = deductCoins(cost);
      if (!success) return;
    }

    // Set generation status
    setGenerationStatus("generating-prompt");

    // Create a mock generation for now (will connect to real API)
    const generation = {
      id: crypto.randomUUID(),
      input: dedication,
      status: "generating-prompt" as const,
      tracks: [
        { id: "t1", status: "pending" as const },
        { id: "t2", status: "pending" as const },
        { id: "t3", status: "pending" as const },
      ],
      createdAt: new Date().toISOString(),
      isPaid: false,
      isShared: false,
    };

    setCurrentGeneration(generation);

    // Simulate progressive generation
    setTimeout(() => setGenerationStatus("generating-poster"), 2000);
    setTimeout(() => setGenerationStatus("generating-tracks"), 4000);
    setTimeout(() => {
      setGenerationStatus("partial");
      setCurrentGeneration({
        ...generation,
        status: "partial",
        posterUrl: "/mock-poster.jpg",
        tracks: [
          { id: "t1", status: "completed", audioUrl: "/mock-track.mp3" },
          { id: "t2", status: "processing" },
          { id: "t3", status: "pending" },
        ],
      });
    }, 6000);
    setTimeout(() => {
      setGenerationStatus("completed");
      setCurrentGeneration({
        ...generation,
        status: "completed",
        posterUrl: "/mock-poster.jpg",
        lyrics: "Tere bina ye dil maane na\nHar pal tujhe hi dhundhe\nTu hai meri dhun...",
        tracks: [
          { id: "t1", status: "completed", audioUrl: "/mock-track.mp3", duration: 60 },
          { id: "t2", status: "completed", audioUrl: "/mock-track.mp3", duration: 60 },
          { id: "t3", status: "completed", audioUrl: "/mock-track.mp3", duration: 60 },
        ],
      });
    }, 10000);
  };

  return (
    <div className="space-y-10">
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold font-[family-name:var(--font-display)]">
          Ready to create?
        </h1>
        <p className="text-text-secondary mt-3">
          Review your dedication before we make it real
        </p>
      </div>

      {/* Summary card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-bg-card border border-border p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <span className="text-text-muted text-sm">For</span>
          <span className="text-text font-semibold">{dedication.recipientName}</span>
        </div>
        <div className="h-px bg-border" />
        <div className="flex items-center justify-between">
          <span className="text-text-muted text-sm">Occasion</span>
          <span className="text-text-secondary">{occasionLabel}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text-muted text-sm">Mood</span>
          <span className="text-text-secondary">{moodLabel}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text-muted text-sm">Genre</span>
          <span className="text-text-secondary">{genreLabel}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text-muted text-sm">Language</span>
          <span className="text-text-secondary">{languageLabel}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text-muted text-sm">Voice</span>
          <span className="text-text-secondary capitalize">{dedication.voice}</span>
        </div>
        {dedication.message && (
          <>
            <div className="h-px bg-border" />
            <div>
              <span className="text-text-muted text-sm block mb-2">Message</span>
              <p className="text-text-secondary text-sm leading-relaxed italic">
                &quot;{dedication.message}&quot;
              </p>
            </div>
          </>
        )}
      </motion.div>

      {/* Cost */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl bg-surface border border-border p-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
            <Coins className="w-5 h-5 text-black" />
          </div>
          <div>
            <p className="text-sm font-medium text-text">
              {isFirstTime ? "Your first Dhun is free!" : `${cost} coins`}
            </p>
            <p className="text-xs text-text-muted">
              {isFirstTime
                ? "No coins needed for your first creation"
                : `Balance: ${coins} coins`}
            </p>
          </div>
        </div>
        {isFirstTime && (
          <span className="text-xs px-3 py-1 rounded-full bg-acid-green/10 text-acid-green font-medium">
            FREE
          </span>
        )}
      </motion.div>

      {/* Actions */}
      <div className="pt-4 flex gap-3">
        <Button variant="outline" size="lg" onClick={() => setStep(2)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Button
          size="lg"
          fullWidth
          disabled={!canAfford}
          onClick={handleGenerate}
        >
          <Sparkles className="w-5 h-5" />
          {isFirstTime ? "Create my Dhun" : `Create for ${cost} coins`}
        </Button>
      </div>

      {!canAfford && (
        <p className="text-center text-hot-pink text-sm">
          Not enough coins. <a href="/coins" className="underline">Buy more</a>
        </p>
      )}
    </div>
  );
}
