"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldAlert,
  Sparkles,
  Workflow,
  CircleHelp,
  Monitor,
  UploadCloud,
  Github,
} from "lucide-react";
import { ZDropLogo } from "./ZDropLogo";
import { ThemeToggle } from "./ThemeToggle";

interface NavbarProps {
  currentRole?: "student" | "kiosk";
}

interface NavItemConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  isExternal?: boolean;
  highlight?: boolean;
}

export function Navbar({ currentRole = "student" }: NavbarProps) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const sectionLinks: NavItemConfig[] = [
    {
      id: "problem",
      label: "The Risk",
      icon: ShieldAlert,
      href: "#problem",
    },
    {
      id: "features",
      label: "Features",
      icon: Sparkles,
      href: "#features",
    },
    {
      id: "how-it-works",
      label: "How It Works",
      icon: Workflow,
      href: "#how-it-works",
    },
    {
      id: "faq",
      label: "FAQs",
      icon: CircleHelp,
      href: "#faq",
    },
  ];

  const actionLinks: NavItemConfig[] = [
    {
      id: "kiosk",
      label: "Operator Kiosk",
      icon: Monitor,
      href: "/kiosk",
    },
    {
      id: "upload",
      label: "Drop & Print",
      icon: UploadCloud,
      href: "#upload",
      highlight: true,
    },
    {
      id: "github",
      label: "GitHub",
      icon: Github,
      href: "https://github.com/SohamB-ai/Zdrop",
      isExternal: true,
    },
  ];

  const kioskLinks: NavItemConfig[] = [
    {
      id: "back-to-upload",
      label: "Back to Upload",
      icon: UploadCloud,
      href: "/",
      highlight: true,
    },
  ];

  const renderNavButton = (item: NavItemConfig) => {
    const isHovered = hoveredKey === item.id;
    const Icon = item.icon;

    const baseClass = item.highlight
      ? `relative h-11 sm:h-12 rounded-2xl px-4 flex items-center justify-center transition-all duration-200 select-none active:scale-95 cursor-pointer ${
          isHovered
            ? "bg-blue-500 dark:bg-cyan-400 text-white shadow-md dark:shadow-[0_0_20px_rgba(6,182,212,0.45)]"
            : "bg-blue-600 dark:bg-cyan-500 text-white shadow-sm dark:shadow-[0_0_14px_rgba(6,182,212,0.3)]"
        }`
      : `relative h-11 sm:h-12 rounded-2xl px-3.5 flex items-center justify-center transition-all duration-200 select-none active:scale-95 cursor-pointer ${
          isHovered
            ? "bg-blue-50 dark:bg-white/10 text-blue-600 dark:text-cyan-300 shadow-xs"
            : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-white/5"
        }`;

    const content = (
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 450, damping: 28 }}
        className="flex items-center"
      >
        <Icon className="w-5 h-5 shrink-0" />
        <AnimatePresence>
          {isHovered && (
            <motion.span
              layout
              initial={{ opacity: 0, width: 0, marginLeft: 0 }}
              animate={{ opacity: 1, width: "auto", marginLeft: 8 }}
              exit={{ opacity: 0, width: 0, marginLeft: 0 }}
              transition={{ type: "spring", stiffness: 450, damping: 28 }}
              className="text-xs sm:text-sm font-semibold tracking-wide whitespace-nowrap overflow-hidden"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    );

    if (item.isExternal) {
      return (
        <motion.a
          key={item.id}
          layout
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          onMouseEnter={() => setHoveredKey(item.id)}
          onMouseLeave={() => setHoveredKey(null)}
          onFocus={() => setHoveredKey(item.id)}
          onBlur={() => setHoveredKey(null)}
          aria-label={item.label}
          title={item.label}
          className={baseClass}
        >
          {content}
        </motion.a>
      );
    }

    if (item.href.startsWith("#")) {
      return (
        <motion.a
          key={item.id}
          layout
          href={item.href}
          onMouseEnter={() => setHoveredKey(item.id)}
          onMouseLeave={() => setHoveredKey(null)}
          onFocus={() => setHoveredKey(item.id)}
          onBlur={() => setHoveredKey(null)}
          aria-label={item.label}
          title={item.label}
          className={baseClass}
        >
          {content}
        </motion.a>
      );
    }

    return (
      <Link
        key={item.id}
        href={item.href}
        onMouseEnter={() => setHoveredKey(item.id)}
        onMouseLeave={() => setHoveredKey(null)}
        onFocus={() => setHoveredKey(item.id)}
        onBlur={() => setHoveredKey(null)}
        aria-label={item.label}
        title={item.label}
        className={baseClass}
      >
        {content}
      </Link>
    );
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 w-full border-b border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#070b14]/80 backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 sm:h-22 flex items-center justify-between gap-4">
        {/* Left: Brand Icon */}
        <div className="flex items-center shrink-0">
          <Link
            href="/"
            className="flex items-center p-2 rounded-2xl hover:bg-slate-100/60 dark:hover:bg-white/5 transition-all select-none group"
            aria-label="ZDrop Home"
          >
            <ZDropLogo size="md" showText={false} />
          </Link>
        </div>

        {/* Middle: Page Section Icons */}
        <nav
          aria-label="Page Sections"
          className="flex items-center justify-center flex-1 max-w-xl mx-auto"
        >
          {currentRole === "student" && (
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 overflow-x-auto no-scrollbar py-1">
              {sectionLinks.map(renderNavButton)}
            </div>
          )}
        </nav>

        {/* Right: Rest of Icons & Action Buttons */}
        <div className="flex items-center justify-end gap-2 sm:gap-3 shrink-0">
          {currentRole === "student"
            ? actionLinks.map(renderNavButton)
            : kioskLinks.map(renderNavButton)}

          <div className="h-6 w-px bg-slate-200/80 dark:bg-white/10 mx-1 shrink-0" />

          {/* Theme Toggle */}
          <ThemeToggle
            isHovered={hoveredKey === "theme"}
            onHoverStart={() => setHoveredKey("theme")}
            onHoverEnd={() => setHoveredKey(null)}
          />
        </div>
      </div>
    </header>
  );
}
