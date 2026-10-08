"use client";

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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
          <Printer className="w-3.5 h-3.5 text-blue-600" />
          <span>Xerox Counter Station</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-[family-name:var(--font-geist)]">
          Enter Customer Access Code
        </h1>

        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Type the 6-digit OTP provided by the customer to pull up documents and verified print settings.
        </p>
      </div>

      {/* Code Input Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <KioskOtpInput
          onSubmit={onSubmitCode}
          isLoading={isLoading}
          errorMessage={errorMessage}
          onClearError={onClearError}
        />
      </div>

      {/* Operator Guidelines Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs flex items-start gap-3">
          <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-slate-900 block">Zero Disk Clutter</span>
            <span className="text-slate-500 text-[11px]">
              Files never save to your local Downloads or Desktop folders.
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs flex items-start gap-3">
          <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-slate-900 block">Pre-Set Preferences</span>
            <span className="text-slate-500 text-[11px]">
              Customer selects copies, color, and duplex on their phone before ordering.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
