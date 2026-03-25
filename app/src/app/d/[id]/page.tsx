"use client";

import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { DiscPlayer } from "@/components/player/DiscPlayer";
import { Heart, Sparkles } from "lucide-react";
import Link from "next/link";

export default function DedicationPage() {
  const params = useParams();
  const id = params.id as string;

  // In production, fetch dedication data from API using `id`
  // For now, mock data
  const dedication = {
    recipientName: "Priya",
    occasion: "Love",
    mood: "Romantic",
    message: "You make my world better just by being in it...",
    posterUrl: null,
    audioUrl: "/mock-track.mp3",
    isPaid: false,
    creatorName: "Ansh",
  };

  return (
    <div className="min-h-screen bg-bg relative overflow-hidden flex flex-col">
      {/* Background ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[10%] left-[20%] w-[400px] h-[400px] rounded-full bg-neon-purple/8 blur-[100px]" />
        <div className="absolute bottom-[10%] right-[20%] w-[300px] h-[300px] rounded-full bg-hot-pink/8 blur-[100px]" />
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-md w-full text-center space-y-8"
        >
          {/* From label */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-text-secondary text-sm"
          >
            A Dhun from <span className="text-text font-medium">{dedication.creatorName}</span>
          </motion.p>

          {/* Poster / Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="rounded-3xl aspect-square bg-gradient-to-br from-neon-purple/20 to-hot-pink/20 border border-border flex items-center justify-center overflow-hidden mx-auto max-w-[320px]"
          >
            <div className="text-center p-8">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Heart className="w-12 h-12 text-hot-pink mx-auto mb-4" />
              </motion.div>
              <p className="text-3xl font-bold font-[family-name:var(--font-display)] gradient-text">
                {dedication.recipientName}
              </p>
              <p className="text-text-secondary text-sm mt-2">{dedication.occasion}</p>
            </div>
          </motion.div>

          {/* Message */}
          {dedication.message && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="rounded-2xl glass p-6"
            >
              <p className="text-text italic leading-relaxed">
                &quot;{dedication.message}&quot;
              </p>
            </motion.div>
          )}

          {/* Player */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            <DiscPlayer
              audioUrl={dedication.audioUrl}
              trackNumber={1}
              isPaid={dedication.isPaid}
            />
          </motion.div>

          {/* CTA - Viral loop */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2 }}
            className="pt-4 space-y-4"
          >
            <Link href="/dedicate">
              <Button size="lg" fullWidth>
                <Sparkles className="w-5 h-5" />
                Make a Dhun for someone you love
              </Button>
            </Link>

            <div className="flex items-center justify-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-neon-purple to-hot-pink flex items-center justify-center">
                <span className="text-white font-bold text-[8px]">D</span>
              </div>
              <span className="text-text-muted text-xs">dhun</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
