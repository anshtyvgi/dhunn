"use client";

import { motion } from "framer-motion";
import { forwardRef } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
  fullWidth?: boolean;
}

const variants = {
  primary:
    "bg-accent text-black shadow-[0_2px_16px_rgba(74,222,128,0.2)]",
  secondary: "bg-surface text-text shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_2px_12px_rgba(0,0,0,0.3)]",
  ghost: "bg-transparent text-text-secondary hover:text-text hover:bg-white/5",
  outline:
    "bg-transparent border border-white/10 text-text hover:border-accent/40 hover:text-accent",
};

const sizes = {
  sm: "px-4 py-2 text-sm rounded-xl",
  md: "px-6 py-3 text-sm rounded-2xl",
  lg: "px-8 py-3.5 text-base rounded-2xl",
  xl: "px-10 py-4 text-base rounded-2xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", children, fullWidth, className = "", ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        className={`
          inline-flex items-center justify-center gap-2 font-medium
          transition-colors duration-200 cursor-pointer
          disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
          ${variants[variant]}
          ${sizes[size]}
          ${fullWidth ? "w-full" : ""}
          ${className}
        `}
        {...(props as React.ComponentProps<typeof motion.button>)}
      >
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
