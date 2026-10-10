"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { SessionData, FileMetadata, PrintPreferences, PrintPreferencesSchema } from "@/lib/types";
import {
  createSession,
  restoreSession,
  deleteSession,
  subscribeToSession,
} from "@/lib/session-client";
import ResponsiveHeroBanner from "@/components/ui/responsive-hero-banner";
import { DropZone } from "@/components/DropZone";
import { PrintPreferencesCard } from "@/components/PrintPreferencesCard";
import { WhyZDropSummary } from "@/components/landing/WhyZDropSummary";
import { HowItWorksSummary } from "@/components/landing/HowItWorksSummary";
import { QuickFaqAndKiosk } from "@/components/landing/QuickFaqAndKiosk";
import { Footer } from "@/components/landing/Footer";
import { CodeView } from "@/views/CodeView";
import { SuccessView } from "@/views/SuccessView";
import { ZDropLogo } from "@/components/ZDropLogo";
import { GridPulse } from "@/components/ui/grid-pulse";
import GradientBlobCard from "@/components/ui/gradient-bold-card";
import Link from "next/link";

type StudentStep = "UPLOAD" | "CODE" | "SUCCESS";

export default function StudentPage() {
  const [step, setStep] = useState<StudentStep>("UPLOAD");
  const [session, setSession] = useState<SessionData | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states for the Interactive Print Terminal
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [preferences, setPreferences] = useState<PrintPreferences>({
    copies: 1,
    colorMode: "BW",
    sides: "DOUBLE",
    pageRange: "ALL",
  });

  const validation = PrintPreferencesSchema.safeParse(preferences);
  const canSubmit = files.length > 0 && validation.success;

  useEffect(() => {
    restoreSession()
      .then((s) => {
        if (s) {
          setSession(s);
          setStep(["DELETED", "EXPIRED"].includes(s.status) ? "SUCCESS" : "CODE");
        }
      })
      .catch(() => {});
  }, []);

  // Subscribe to real-time session changes
  useEffect(() => {
    if (!session?.id) return;

    const unsubscribe = subscribeToSession(
      session.id,
      (updated) => {
        if (!updated) return;
        setError(null);
        setSession(updated);

        if (updated.status === "DELETED" || updated.status === "EXPIRED") {
          setStep("SUCCESS");
        }
      },
      setError
    );

    return () => unsubscribe();
  }, [session?.id]);

  const handleGenerateCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!canSubmit) return;

    setIsGenerating(true);
    setUploadProgress(0);
    setError(null);
    try {
      const s = await createSession(files, preferences, setUploadProgress);
      setSession(s);
      setStep("CODE");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevokeSession = async () => {
    if (!session) return;
    setIsRevoking(true);
    setError(null);
    try {
      setSession(await deleteSession(session.id));
      setStep("SUCCESS");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsRevoking(false);
    }
  };

  const handleReset = () => {
    sessionStorage.removeItem("zdrop-session");
    setSession(null);
    setFiles([]);
    setError(null);
    setStep("UPLOAD");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="relative min-h-[100dvh] flex flex-col bg-transparent text-zinc-900 dark:text-[#fafafa] selection:bg-emerald-500/25 selection:text-emerald-700 dark:selection:text-emerald-300 transition-colors duration-200 overflow-x-clip">
      {/* Full-Page Reactive GridPulse Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <GridPulse className="size-full [mask-image:none]" />
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="fixed top-20 inset-x-0 z-[90] max-w-md mx-auto px-4">
          <p
            role="alert"
            className="p-3 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-500/40 rounded-xl text-center shadow-xl backdrop-blur-md"
          >
            {error}
          </p>
        </div>
      )}

      {/* Foreground Interactive Page Content */}
      <div className="relative z-10 flex-1 flex flex-col">
        <AnimatePresence mode="wait">
        {step === "UPLOAD" && (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1"
          >
            {/* 1. Responsive Hero Banner Layout & Background as Homepage Hero */}
            <ResponsiveHeroBanner
              badgeLabel="Zero-Trace"
              badgeText="Instant Campus Counter Printing"
              title="Drop it. Print it. Done."
              titleLine2="Zero WhatsApp. Zero USBs."
              description="Print campus documents in 10 seconds flat. Drop files on your phone, configure copies and sides in two taps, and hand a 6-digit PIN across the desk. No WhatsApp downloads, no flash drives, zero file leaks."
              primaryButtonText="Drop Files Below"
              primaryButtonHref="#upload"
              secondaryButtonText="Operator Kiosk"
              secondaryButtonHref="/kiosk"
              ctaButtonText="Launch Kiosk"
              ctaButtonHref="/kiosk"
              partnersTitle="Trusted across university xerox counters & campus copy centers"
            >
              {/* Interactive Print Terminal Card with Gradient Blob Effect */}
              <GradientBlobCard className="rounded-3xl border border-emerald-500/30">
                <div className="p-5 sm:p-7">
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-200 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-sans">
                        Interactive Print Terminal
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-white/5 px-2 py-0.5 rounded-md border border-zinc-200 dark:border-white/10">
                      Max 3 Files · 25MB
                    </span>
                  </div>

                  <form onSubmit={handleGenerateCode} className="space-y-4">
                    {/* Step 1: Select Files */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider font-mono">
                          Step 1: Select Files
                        </label>
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">PDF, DOCX, JPG, PNG</span>
                      </div>
                      <DropZone files={files} onFilesChange={setFiles} disabled={isGenerating} />
                    </div>

                    {/* Step 2: Print Settings */}
                    {files.length > 0 && (
                      <div className="space-y-2 pt-1 animate-in fade-in duration-200">
                        <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider font-mono block">
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
                      <p role="alert" className="text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 p-2.5 rounded-xl">
                        {validation.error.issues[0].message}
                      </p>
                    )}

                    {/* Submit Button */}
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

                      <p className="mt-3 text-[11px] text-zinc-500 dark:text-zinc-400 text-center flex items-center justify-center gap-1.5 font-sans">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 inline" />
                        <span>Dual-Purge: Permanently deleted upon print or after 15 mins</span>
                      </p>
                    </div>
                  </form>
                </div>
              </GradientBlobCard>
            </ResponsiveHeroBanner>

            {/* 2. Structured Summary: Why ZDrop (3 Core Pillars) */}
            <WhyZDropSummary />

            {/* 3. Structured Summary: 3-Step Process */}
            <HowItWorksSummary />

            {/* 4. Structured Summary: FAQ & Operator Kiosk Banner */}
            <QuickFaqAndKiosk />
          </motion.div>
        )}

        {step === "CODE" && session && (
          <motion.div
            key="code"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex-1 py-12 px-4"
          >
            {/* Header for Code View */}
            <header className="max-w-md mx-auto mb-6 flex items-center justify-between">
              <Link href="/" onClick={handleReset}>
                <ZDropLogo size="sm" showText={true} />
              </Link>
              <button
                type="button"
                onClick={() => setStep("UPLOAD")}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Back to Terminal
              </button>
            </header>

            <CodeView
              session={session}
              onRevokeSession={handleRevokeSession}
              onBackToUpload={() => setStep("UPLOAD")}
              isRevoking={isRevoking}
            />
          </motion.div>
        )}

        {step === "SUCCESS" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex-1 py-12 px-4"
          >
            <header className="max-w-md mx-auto mb-6 text-center">
              <ZDropLogo size="sm" showText={true} className="mx-auto" />
            </header>

            <SuccessView session={session} onReset={handleReset} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Component */}
      <Footer />
      </div>
    </div>
  );
}
