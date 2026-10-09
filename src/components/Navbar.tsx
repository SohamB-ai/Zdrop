"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Monitor,
  UploadCloud,
  Github,
  Menu,
  X,
  ArrowRight,
} from "lucide-react";
import { useLenis } from "lenis/react";
import { ZDropLogo } from "./ZDropLogo";

interface NavbarProps {
  currentRole?: "student" | "kiosk";
}

export function Navbar({ currentRole = "student" }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const lenis = useLenis();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith("#") && href !== "") return;
    e.preventDefault();
    setMobileMenuOpen(false);

    if (href === "#" || href === "#top" || href === "") {
      if (lenis) {
        lenis.scrollTo(0, { duration: 1.2 });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      window.history.pushState(null, "", window.location.pathname);
      return;
    }

    const targetEl = document.querySelector(href);
    if (targetEl) {
      if (lenis) {
        lenis.scrollTo(targetEl as HTMLElement, { offset: -80, duration: 1.2 });
      } else {
        targetEl.scrollIntoView({ behavior: "smooth" });
      }
      window.history.pushState(null, "", href);
    }
  };

  return (
    <header className="fixed top-3 inset-x-0 z-50 px-4 sm:px-6 pointer-events-none">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 sm:px-5 py-2.5 rounded-full bg-[#09090b]/85 border border-white/10 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.7)] pointer-events-auto">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 select-none group transition-transform active:scale-95"
          aria-label="ZDrop Home"
        >
          <ZDropLogo size="sm" showText={true} />
        </Link>

        {/* Center: Section Links (Student view) */}
        {currentRole === "student" && (
          <nav aria-label="Page Sections" className="hidden md:flex items-center gap-1 rounded-full bg-white/5 px-2 py-1 border border-white/10 backdrop-blur">
            <a
              href="#why-zdrop"
              onClick={(e) => handleNavClick(e, "#why-zdrop")}
              className="px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white rounded-full hover:bg-white/5 transition-colors font-sans cursor-pointer"
            >
              Why ZDrop
            </a>
            <a
              href="#how-it-works"
              onClick={(e) => handleNavClick(e, "#how-it-works")}
              className="px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white rounded-full hover:bg-white/5 transition-colors font-sans cursor-pointer"
            >
              How It Works
            </a>
            <a
              href="#faq"
              onClick={(e) => handleNavClick(e, "#faq")}
              className="px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white rounded-full hover:bg-white/5 transition-colors font-sans cursor-pointer"
            >
              FAQ
            </a>
            <a
              href="#upload"
              onClick={(e) => handleNavClick(e, "#upload")}
              className="px-3 py-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 rounded-full hover:bg-emerald-500/10 transition-colors font-sans cursor-pointer"
            >
              Drop Files
            </a>
          </nav>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {currentRole === "student" ? (
            <>
              <a
                href="https://github.com/SohamB-ai/Zdrop"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub Repository"
                className="hidden sm:inline-flex items-center justify-center w-8 h-8 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Github className="w-4 h-4" />
              </a>

              <Link
                href="/kiosk"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold font-sans transition-all active:scale-95 shadow-[0_0_16px_rgba(34,197,94,0.35)]"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Operator Kiosk</span>
                <ArrowRight className="w-3 h-3 hidden sm:inline" />
              </Link>
            </>
          ) : (
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold font-sans transition-all active:scale-95 shadow-[0_0_16px_rgba(34,197,94,0.35)]"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Back to Upload</span>
            </Link>
          )}

          {/* Mobile hamburger button */}
          {currentRole === "student" && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden inline-flex items-center justify-center w-8 h-8 rounded-full text-zinc-300 hover:text-white hover:bg-white/10 transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 max-w-5xl mx-auto p-4 rounded-2xl bg-[#09090b]/95 border border-white/10 backdrop-blur-2xl shadow-xl pointer-events-auto space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <a
            href="#upload"
            onClick={(e) => handleNavClick(e, "#upload")}
            className="block px-3 py-2 text-sm font-semibold text-emerald-400 rounded-lg hover:bg-white/5 cursor-pointer"
          >
            Drop Files & Print
          </a>
          <a
            href="#why-zdrop"
            onClick={(e) => handleNavClick(e, "#why-zdrop")}
            className="block px-3 py-2 text-sm font-medium text-zinc-300 rounded-lg hover:bg-white/5 cursor-pointer"
          >
            Why ZDrop
          </a>
          <a
            href="#how-it-works"
            onClick={(e) => handleNavClick(e, "#how-it-works")}
            className="block px-3 py-2 text-sm font-medium text-zinc-300 rounded-lg hover:bg-white/5 cursor-pointer"
          >
            How It Works
          </a>
          <a
            href="#faq"
            onClick={(e) => handleNavClick(e, "#faq")}
            className="block px-3 py-2 text-sm font-medium text-zinc-300 rounded-lg hover:bg-white/5 cursor-pointer"
          >
            FAQ
          </a>
          <Link
            href="/kiosk"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between px-3 py-2 text-sm font-medium text-zinc-300 rounded-lg hover:bg-white/5"
          >
            <span>Operator Kiosk Mode</span>
            <ArrowRight className="w-4 h-4 text-emerald-400" />
          </Link>
          <a
            href="https://github.com/SohamB-ai/Zdrop"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-400 rounded-lg hover:bg-white/5"
          >
            <Github className="w-4 h-4" />
            <span>GitHub Repository</span>
          </a>
        </div>
      )}
    </header>
  );
}
