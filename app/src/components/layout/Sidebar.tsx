"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Music, Mic2, Library, Globe, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";

const navItems = [
  { href: "/create", label: "Create", icon: Music },
  { href: "/studio", label: "Studio", icon: Mic2, pro: true },
  { href: "/library", label: "Library", icon: Library },
  { href: "/community", label: "Community", icon: Globe },
];

export function Sidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const [pinned, setPinned] = useState(false);

  // Hover expand/collapse (only when not pinned)
  const handleMouseEnter = () => { if (!pinned) setExpanded(true); };
  const handleMouseLeave = () => { if (!pinned) setExpanded(false); };

  const togglePin = () => {
    setPinned(!pinned);
    setExpanded(!pinned);
  };

  // Remember pin state
  useEffect(() => {
    const saved = localStorage.getItem("dhun-sidebar-pinned");
    if (saved === "true") { setPinned(true); setExpanded(true); }
  }, []);

  useEffect(() => {
    localStorage.setItem("dhun-sidebar-pinned", String(pinned));
  }, [pinned]);

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`hidden lg:flex flex-col h-screen fixed left-0 top-0 z-40 bg-white border-r border-[#F0F0F0] transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${
        expanded ? "w-[200px]" : "w-[60px]"
      }`}
    >
      {/* Logo + pin toggle */}
      <div className={`h-14 flex items-center shrink-0 ${expanded ? "px-4 justify-between" : "justify-center"}`}>
        {expanded ? (
          <>
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#111] flex items-center justify-center">
                <span className="text-white font-bold text-xs">D</span>
              </div>
              <span className="text-sm font-bold text-[#111]">dhun</span>
            </Link>
            <button
              onClick={togglePin}
              className="w-6 h-6 rounded-md flex items-center justify-center text-[#BBB] hover:text-[#111] hover:bg-[#F5F5F5] transition-colors cursor-pointer"
              title={pinned ? "Unpin sidebar" : "Pin sidebar"}
            >
              {pinned ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </>
        ) : (
          <Link href="/" className="w-7 h-7 rounded-lg bg-[#111] flex items-center justify-center">
            <span className="text-white font-bold text-xs">D</span>
          </Link>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-2 px-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`group flex items-center gap-3 rounded-xl transition-all duration-200 h-10 ${
                  expanded ? "px-3" : "justify-center"
                } ${
                  isActive
                    ? "bg-[#F5F5F5] text-[#111]"
                    : "text-[#999] hover:text-[#111] hover:bg-[#FAFAFA]"
                }`}
              >
                <item.icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? "text-[#111]" : ""}`} />
                {expanded && (
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className={`text-[13px] truncate ${isActive ? "font-semibold" : "font-medium"}`}>
                      {item.label}
                    </span>
                    {item.pro && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#111] text-white font-bold uppercase tracking-wider">
                        Pro
                      </span>
                    )}
                  </div>
                )}
                {!expanded && item.pro && (
                  <div className="absolute left-[46px] w-1.5 h-1.5 rounded-full bg-[#111]" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom — profile hint */}
      <div className="py-3 px-2 border-t border-[#F0F0F0]">
        <Link href="/profile">
          <div
            className={`flex items-center gap-3 rounded-xl h-10 transition-all duration-200 hover:bg-[#FAFAFA] cursor-pointer ${
              expanded ? "px-3" : "justify-center"
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center shrink-0">
              <span className="text-white text-[10px] font-bold">A</span>
            </div>
            {expanded && (
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[#111] truncate">Ansh</p>
                <p className="text-[10px] text-[#BBB]">Free plan</p>
              </div>
            )}
          </div>
        </Link>
      </div>
    </aside>
  );
}
