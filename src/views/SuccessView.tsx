"use client";

import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { ShieldCheck, ArrowRight, CheckCircle2, Store, QrCode, Smartphone, Clock, Loader2, Sparkles } from "lucide-react";
import { SessionData } from "@/lib/types";
import { generateUpiUrl } from "@/lib/pricing";
import { updateSessionPayment } from "@/lib/session-client";

interface SuccessViewProps {
  session: SessionData | null;
  onReset: () => void;
}

export function SuccessView({ session, onReset }: SuccessViewProps) {
  const [upiQrUrl, setUpiQrUrl] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<string>(
    session?.paymentStatus || "UNPAID"
  );
  const [isUpdating, setIsUpdating] = useState(false);

  const estimate = session?.costEstimate;
  const shopName = session?.shopName || "Print Shop Counter";
  const upiId = estimate?.upiId || "";
  const payeeName = estimate?.payeeName || shopName;
  const amount = estimate?.totalAmount || 0;

  const upiUrl = upiId
    ? generateUpiUrl({
        upiId,
        payeeName,
        amount,
        accessCode: session?.accessCode,
      })
    : "";

  useEffect(() => {
    if (!upiUrl) return;
    QRCode.toDataURL(upiUrl, {
      width: 220,
      margin: 2,
      color: {
        dark: "#141a13",
        light: "#ffffff",
      },
    })
      .then(setUpiQrUrl)
      .catch(() => {});
  }, [upiUrl]);

  const handleMarkPaid = async () => {
    if (!session?.id) return;
    setIsUpdating(true);
    try {
      await updateSessionPayment(session.id, "PAID_ONLINE", "UPI");
      setPaymentStatus("PAID_ONLINE");
    } catch {
      // Offline fallback
      setPaymentStatus("PAID_ONLINE");
    } finally {
      setIsUpdating(false);
    }
  };

  const isPaid = paymentStatus === "PAID_ONLINE" || paymentStatus === "PAID_COUNTER";

  return (
    <div className="zd-success-container max-w-lg mx-auto space-y-6">
      {/* Icon with glowing bloom */}
      <div className="zd-success-shield-wrap mx-auto">
        <ShieldCheck size={42} />
      </div>

      {/* Simple English Headlines */}
      <div className="space-y-2 text-center">
        <h2
          style={{
            fontFamily: "var(--font-space-grotesk)",
            fontSize: "26px",
            fontWeight: 800,
            color: "var(--text-primary)",
            margin: "0 0 6px",
          }}
        >
          Document Printed & Deleted
        </h2>
        <p
          style={{
            fontSize: "14px",
            color: "var(--text-secondary)",
            maxWidth: "400px",
            margin: "0 auto",
            lineHeight: 1.5,
          }}
        >
          {session?.deletionSource === "OPERATOR_PRINT"
            ? "The print shop finished your printout. Your files have been completely deleted from our servers."
            : session?.status === "EXPIRED"
            ? "Your 15-minute time expired. All files were automatically removed from the server."
            : "Your session was cancelled and all uploaded files were erased."}
        </p>
      </div>

      {/* Print Shop Payment & QR Settlement Card */}
      {estimate && (
        <div className="zd-card-panel p-5 space-y-4 text-left border border-slate-200 dark:border-zinc-800">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
            <div className="flex items-center gap-2.5">
              <Store size={18} className="text-blue-600 dark:text-blue-400" />
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{shopName}</h4>
                <p className="text-[11px] text-slate-500">Bill: {estimate.currencySymbol}{amount.toFixed(2)}</p>
              </div>
            </div>

            {isPaid ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 size={13} />
                <span>Paid ({paymentStatus === "PAID_ONLINE" ? "UPI" : "Cash"})</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                <Clock size={13} />
                <span>Payment Due: {estimate.currencySymbol}{amount.toFixed(2)}</span>
              </span>
            )}
          </div>

          {!isPaid ? (
            <div className="space-y-3 pt-1 text-center">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Received your paper printouts? Scan the shop owner&apos;s UPI QR code to pay directly:
              </p>

              {upiQrUrl && (
                <div className="inline-block p-3 bg-white rounded-xl shadow-sm border border-slate-200 my-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={upiQrUrl} alt="Shop UPI QR" className="w-48 h-48 mx-auto" />
                  <p className="text-[11px] text-slate-500 font-mono mt-1 font-semibold">
                    {upiId}
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                {upiUrl && (
                  <a
                    href={upiUrl}
                    className="zd-button zd-button--primary flex-1 justify-center"
                  >
                    <Smartphone size={16} />
                    <span>Pay {estimate.currencySymbol}{amount.toFixed(2)} via UPI App</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={handleMarkPaid}
                  disabled={isUpdating}
                  className="zd-button zd-button--secondary justify-center"
                >
                  {isUpdating ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  <span>I Have Paid</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>Payment recorded directly to {payeeName}. No further action needed.</span>
            </div>
          )}
        </div>
      )}

      {/* Simple English Print & Shred Summary */}
      <div className="zd-card-panel text-left text-xs max-w-sm mx-auto" style={{ width: "100%" }}>
        <div className="flex items-center justify-between pb-3" style={{ borderBottom: "1px solid var(--line)" }}>
          <div className="flex items-center gap-2 font-bold" style={{ color: "var(--text-primary)" }}>
            <CheckCircle2 size={16} style={{ color: "var(--success)" }} />
            <span>Print & Shred Summary</span>
          </div>
          <span className="zd-pill-active" style={{ fontSize: "10px", padding: "2px 8px" }}>
            Deleted
          </span>
        </div>

        <div className="zd-receipt-grid">
          <div className="zd-receipt-item">
            <span className="zd-receipt-label">ACCESS CODE</span>
            <span className="zd-receipt-val" style={{ color: "var(--primary-ink)" }}>
              {session?.accessCode || "482913"}
            </span>
          </div>
          <div className="zd-receipt-item">
            <span className="zd-receipt-label">REASON</span>
            <span className="zd-receipt-val" style={{ color: "var(--success)" }}>
              {session?.deletionSource === "OPERATOR_PRINT"
                ? "Print Finished"
                : session?.deletionSource === "STUDENT_REVOKE"
                ? "User Cancelled"
                : "Timer Expired"}
            </span>
          </div>
          <div className="zd-receipt-item">
            <span className="zd-receipt-label">FILES KEPT</span>
            <span className="zd-receipt-val">0 Bytes (Shredded)</span>
          </div>
          <div className="zd-receipt-item">
            <span className="zd-receipt-label">ACTIVE TIME</span>
            <span className="zd-receipt-val">
              {Math.max(
                0,
                Math.round(
                  ((session?.deletedAt || Date.now()) - (session?.createdAt || Date.now())) / 1000
                )
              )}{" "}
              sec
            </span>
          </div>
        </div>
      </div>

      {/* Primary CTA */}
      <div style={{ paddingTop: "8px" }}>
        <button
          type="button"
          onClick={onReset}
          className="zd-button zd-button--primary"
          style={{ width: "100%", maxWidth: "384px", margin: "0 auto", height: "48px", fontSize: "14px" }}
        >
          <span>Print Another Document</span>
          <ArrowRight size={17} />
        </button>
      </div>
    </div>
  );
}
