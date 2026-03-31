"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Music, Mic2, Library, Globe } from "lucide-react";

const navItems = [
  { href: "/create", label: "Create", icon: Music },
  { href: "/studio", label: "Studio", icon: Mic2 },
  { href: "/library", label: "Library", icon: Library },
  { href: "/community", label: "Community", icon: Globe },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-[#F0F0F0]">
      <div className="flex items-center justify-around px-1 pb-[env(safe-area-inset-bottom)] h-14">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href} className="flex-1">
              <div className="flex flex-col items-center gap-0.5 py-1">
                <item.icon className={`w-5 h-5 transition-colors ${isActive ? "text-[#111]" : "text-[#CCC]"}`} />
                <span className={`text-[10px] transition-colors ${isActive ? "text-[#111] font-semibold" : "text-[#CCC]"}`}>
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
