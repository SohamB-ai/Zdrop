"use client";

import { useState } from "react";
import { ArrowRight, ShieldCheck, Zap, Lock, Flame } from "lucide-react";
import { FileMetadata, PrintPreferences, PrintPreferencesSchema } from "@/lib/types";
import { DropZone } from "@/components/DropZone";
import { PrintPreferencesCard } from "@/components/PrintPreferencesCard";

interface HeroSectionProps {
  onGenerateCode: (files: FileMetadata[], preferences: PrintPreferences) => void;
  isGenerating?: boolean;
  uploadProgress?: number;
}

export function HeroSection({
  onGenerateCode,
  isGenerating = false,
  uploadProgress = 0,
}: HeroSectionProps) {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [preferences, setPreferences] = useState<PrintPreferences>({
    copies: 1,
    colorMode: "BW",
    sides: "DOUBLE",
    pageRange: "ALL",
  });

  const validation = PrintPreferencesSchema.safeParse(preferences);
  const canSubmit = files.length > 0 && validation.success;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onGenerateCode(files, preferences);
  };

  return (
    <section className="relative pt-6 pb-16 sm:pt-10 sm:pb-20 overflow-hidden" id="upload">
      {/* Background Ambient Emerald Radial Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-emerald-500/10 blur-[120px] pointer-events-none -z-10 rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: High-Impact Hero Summary */}
          <div className="lg:col-span-6 space-y-6 lg:pt-6">
            {/* Category Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero-Trace Campus Counter Printing</span>
            </div>

            {/* Headline with Instrument Serif */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-[1.08] font-normal font-instrument-serif">
              Drop it. Print it. Done.{" "}
              <span className="block text-emerald-400 italic font-instrument-serif font-normal mt-1">
                Zero WhatsApp. Zero USBs.
              </span>
            </h1>

            {/* Subhead (Crisp summary) */}
            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-xl font-sans">
              Drop your files on your phone, configure copies and double-sided specs in seconds, and hand a 6-digit PIN across the counter. The operator spools it directly, and your files vanish forever the instant printing completes.
            </p>

            {/* 3 Core Trust Pillars Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl border border-white/10 bg-[#121214]/80 backdrop-blur-md">
                <div className="flex items-center gap-1.5 text-emerald-400 mb-1">
                  <Lock className="w-4 h-4" />
                  <span className="text-xs font-bold font-sans">100% Anonymous</span>
                </div>
                <p className="text-[11px] text-zinc-400 font-sans">No phone numbers or accounts required.</p>
              </div>

              <div className="p-3.5 rounded-2xl border border-white/10 bg-[#121214]/80 backdrop-blur-md">
                <div className="flex items-center gap-1.5 text-emerald-400 mb-1">
                  <Flame className="w-4 h-4" />
                  <span className="text-xs font-bold font-sans">Dual-Trigger Purge</span>
                </div>
                <p className="text-[11px] text-zinc-400 font-sans">Instant wipe on print + 15-min fail-safe.</p>
              </div>

              <div className="p-3.5 rounded-2xl border border-white/10 bg-[#121214]/80 backdrop-blur-md">
                <div className="flex items-center gap-1.5 text-emerald-400 mb-1">
                  <Zap className="w-4 h-4" />
                  <span className="text-xs font-bold font-sans">Fast Counter Queue</span>
                </div>
                <p className="text-[11px] text-zinc-400 font-sans">No verbal misprints or awkward waiting.</p>
              </div>
            </div>

            {/* Quick Navigation Anchor Guide */}
            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-zinc-400">
              <span className="font-semibold text-zinc-300">Quick Guide:</span>
              <a href="#why-zdrop" className="hover:text-emerald-400 underline underline-offset-4 decoration-emerald-500/40 transition">
                Why ZDrop ↓
              </a>
              <a href="#how-it-works" className="hover:text-emerald-400 underline underline-offset-4 decoration-emerald-500/40 transition">
                How It Works ↓
              </a>
              <a href="#faq" className="hover:text-emerald-400 underline underline-offset-4 decoration-emerald-500/40 transition">
                FAQ ↓
              </a>
            </div>
          </div>

          {/* Right Column: Live, Interactive Drop & Preferences Widget */}
          <div className="lg:col-span-6">
            <div className="relative rounded-3xl border border-emerald-500/30 bg-[#121214]/95 p-5 sm:p-7 shadow-[0_8px_32px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-colors">
              {/* Card Header Strip */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-sans">
                    Interactive Print Terminal
                  </span>
                </div>
                <span className="text-[10px] font-mono font-medium text-zinc-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                  Max 3 Files · 25MB
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Step 1: Drop Files */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                      Step 1: Select Files
                    </label>
                    <span className="text-[11px] text-emerald-400 font-mono">PDF, DOCX, JPG, PNG</span>
                  </div>
                  <DropZone files={files} onFilesChange={setFiles} disabled={isGenerating} />
                </div>

                {/* Step 2: Preferences (Appears when file is added) */}
                {files.length > 0 && (
                  <div className="space-y-2 pt-1 animate-in fade-in duration-200">
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono block">
                      Step 2: Print Settings
                    </label>
                    <PrintPreferencesCard
                      preferences={preferences}
                      onChange={setPreferences}
                      disabled={isGenerating}
                    />
                  </div>
                )}

                {!validation.success && (
                  <p role="alert" className="text-xs text-rose-300 bg-rose-950/40 border border-rose-500/30 p-2.5 rounded-xl">
                    {validation.error.issues[0].message}
                  </p>
                )}

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={!canSubmit || isGenerating}
                    className="w-full h-13 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-400 hover:to-green-400 text-zinc-950 font-bold rounded-xl flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-30 disabled:pointer-events-none active:scale-[0.98] cursor-pointer shadow-[0_0_24px_rgba(34,197,94,0.35)] text-sm font-sans"
                  >
                    <span>
                      {isGenerating
                        ? `Encrypting & Uploading… ${uploadProgress}%`
                        : "Generate 6-Digit Access Code"}
                    </span>
                    <ArrowRight className="w-4 h-4 text-zinc-950" />
                  </button>

                  <p className="mt-3 text-[11px] text-zinc-400 text-center flex items-center justify-center gap-1.5 font-sans">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 inline" />
                    <span>Dual-Purge: Permanently deleted upon print or after 15 mins</span>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
