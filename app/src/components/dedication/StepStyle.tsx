"use client";

import { motion } from "framer-motion";
import { useStore } from "@/stores/useStore";
import { Button } from "@/components/ui/Button";
import { GENRES, LANGUAGES } from "@/types";
import type { VoiceType } from "@/types";
import { ArrowLeft, ArrowRight } from "lucide-react";

const voices: { value: VoiceType; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "duet", label: "Duet" },
];

export function StepStyle() {
  const { dedication, setGenre, setLanguage, setVoice, setStep } = useStore();

  return (
    <div className="space-y-10">
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-medium font-[family-name:var(--font-display)]">
          Choose the vibe
        </h1>
        <p className="text-text-secondary mt-3 text-sm">
          Pick a genre, language, and voice
        </p>
      </div>

      {/* Genre */}
      <div className="space-y-2">
        <label className="text-xs text-text-muted uppercase tracking-wider">Genre</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {GENRES.map((genre) => (
            <motion.button
              key={genre.value}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setGenre(genre.value)}
              className={`px-4 py-3.5 rounded-xl text-sm transition-all cursor-pointer ${
                dedication.genre === genre.value
                  ? "bg-accent text-black"
                  : "bg-surface text-text-secondary hover:text-text shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_2px_8px_rgba(0,0,0,0.2)]"
              }`}
            >
              {genre.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="space-y-2">
        <label className="text-xs text-text-muted uppercase tracking-wider">Language</label>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((lang) => (
            <motion.button
              key={lang.value}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setLanguage(lang.value)}
              className={`px-5 py-2.5 rounded-full text-sm transition-all cursor-pointer ${
                dedication.language === lang.value
                  ? "bg-accent/15 text-accent"
                  : "bg-surface text-text-secondary hover:text-text shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_2px_8px_rgba(0,0,0,0.2)]"
              }`}
            >
              {lang.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Voice */}
      <div className="space-y-2">
        <label className="text-xs text-text-muted uppercase tracking-wider">Voice</label>
        <div className="flex gap-2.5">
          {voices.map((v) => (
            <motion.button
              key={v.value}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setVoice(v.value)}
              className={`flex-1 px-4 py-3.5 rounded-xl text-sm transition-all cursor-pointer ${
                dedication.voice === v.value
                  ? "bg-accent/15 text-accent"
                  : "bg-surface text-text-secondary hover:text-text shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_2px_8px_rgba(0,0,0,0.2)]"
              }`}
            >
              {v.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="pt-4 flex gap-3">
        <Button variant="outline" size="lg" onClick={() => setStep(1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Button size="lg" fullWidth onClick={() => setStep(3)}>
          Continue
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
