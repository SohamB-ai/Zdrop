"use client";

import { useState } from "react";
import { ArrowLeft, FileText, CheckCircle2, Sliders, Clock, Store, ShieldCheck } from "lucide-react";
import { SessionData } from "@/lib/types";
import { OtpDisplayCard } from "@/components/OtpDisplayCard";
import { LiveStatusTracker } from "@/components/LiveStatusTracker";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PaymentSettlementCard } from "@/components/PaymentSettlementCard";
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
  const isAcceptedByShop =
    session.status === "ACCESSED" || session.status === "PRINTED";

  return (
    <div className="zd-post-upload-view">
      {/* Top back button & file summary */}
      <div className="zd-post-upload-topbar">
        <button
          type="button"
          onClick={() => setIsConfirmOpen(true)}
          className="zd-code-back-btn"
        >
          <ArrowLeft size={16} />
          <span>Cancel Session</span>
        </button>

        <span className="zd-summary-pill">
          {session.files.length} file{session.files.length > 1 ? "s" : ""} · {formatBytes(session.totalSizeBytes)}
        </span>
      </div>

      {/* Main OTP Card */}
      <OtpDisplayCard
        accessCode={session.accessCode}
        expiresAt={session.expiresAt}
        onRevoke={() => setIsConfirmOpen(true)}
        isRevoking={isRevoking}
      />

      {/* STATE 1: If operator HAS NOT accepted the OTP yet, show waiting guidance */}
      {!isAcceptedByShop ? (
        <div className="zd-card-panel space-y-4 text-center py-6">
          <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Store size={24} className="animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              <Clock size={13} className="animate-spin" />
              <span>Step 2: Show code to shopkeeper</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white pt-2">
              Waiting for Print Shop to accept your code
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              Walk up to any campus Xerox counter and tell the operator your 6-digit code. Once they accept it at their counter, the exact bill and their verified UPI payment QR code will appear here.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Zero risk · You only pay after a verified shop accepts your job</span>
          </div>
        </div>
      ) : (
        /* STATE 2: Operator HAS accepted the OTP on their counter terminal! */
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 size={16} />
              </div>
              <div>
                <div className="font-bold text-sm text-emerald-950 dark:text-emerald-100">
                  Accepted by {session.shopName || "Print Shop Counter"}!
                </div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-300">
                  The operator has unlocked your print job. Review your bill and pay below.
                </div>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-emerald-200/80 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 shrink-0">
              Code Verified
            </span>
          </div>

          {/* Micro-Payment Settlement with Accepting Shop's Verified UPI */}
          <PaymentSettlementCard session={session} />
        </div>
      )}

      {/* Live Status Progression */}
      <LiveStatusTracker status={session.status} />

      {/* Preferences Summary Micro-Card */}
      <div className="zd-card-panel text-xs">
        <div className="flex items-center justify-between pb-2" style={{ borderBottom: "1px solid var(--line)" }}>
          <div className="flex items-center gap-2 font-bold" style={{ color: "var(--text-primary)" }}>
            <Sliders size={15} style={{ color: "var(--text-secondary)" }} />
            <span>Your Print Settings</span>
          </div>
          <span className="zd-pill-active" style={{ fontSize: "10px", padding: "2px 8px" }}>
            <CheckCircle2 size={12} />
            Locked
          </span>
        </div>

        <div className="zd-params-grid">
          <div className="zd-param-item">
            <span className="zd-param-label">COPIES</span>
            <span className="zd-param-val">{session.preferences.copies}</span>
          </div>
          <div className="zd-param-item">
            <span className="zd-param-label">COLOR MODE</span>
            <span className="zd-param-val">
              {session.preferences.colorMode === "AUTO"
                ? "Auto (Smart Color)"
                : session.preferences.colorMode === "BW"
                ? "Grayscale (B&W)"
                : "Full Color"}
            </span>
          </div>
          <div className="zd-param-item">
            <span className="zd-param-label">SIDES</span>
            <span className="zd-param-val">
              {session.preferences.sides === "DOUBLE" ? "Double-Sided" : "Single-Sided"}
            </span>
          </div>
          <div className="zd-param-item">
            <span className="zd-param-label">PAGE RANGE</span>
            <span className="zd-param-val">{session.preferences.pageRange}</span>
          </div>
        </div>
      </div>

      {/* Confirm Revoke Modal */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Cancel & Delete Files?"
        message="This immediately deletes your uploaded files and disables your 6-digit access code."
        confirmLabel="Delete Now"
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
