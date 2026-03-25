"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/stores/useStore";
import { Navbar } from "@/components/layout/Navbar";
import { StepWho } from "@/components/dedication/StepWho";
import { StepMessage } from "@/components/dedication/StepMessage";
import { StepStyle } from "@/components/dedication/StepStyle";
import { StepGenerate } from "@/components/dedication/StepGenerate";
import { OutputScreen } from "@/components/generation/OutputScreen";

const steps = ["Who", "Message", "Style", "Generate"];

export default function DedicatePage() {
  const step = useStore((s) => s.step);
  const generationStatus = useStore((s) => s.generationStatus);

  const showOutput = generationStatus !== "idle" && generationStatus !== "failed";

  return (
    <div className="min-h-screen bg-bg relative overflow-hidden">
      <Navbar />

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-neon-purple/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-hot-pink/5 blur-[100px]" />
      </div>

      <div className="relative pt-28 pb-20 px-6">
        <div className="max-w-2xl mx-auto">
          {/* Progress indicator */}
          {!showOutput && step < 3 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-2 mb-12"
            >
              {steps.slice(0, 3).map((label, i) => (
                <div key={label} className="flex items-center gap-2">
                  <motion.div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                      i <= step
                        ? "bg-gradient-to-r from-neon-purple to-hot-pink text-white"
                        : "bg-surface border border-border text-text-muted"
                    }`}
                    animate={i === step ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    {i + 1}
                  </motion.div>
                  {i < 2 && (
                    <div
                      className={`w-12 h-[2px] rounded-full transition-colors ${
                        i < step ? "bg-neon-purple" : "bg-border"
                      }`}
                    />
                  )}
                </div>
              ))}
            </motion.div>
          )}

          {/* Step content */}
          <AnimatePresence mode="wait">
            {step === 0 && (
              <StepTransition key="who">
                <StepWho />
              </StepTransition>
            )}
            {step === 1 && (
              <StepTransition key="message">
                <StepMessage />
              </StepTransition>
            )}
            {step === 2 && (
              <StepTransition key="style">
                <StepStyle />
              </StepTransition>
            )}
            {step >= 3 && !showOutput && (
              <StepTransition key="generate">
                <StepGenerate />
              </StepTransition>
            )}
            {showOutput && (
              <StepTransition key="output">
                <OutputScreen />
              </StepTransition>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function StepTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
