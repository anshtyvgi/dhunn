"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useStore } from "@/stores/useStore";
import { COIN_PACKAGES, COIN_COSTS } from "@/types";
import { Coins, Check, Sparkles } from "lucide-react";

export default function CoinsPage() {
  const { coins, addCoins } = useStore();

  const handlePurchase = (pkg: (typeof COIN_PACKAGES)[number]) => {
    // In production: Razorpay integration
    // For now: mock purchase
    addCoins(pkg.coins);
  };

  return (
    <div className="min-h-screen bg-bg relative overflow-hidden">
      <Navbar />

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-yellow-500/5 blur-[120px]" />
      </div>

      <div className="relative pt-28 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mx-auto mb-6">
                <Coins className="w-8 h-8 text-black" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold font-[family-name:var(--font-display)]">
                Get Coins
              </h1>
              <p className="text-text-secondary mt-3">
                Your balance: <span className="text-text font-semibold">{coins} coins</span>
              </p>
            </motion.div>
          </div>

          {/* Packages */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
            {COIN_PACKAGES.map((pkg, i) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card
                  variant={pkg.popular || pkg.bestValue ? "glass" : "solid"}
                  className={`relative overflow-hidden ${
                    pkg.popular ? "border-neon-purple/30 glow-purple" : ""
                  } ${pkg.bestValue ? "border-acid-green/30" : ""}`}
                >
                  {/* Badge */}
                  {pkg.popular && (
                    <div className="absolute top-0 right-0 px-3 py-1 rounded-bl-xl bg-neon-purple text-white text-xs font-semibold">
                      Popular
                    </div>
                  )}
                  {pkg.bestValue && (
                    <div className="absolute top-0 right-0 px-3 py-1 rounded-bl-xl bg-acid-green text-black text-xs font-semibold">
                      Best Value
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold">{pkg.name}</h3>
                      <p className="text-3xl font-bold font-[family-name:var(--font-display)] mt-2">
                        {pkg.coins}
                        <span className="text-text-muted text-sm font-normal ml-2">coins</span>
                      </p>
                    </div>

                    <div className="text-text-secondary text-sm">
                      <span className="text-text font-semibold">₹{pkg.priceINR}</span>
                      <span className="text-text-muted"> · ₹{(pkg.priceINR / pkg.coins).toFixed(2)}/coin</span>
                    </div>

                    <Button
                      fullWidth
                      variant={pkg.popular || pkg.bestValue ? "primary" : "secondary"}
                      onClick={() => handlePurchase(pkg)}
                    >
                      Buy for ₹{pkg.priceINR}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* What coins buy */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="rounded-3xl bg-bg-card border border-border p-8"
          >
            <h3 className="text-lg font-semibold mb-6 font-[family-name:var(--font-display)]">
              What can you do with coins?
            </h3>
            <div className="space-y-4">
              {[
                { action: "Generate a Dhun (3 tracks)", cost: COIN_COSTS.generate },
                { action: "Share full dedication link", cost: COIN_COSTS.shareFull },
                { action: "Download HD audio", cost: COIN_COSTS.download },
                { action: "Full pack (share + download)", cost: COIN_COSTS.fullPack },
              ].map((item) => (
                <div key={item.action} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-acid-green" />
                    <span className="text-text-secondary text-sm">{item.action}</span>
                  </div>
                  <span className="text-text font-medium text-sm">{item.cost} coins</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
