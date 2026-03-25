"use client";

import { motion } from "framer-motion";
import { useStore } from "@/stores/useStore";
import { Button } from "@/components/ui/Button";
import { MOODS } from "@/types";
import { ArrowRight, ArrowLeft, Shuffle } from "lucide-react";

const prompts = [
  "You make my world better just by being in it...",
  "Remember that time we couldn't stop laughing...",
  "I never got to tell you how much you mean to me...",
  "Every moment with you feels like a song...",
  "You're the reason I believe in magic...",
  "Thank you for always being there...",
];

export function StepMessage() {
  const { dedication, setMessage, setMood, setStep } = useStore();

  const randomizePrompt = () => {
    const random = prompts[Math.floor(Math.random() * prompts.length)];
    setMessage(random);
  };

  return (
    <div className="space-y-10">
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-medium font-[family-name:var(--font-display)]">
          What do you want to say?
        </h1>
        <p className="text-text-secondary mt-3 text-sm">
          Pour your heart out — or keep it short and sweet
        </p>
      </div>

      {/* Message */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-text-muted uppercase tracking-wider">Your message</label>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={randomizePrompt}
            className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition-colors cursor-pointer"
          >
            <Shuffle className="w-3 h-3" />
            Inspire me
          </motion.button>
        </div>
        <textarea
          value={dedication.message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell them something real..."
          rows={4}
          className="w-full px-5 py-4 rounded-2xl bg-surface text-text text-base placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all resize-none leading-relaxed shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_2px_12px_rgba(0,0,0,0.3)]"
        />
        <p className="text-text-muted text-xs text-right">
          {dedication.message.length > 0
            ? `${dedication.message.length} characters`
            : "Optional but makes it personal"}
        </p>
      </div>

      {/* Mood */}
      <div className="space-y-2">
        <label className="text-xs text-text-muted uppercase tracking-wider">Set the mood</label>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((mood) => (
            <motion.button
              key={mood.value}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMood(mood.value)}
              className={`px-5 py-2.5 rounded-full text-sm transition-all cursor-pointer ${
                dedication.mood === mood.value
                  ? "bg-accent/15 text-accent"
                  : "bg-surface text-text-secondary hover:text-text shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_2px_8px_rgba(0,0,0,0.2)]"
              }`}
            >
              {mood.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="pt-4 flex gap-3">
        <Button variant="outline" size="lg" onClick={() => setStep(0)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Button size="lg" fullWidth onClick={() => setStep(2)}>
          Continue
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
