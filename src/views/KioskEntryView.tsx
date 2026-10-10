"use client";

import { QrScanner } from "@/components/QrScanner";
import { Printer, Shield, Clock } from "lucide-react";
import { KioskOtpInput } from "@/components/KioskOtpInput";

interface KioskEntryViewProps {
  onSubmitCode: (code: string) => void;
  isLoading?: boolean;
  errorMessage?: string | null;
  onClearError?: () => void;
}

export function KioskEntryView({
  onSubmitCode,
  isLoading = false,
  errorMessage = null,
  onClearError,
}: KioskEntryViewProps) {
  return (
    <div className="max-w-xl mx-auto px-4 py-8 sm:py-12 space-y-8 text-center">
      {/* Kiosk Hero */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
          <Printer className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Operator Counter Station</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-normal text-zinc-900 dark:text-white tracking-tight font-instrument-serif">
          Enter Customer Access Code
        </h1>

        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 max-w-md mx-auto font-sans leading-relaxed">
          Type the 6-digit OTP dictated by the customer or scan their QR code to stream verified documents directly into the print buffer.
        </p>
      </div>

      {/* Code Input Card */}
      <div className="rounded-3xl border border-emerald-500/30 bg-white/95 dark:bg-[#121214]/95 p-5 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-colors">
        <KioskOtpInput
          onSubmit={onSubmitCode}
          isLoading={isLoading}
          errorMessage={errorMessage}
          onClearError={onClearError}
        />
      </div>

      <QrScanner onCode={onSubmitCode} disabled={isLoading} />

      {/* Operator Guidelines Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
        <div className="p-4 rounded-2xl border border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-[#121214]/80 backdrop-blur-md flex items-start gap-3 transition-colors shadow-2xs dark:shadow-none">
          <Shield className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-0.5">
            <span className="font-bold text-zinc-900 dark:text-white block font-sans">Zero Hard Drive Clutter</span>
            <span className="text-zinc-500 dark:text-zinc-400 text-[11px] font-sans">
              Documents stream into native print buffers. No files saved to your PC’s Downloads folder.
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-[#121214]/80 backdrop-blur-md flex items-start gap-3 transition-colors shadow-2xs dark:shadow-none">
          <Clock className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-0.5">
            <span className="font-bold text-zinc-900 dark:text-white block font-sans">Pre-Locked Preferences</span>
            <span className="text-zinc-500 dark:text-zinc-400 text-[11px] font-sans">
              Copies, color mode, and page ranges are selected by the customer on their phone.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
