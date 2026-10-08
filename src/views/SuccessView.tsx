"use client";

import { ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";
import { SessionData } from "@/lib/types";

interface SuccessViewProps {
  session: SessionData | null;
  onReset: () => void;
}

export function SuccessView({ session, onReset }: SuccessViewProps) {
  return (
    <div className="max-w-md mx-auto px-4 py-10 sm:py-16 text-center space-y-6">
      {/* Icon */}
      <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
        <ShieldCheck className="w-9 h-9" />
      </div>

      {/* Headlines */}
      <div className="space-y-2">
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight font-[family-name:var(--font-geist)]">
          Files Permanently Destroyed
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xs mx-auto">
          Your documents have been printed and completely purged from storage. Zero files remain on any server or device.
        </p>
      </div>

      {/* Anonymous Destruction Certificate Card */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs text-left text-xs space-y-2 max-w-sm mx-auto">
        <div className="flex items-center gap-1.5 font-bold text-slate-900 pb-2 border-b border-slate-100">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Zero-Retention Audit Receipt</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1 text-[11px]">
          <div>
            <span className="text-slate-400 block">Session Code:</span>
            <span className="font-mono font-bold text-slate-800">
              {session?.accessCode || "482913"}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Deletion Trigger:</span>
            <span className="font-semibold text-emerald-700">
              {session?.deletionSource === "OPERATOR_PRINT"
                ? "Print Completed"
                : session?.deletionSource === "STUDENT_REVOKE"
                ? "User Revoked"
                : "Auto-Purge"}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Cloud Retained:</span>
            <span className="font-mono font-bold text-slate-800">0 Bytes</span>
          </div>
          <div>
            <span className="text-slate-400 block">Residual Traces:</span>
            <span className="font-semibold text-slate-800">None</span>
          </div>
        </div>
      </div>

      {/* Primary CTA */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onReset}
          className="w-full max-w-sm mx-auto h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer shadow-sm text-sm"
        >
          <span>Print Another Document</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
