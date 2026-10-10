"use client";

import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { Copy, Check, QrCode, Clock, ShieldAlert } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { formatTimeRemaining } from "@/lib/utils";

interface OtpDisplayCardProps {
  accessCode: string;
  expiresAt: number;
  onRevoke: () => void;
  isRevoking?: boolean;
}

export function OtpDisplayCard({
  accessCode,
  expiresAt,
  onRevoke,
  isRevoking = false,
}: OtpDisplayCardProps) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(
    Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
  );

  const shouldReduceMotion = useReducedMotion();

  // Tick down timer
  useEffect(() => {
    const interval = setInterval(() => {
      const left = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setSecondsRemaining(left);
      if (left <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  // Generate QR code for counter scanner
  useEffect(() => {
    if (typeof window === "undefined") return;
    const kioskUrl = `${window.location.origin}/kiosk?code=${accessCode}`;
    QRCode.toDataURL(kioskUrl, {
      margin: 1,
      width: 220,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("Error generating QR", err));
  }, [accessCode]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(accessCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const digits = accessCode.split("");

  return (
    <div className="rounded-3xl border border-emerald-500/30 bg-white/95 dark:bg-[#121214]/95 p-6 sm:p-7 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.8)] backdrop-blur-xl text-center space-y-6 transition-colors">
      {/* Eyebrow and Status */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-heading">
          One-Time Counter Code
        </span>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold font-sans">
          <motion.span
            animate={
              shouldReduceMotion
                ? {}
                : { opacity: [1, 0.3, 1] }
            }
            transition={{ duration: 1.8, repeat: Infinity }}
            className="w-2 h-2 rounded-full bg-emerald-500"
          />
          <span>Active Session</span>
        </div>
      </div>

      {/* 6-Digit Code Display */}
      <div className="py-4 px-2 min-[375px]:px-4 sm:px-6 rounded-2xl bg-zinc-50 border border-zinc-200 dark:bg-[#09090b] dark:border-white/10">
        <div className="flex items-center justify-center gap-1.5 min-[375px]:gap-2 sm:gap-3 my-2 font-mono">
          {digits.map((digit, idx) => (
            <motion.div
              key={idx}
              initial={shouldReduceMotion ? false : { y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: idx * 0.05, duration: 0.3 }}
              className="w-9 min-[375px]:w-10 sm:w-12 h-13 min-[375px]:h-14 sm:h-16 rounded-xl bg-white dark:bg-[#18181b] border border-emerald-500/40 flex items-center justify-center text-xl min-[375px]:text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 shadow-sm dark:shadow-[0_0_16px_rgba(34,197,94,0.25)] font-mono"
            >
              {digit}
            </motion.div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 sm:gap-3 mt-4">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 min-[375px]:px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 text-xs font-semibold text-zinc-700 dark:text-zinc-200 transition active:scale-[0.98] cursor-pointer font-heading touch-manipulation"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-700 dark:text-emerald-300 font-bold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-emerald-500" />
                <span>Copy Code</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowQr(!showQr)}
            className="inline-flex items-center gap-1.5 px-3 min-[375px]:px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 text-xs font-semibold text-zinc-700 dark:text-zinc-200 transition active:scale-[0.98] cursor-pointer font-heading touch-manipulation"
          >
            <QrCode className="w-3.5 h-3.5 text-emerald-500" />
            <span>{showQr ? "Hide QR" : "Show QR"}</span>
          </button>
        </div>
      </div>

      {/* Dynamic QR Modal / Expand */}
      {showQr && qrDataUrl && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 dark:bg-[#09090b] dark:border-white/10 flex flex-col items-center gap-3"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrDataUrl}
            alt="Access QR Code"
            className="w-48 h-48 rounded-xl bg-white p-2.5 shadow-md"
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-sans">
            Show this QR to the shop counter camera
          </p>
        </motion.div>
      )}

      {/* Countdown Timer Strip */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
          <span className="text-left font-sans">Auto-purges upon print completion or timeout</span>
        </div>
        <span className="font-mono font-bold text-sm text-emerald-700 dark:text-emerald-300 shrink-0 pl-2">
          {formatTimeRemaining(secondsRemaining)}
        </span>
      </div>

      {/* Revoke Action */}
      <div className="pt-1">
        <button
          type="button"
          onClick={onRevoke}
          disabled={isRevoking}
          className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-rose-300 dark:hover:border-rose-500/20 px-4 py-2.5 rounded-xl transition active:scale-[0.98] cursor-pointer disabled:opacity-50"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Revoke Session & Purge Files Now</span>
        </button>
      </div>
    </div>
  );
}
