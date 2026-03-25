"use client";

import { motion } from "framer-motion";

interface WaveformLoaderProps {
  bars?: number;
  color?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: { height: 24, barWidth: 3, gap: 2 },
  md: { height: 40, barWidth: 4, gap: 3 },
  lg: { height: 64, barWidth: 5, gap: 4 },
};

export function WaveformLoader({ bars = 12, color = "#4ADE80", size = "md" }: WaveformLoaderProps) {
  const { height, barWidth, gap } = sizeMap[size];

  return (
    <div
      className="flex items-center justify-center"
      style={{ height, gap }}
    >
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          className="rounded-full"
          style={{
            width: barWidth,
            backgroundColor: color,
          }}
          animate={{
            height: [height * 0.2, height * 0.8, height * 0.2],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
