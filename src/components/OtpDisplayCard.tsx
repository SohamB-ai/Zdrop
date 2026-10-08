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
        dark: "#0F172A",
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
    <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs text-center space-y-5">
      {/* Eyebrow and Status */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
          One-Time Access Code
        </span>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
          <motion.span
            animate={
              shouldReduceMotion
                ? {}
                : { opacity: [1, 0.4, 1] }
            }
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-emerald-500"
          />
          <span>Active Session</span>
        </div>
      </div>

      {/* 6-Digit Code Display */}
      <div className="py-3 px-4 rounded-xl bg-slate-50 border border-slate-200/80">
        <div className="flex items-center justify-center gap-2 sm:gap-3 my-2 font-mono">
          {digits.map((digit, idx) => (
            <motion.div
              key={idx}
              initial={shouldReduceMotion ? false : { y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: idx * 0.05, duration: 0.3 }}
              className="w-10 h-14 sm:w-12 sm:h-16 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-2xl sm:text-3xl font-extrabold text-blue-600 shadow-xs"
            >
              {digit}
            </motion.div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-3 mt-3">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition active:scale-[0.98] cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy Code</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowQr(!showQr)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition active:scale-[0.98] cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5 text-slate-500" />
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
          className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center gap-2"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrDataUrl}
            alt="Access QR Code"
            className="w-44 h-44 rounded-lg bg-white p-2 shadow-xs"
          />
          <p className="text-xs text-slate-500">
            Show this QR to the Xerox counter scanner
          </p>
        </motion.div>
      )}

      {/* Countdown Timer Strip */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50/70 border border-amber-200 text-amber-900 text-xs">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Auto-deletes after printing or when timer ends</span>
        </div>
        <span className="font-mono font-bold text-sm text-amber-800">
          {formatTimeRemaining(secondsRemaining)}
        </span>
      </div>

      {/* Revoke Action */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onRevoke}
          disabled={isRevoking}
          className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg transition active:scale-[0.98] cursor-pointer disabled:opacity-50"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Revoke Session and Delete Files Now</span>
        </button>
      </div>
    </div>
  );
}
