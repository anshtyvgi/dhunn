"use client";

import { motion } from "framer-motion";
import { useStore } from "@/stores/useStore";

interface CoinBadgeProps {
  className?: string;
}

export function CoinBadge({ className = "" }: CoinBadgeProps) {
  const coins = useStore((s) => s.coins);

  return (
    <motion.div
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 ${className}`}
      whileHover={{ scale: 1.05 }}
    >
      <div className="w-4 h-4 rounded-full bg-accent flex items-center justify-center">
        <span className="text-[8px] font-bold text-black">$</span>
      </div>
      <span className="font-medium text-text text-sm">{coins}</span>
    </motion.div>
  );
}
