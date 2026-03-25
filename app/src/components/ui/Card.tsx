"use client";

import { motion } from "framer-motion";

interface CardProps {
  children: React.ReactNode;
  variant?: "solid" | "glass";
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, variant = "solid", className = "", hover = false, onClick }: CardProps) {
  const base =
    variant === "glass"
      ? "glass"
      : "card-elevated rounded-3xl";

  return (
    <motion.div
      whileHover={hover ? { scale: 1.01, y: -2 } : undefined}
      whileTap={onClick ? { scale: 0.99 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={onClick}
      className={`
        rounded-3xl p-6
        ${base}
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}
