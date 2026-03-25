"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { Heart, Music, Share2, Sparkles } from "lucide-react";

const features = [
  {
    icon: Heart,
    title: "Dedicate",
    description: "Pick who it's for, the mood, and what you want to say.",
    color: "#EC4899",
  },
  {
    icon: Sparkles,
    title: "Generate",
    description: "AI creates 3 unique tracks, a poster, and lyrics — in under a minute.",
    color: "#A855F7",
  },
  {
    icon: Music,
    title: "Preview",
    description: "Listen to all 3. Pick your favorite. Fall in love with it.",
    color: "#3B82F6",
  },
  {
    icon: Share2,
    title: "Share",
    description: "Send a beautiful dedication link. They hear the song. They feel the love.",
    color: "#84CC16",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.3 },
  },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-bg relative overflow-hidden">
      <Navbar />

      {/* Background ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-neon-purple/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-hot-pink/5 blur-[120px]" />
      </div>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 sm:pt-44 sm:pb-32">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Pill */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-acid-green animate-pulse" />
              <span className="text-sm text-text-secondary">Your feelings, their song</span>
            </motion.div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05] font-[family-name:var(--font-display)]">
              <span className="text-text">Make a</span>
              <br />
              <span className="gradient-text">song</span>
              <span className="text-text"> for someone</span>
              <br />
              <span className="text-text">you </span>
              <span className="gradient-text">love</span>
            </h1>

            {/* Subhead */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 text-lg sm:text-xl text-text-secondary max-w-xl mx-auto leading-relaxed"
            >
              AI-generated songs. Personalized lyrics. Beautiful dedications.
              <br className="hidden sm:block" />
              Ready in under a minute.
            </motion.p>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/dedicate">
                <Button size="xl" className="min-w-[240px]">
                  <Heart className="w-5 h-5" />
                  Dedicate a Dhun
                </Button>
              </Link>
              <span className="text-text-muted text-sm">First one&apos;s free</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold text-center mb-16 font-[family-name:var(--font-display)]"
          >
            How it works
          </motion.h2>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                variants={item}
                className="group relative rounded-3xl bg-bg-card border border-border p-8 hover:border-border-hover transition-colors"
              >
                {/* Step number */}
                <div className="absolute top-4 right-4 text-text-muted/30 text-6xl font-bold font-[family-name:var(--font-display)]">
                  {i + 1}
                </div>

                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: `${feature.color}15` }}
                >
                  <feature.icon className="w-6 h-6" style={{ color: feature.color }} />
                </div>

                <h3 className="text-xl font-semibold mb-3 font-[family-name:var(--font-display)]">
                  {feature.title}
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Occasions Strip */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold mb-6 font-[family-name:var(--font-display)]"
          >
            For every feeling
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-text-secondary mb-12"
          >
            Birthdays. Anniversaries. Apologies. Or just because.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-3"
          >
            {[
              "Birthday 🎂", "Anniversary 💍", "I Love You ❤️", "I'm Sorry 🥺",
              "Thank You 🙏", "Friendship 🤝", "Farewell 👋", "Just Because ✨",
              "Proposal 💎", "New Baby 👶", "Graduation 🎓", "Miss You 💭",
            ].map((tag) => (
              <motion.div
                key={tag}
                whileHover={{ scale: 1.05, y: -2 }}
                className="px-5 py-3 rounded-full bg-white/5 border border-white/10 text-sm text-text-secondary hover:text-text hover:border-white/20 transition-colors cursor-default"
              >
                {tag}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-[32px] glass p-12 sm:p-16 relative overflow-hidden"
          >
            {/* Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/10 to-hot-pink/10 pointer-events-none" />

            <h2 className="relative text-3xl sm:text-5xl font-bold mb-6 font-[family-name:var(--font-display)]">
              Say it with a <span className="gradient-text">Dhun</span>
            </h2>
            <p className="relative text-text-secondary mb-10 text-lg">
              Words fade. Songs stay. Make one now.
            </p>
            <Link href="/dedicate" className="relative">
              <Button size="xl">
                <Sparkles className="w-5 h-5" />
                Create your Dhun
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-neon-purple to-hot-pink flex items-center justify-center">
              <span className="text-white font-bold text-[10px]">D</span>
            </div>
            <span className="text-sm text-text-muted">dhun</span>
          </div>
          <p className="text-text-muted text-xs">
            Made with feeling. Powered by AI.
          </p>
        </div>
      </footer>
    </div>
  );
}
