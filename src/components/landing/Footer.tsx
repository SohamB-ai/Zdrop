"use client";

import Link from "next/link";
import { ZDropLogo } from "@/components/ZDropLogo";
import { ShieldCheck, Github, ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative border-t border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-md text-zinc-600 dark:text-zinc-400 text-xs font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-block">
              <ZDropLogo size="md" showText={true} />
            </Link>
            <p className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed max-w-sm">
              The zero-trace document printing protocol. Drop files on your phone, hand a 6-digit PIN across the desk, and your documents vanish forever upon printing.
            </p>
            <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-950/20 flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300 text-xs max-w-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Zero retention: 15-minute server shredder TTL fail-safe.</span>
            </div>
          </div>

          {/* Column: Application */}
          <div className="space-y-3">
            <h4 className="text-zinc-900 dark:text-white font-bold text-xs uppercase tracking-wider font-heading">
              Terminal
            </h4>
            <ul className="space-y-2 font-medium">
              <li>
                <a href="#upload" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">
                  Drop & Upload Files
                </a>
              </li>
              <li>
                <Link href="/kiosk" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">
                  Operator Kiosk Mode
                </Link>
              </li>
              <li>
                <a href="#why-zdrop" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">
                  Why ZDrop
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">
                  How It Works
                </a>
              </li>
            </ul>
          </div>

          {/* Column: Security & Privacy */}
          <div className="space-y-3">
            <h4 className="text-zinc-900 dark:text-white font-bold text-xs uppercase tracking-wider font-heading">
              Privacy Specs
            </h4>
            <ul className="space-y-2 font-medium">
              <li>
                <a href="#why-zdrop" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">
                  No WhatsApp Downloads
                </a>
              </li>
              <li>
                <a href="#why-zdrop" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">
                  Zero USB Malware
                </a>
              </li>
              <li>
                <a href="#why-zdrop" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">
                  Dual-Trigger Purge
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">
                  Zero-Trace Guarantee
                </a>
              </li>
            </ul>
          </div>

          {/* Column: Open Source */}
          <div className="space-y-3">
            <h4 className="text-zinc-900 dark:text-white font-bold text-xs uppercase tracking-wider font-heading">
              Open Source
            </h4>
            <ul className="space-y-2 font-medium">
              <li>
                <a
                  href="https://github.com/SohamB-ai/Zdrop"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition inline-flex items-center gap-1.5"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>GitHub Repository</span>
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/SohamB-ai/Zdrop/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition inline-flex items-center gap-1"
                >
                  <span>Report an Issue</span>
                  <ExternalLink className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
                </a>
              </li>
              <li>
                <span className="text-zinc-500">MIT Open Source License</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-zinc-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500 font-mono">
          <div>
            © {new Date().getFullYear()} ZDrop. Zero-Trace Print Protocol.
          </div>
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <span>Built with precision for campus student privacy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
