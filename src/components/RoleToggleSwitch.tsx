"use client";

import Link from "next/link";
import { ArrowUpRight, Printer } from "lucide-react";

interface RoleToggleSwitchProps {
  activeRole: "upload" | "kiosk";
  className?: string;
  size?: "sm" | "md";
}

export function RoleToggleSwitch({
  activeRole,
  className = "",
  size = "md",
}: RoleToggleSwitchProps) {
  const isUpload = activeRole === "upload";
  const isKiosk = activeRole === "kiosk";

  const paddingClass =
    size === "sm"
      ? "px-2.5 sm:px-3 py-1 text-xs"
      : "px-3 sm:px-3.5 py-1.5 text-xs sm:text-sm";

  return (
    <div
      role="tablist"
      aria-label="Switch between sending files and print shop"
      className={`inline-flex items-center p-1 rounded-2xl bg-zinc-100/90 dark:bg-white/10 border border-zinc-200/80 dark:border-white/10 backdrop-blur-md shadow-2xs select-none touch-manipulation transition-colors ${className}`}
    >
      {/* 1. Send files tab */}
      {isUpload ? (
        <div
          role="tab"
          aria-selected="true"
          className={`inline-flex items-center gap-1.5 rounded-xl bg-white dark:bg-[#18181b] text-zinc-900 dark:text-white font-semibold shadow-xs border border-zinc-200/70 dark:border-white/10 font-heading cursor-default transition-all ${paddingClass}`}
        >
          <span>Send files</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-zinc-900 dark:text-white shrink-0" />
        </div>
      ) : (
        <Link
          href="/"
          role="tab"
          aria-selected="false"
          className={`inline-flex items-center gap-1.5 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white font-medium transition-colors font-heading group ${paddingClass}`}
        >
          <span>Send files</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-950 dark:group-hover:text-white transition-colors shrink-0" />
        </Link>
      )}

      {/* 2. Print shop tab */}
      {isKiosk ? (
        <div
          role="tab"
          aria-selected="true"
          className={`inline-flex items-center gap-1.5 rounded-xl bg-white dark:bg-[#18181b] text-zinc-900 dark:text-white font-semibold shadow-xs border border-zinc-200/70 dark:border-white/10 font-heading cursor-default transition-all ${paddingClass}`}
        >
          <Printer className="w-4 h-4 text-zinc-900 dark:text-white shrink-0" />
          <span>Print shop</span>
        </div>
      ) : (
        <Link
          href="/kiosk"
          role="tab"
          aria-selected="false"
          className={`inline-flex items-center gap-1.5 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white font-medium transition-colors font-heading group ${paddingClass}`}
        >
          <Printer className="w-4 h-4 text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-950 dark:group-hover:text-white transition-colors shrink-0" />
          <span>Print shop</span>
        </Link>
      )}
    </div>
  );
}
