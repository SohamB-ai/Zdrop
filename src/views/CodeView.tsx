"use client";

import { useState } from "react";
import { ArrowLeft, FileText } from "lucide-react";
import { SessionData } from "@/lib/types";
import { OtpDisplayCard } from "@/components/OtpDisplayCard";
import { LiveStatusTracker } from "@/components/LiveStatusTracker";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { formatBytes } from "@/lib/utils";

interface CodeViewProps {
  session: SessionData;
  onRevokeSession: () => void;
  onBackToUpload: () => void;
  isRevoking?: boolean;
}

export function CodeView({
  session,
  onRevokeSession,
  onBackToUpload,
  isRevoking = false,
}: CodeViewProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  return (
    <div className="max-w-md mx-auto px-4 py-6 sm:py-8 space-y-5">
      {/* Back button and summary */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToUpload}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition active:scale-[0.98] cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Upload Another</span>
        </button>

        <span className="text-xs text-slate-500 font-medium">
          {session.files.length} file{session.files.length > 1 ? "s" : ""} ({formatBytes(session.totalSizeBytes)})
        </span>
      </div>

      {/* Main OTP Card */}
      <OtpDisplayCard
        accessCode={session.accessCode}
        expiresAt={session.expiresAt}
        onRevoke={() => setIsConfirmOpen(true)}
        isRevoking={isRevoking}
      />

      {/* Live Status Progression */}
      <LiveStatusTracker status={session.status} />

      {/* Preferences Summary Micro-Card */}
      <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs text-xs space-y-1.5">
        <div className="flex items-center gap-1.5 font-bold text-slate-800">
          <FileText className="w-3.5 h-3.5 text-blue-600" />
          <span>Selected Print Options</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1 text-[11px]">
          <div>• Copies: <span className="font-semibold text-slate-900">{session.preferences.copies}</span></div>
          <div>• Mode: <span className="font-semibold text-slate-900">{session.preferences.colorMode === "BW" ? "B&W" : "Color"}</span></div>
          <div>• Sides: <span className="font-semibold text-slate-900">{session.preferences.sides === "DOUBLE" ? "Double" : "Single"}</span></div>
          <div>• Pages: <span className="font-semibold text-slate-900">{session.preferences.pageRange}</span></div>
        </div>
      </div>

      {/* Confirm Revoke Modal */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Revoke Session?"
        message="This will instantly purge all uploaded files and disable this 6-digit access code. This action cannot be undone."
        confirmLabel="Revoke and Delete"
        onConfirm={() => {
          setIsConfirmOpen(false);
          onRevokeSession();
        }}
        onCancel={() => setIsConfirmOpen(false)}
        isConfirming={isRevoking}
      />
    </div>
  );
}
