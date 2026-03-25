"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useStore } from "@/stores/useStore";
import { Music, Plus } from "lucide-react";
import Link from "next/link";

export default function LibraryPage() {
  const generations = useStore((s) => s.generations);

  return (
    <div className="min-h-screen bg-bg relative overflow-hidden">
      <Navbar />

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-electric-blue/5 blur-[120px]" />
      </div>

      <div className="relative pt-28 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <div>
              <h1 className="text-3xl font-bold font-[family-name:var(--font-display)]">
                Your Library
              </h1>
              <p className="text-text-secondary mt-1 text-sm">
                All your Dhuns in one place
              </p>
            </div>
            <Link href="/dedicate">
              <Button size="sm">
                <Plus className="w-4 h-4" />
                New Dhun
              </Button>
            </Link>
          </div>

          {/* Content */}
          {generations.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="w-20 h-20 rounded-3xl bg-surface border border-border flex items-center justify-center mx-auto mb-6">
                <Music className="w-8 h-8 text-text-muted" />
              </div>
              <h2 className="text-xl font-semibold mb-2 font-[family-name:var(--font-display)]">
                No Dhuns yet
              </h2>
              <p className="text-text-secondary mb-8">
                Create your first dedication and it&apos;ll show up here
              </p>
              <Link href="/dedicate">
                <Button>Create your first Dhun</Button>
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {generations.map((gen, i) => (
                <motion.div
                  key={gen.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card hover className="flex items-center gap-4">
                    {/* Mini poster */}
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-purple/20 to-hot-pink/20 border border-border flex items-center justify-center shrink-0">
                      <span className="text-lg">🎵</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text truncate">
                        For {gen.input.recipientName}
                      </p>
                      <p className="text-text-muted text-sm capitalize">
                        {gen.input.occasion} · {gen.input.mood} · {gen.input.genre}
                      </p>
                    </div>

                    {/* Status */}
                    <div className="shrink-0">
                      {gen.isPaid ? (
                        <span className="text-xs px-3 py-1 rounded-full bg-acid-green/10 text-acid-green">
                          Unlocked
                        </span>
                      ) : (
                        <span className="text-xs px-3 py-1 rounded-full bg-surface text-text-muted border border-border">
                          Preview
                        </span>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
