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
      ? `relative h-11 rounded-full px-3.5 flex items-center justify-center transition-all duration-200 select-none active:scale-95 cursor-pointer ${
          isHovered
            ? "bg-blue-500 dark:bg-cyan-400 text-white shadow-md dark:shadow-[0_0_20px_rgba(6,182,212,0.45)]"
            : "bg-blue-600 dark:bg-cyan-500 text-white shadow-sm dark:shadow-[0_0_14px_rgba(6,182,212,0.3)]"
        }`
      : `relative h-11 rounded-full px-3 flex items-center justify-center transition-all duration-200 select-none active:scale-95 cursor-pointer ${
          isHovered
            ? "bg-blue-50 dark:bg-white/10 text-blue-600 dark:text-cyan-300 shadow-xs"
            : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
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
    <header className="fixed top-3.5 sm:top-5 inset-x-0 z-50 flex justify-center pointer-events-none px-3 sm:px-4">
      {/* Floating Pill Bubble Navbar Container */}
      <motion.nav
        layout
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        aria-label="Primary Navigation"
        className="pointer-events-auto relative flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 rounded-full border border-slate-200/90 dark:border-white/12 bg-white/85 dark:bg-[#0B0F19]/85 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.1),0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_16px_50px_rgba(0,0,0,0.65),0_2px_14px_rgba(6,182,212,0.15)] transition-colors duration-200 max-w-[calc(100vw-1.5rem)] overflow-visible"
      >
        {/* Brand with Logo */}
        <Link
          href="/"
          className="flex items-center pl-1 sm:pl-2 pr-2 select-none group"
          aria-label="ZDrop Home"
        >
          <ZDropLogo size="md" />
        </Link>

        {/* Section Navigation Icons (Desktop) */}
        {currentRole === "student" && (
          <>
            <div className="h-6 w-px bg-slate-200 dark:bg-white/10 mx-1 hidden md:block" />
            <div className="hidden md:flex items-center gap-1">
              {sectionLinks.map(renderNavButton)}
            </div>
          </>
        )}

        {/* Action Controls Divider */}
        <div className="h-6 w-px bg-slate-200 dark:bg-white/10 mx-1" />

        {/* Action Controls Icons */}
        <div className="flex items-center gap-1">
          {currentRole === "student"
            ? actionLinks.map(renderNavButton)
            : kioskLinks.map(renderNavButton)}

          {/* Theme Toggle (With Smooth Hover Extension) */}
          <ThemeToggle
            isHovered={hoveredKey === "theme"}
            onHoverStart={() => setHoveredKey("theme")}
            onHoverEnd={() => setHoveredKey(null)}
          />
        </div>
      </motion.nav>
    </header>
  );
}
