"use client";

import { usePathname } from "next/navigation";
import { useStore } from "@/stores/useStore";
import { useClerk } from "@clerk/nextjs";
import { Coins, ChevronDown, User, Settings, LogOut, CreditCard } from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

const pageTitles: Record<string, string> = {
  "/create": "Create",
  "/studio": "Studio",
  "/library": "Library",
  "/community": "Community",
  "/coins": "Coins",
  "/settings": "Settings",
  "/profile": "Profile",
};

export function TopNav() {
  const pathname = usePathname();
  const coins = useStore((s) => s.coins);
  const { signOut } = useClerk();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const title = Object.entries(pageTitles).find(([path]) =>
    pathname === path || pathname.startsWith(path + "/")
  )?.[1] || "";

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="h-14 flex items-center justify-between px-5 bg-white/80 backdrop-blur-sm border-b border-[#F0F0F0] sticky top-0 z-30">
      {/* Left — Page title */}
      <h1 className="text-sm font-bold text-[#111]">{title}</h1>

      {/* Right — Coins + Profile */}
      <div className="flex items-center gap-3">
        {/* Coins */}
        <Link href="/coins" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[#F5F5F5] transition-colors">
          <div className="w-5 h-5 rounded-full token-coin flex items-center justify-center">
            <span className="text-[8px] font-bold text-white">$</span>
          </div>
          <span className="text-sm font-semibold text-[#111]">{coins}</span>
        </Link>

        {/* Profile */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 cursor-pointer hover:bg-[#F5F5F5] rounded-lg px-2 py-1.5 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">A</span>
            </div>
            <ChevronDown className={`w-3 h-3 text-[#999] transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-[calc(100vw-2rem)] sm:w-56 max-w-[224px] bg-white rounded-xl border border-[#EAEAEA] shadow-lg py-1 z-50">
              {/* Balance */}
              <div className="px-4 py-3 border-b border-[#F0F0F0]">
                <p className="text-[10px] text-[#999] uppercase tracking-wider font-semibold">Balance</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-bold text-[#111]">{coins}</span>
                  <span className="text-xs text-[#999]">coins</span>
                </div>
              </div>

              {/* Buy coins CTA */}
              <div className="px-3 py-2">
                <Link href="/coins" onClick={() => setDropdownOpen(false)}>
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#111] text-white text-xs font-semibold cursor-pointer hover:bg-[#333] transition-colors">
                    <CreditCard className="w-3.5 h-3.5" />
                    Buy Coins
                  </div>
                </Link>
              </div>

              <div className="h-px bg-[#F0F0F0] mx-3" />

              {/* Menu items */}
              {[
                { href: "/profile", icon: User, label: "Profile" },
                { href: "/settings", icon: Settings, label: "Settings" },
              ].map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setDropdownOpen(false)}>
                  <div className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#555] hover:bg-[#FAFAFA] hover:text-[#111] transition-colors cursor-pointer">
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </div>
                </Link>
              ))}

              <div className="h-px bg-[#F0F0F0] mx-3" />

              <button
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#999] hover:bg-[#FAFAFA] hover:text-red-500 transition-colors cursor-pointer"
                onClick={() => { setDropdownOpen(false); signOut({ redirectUrl: "/" }); }}
              >
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
