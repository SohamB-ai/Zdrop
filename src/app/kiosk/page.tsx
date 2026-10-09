"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { SessionData } from "@/lib/types";
import {
  resolveByAccessCode,
  deleteSession,
  subscribeToSession,
} from "@/lib/session-client";
import { Navbar } from "@/components/Navbar";
import { KioskEntryView } from "@/views/KioskEntryView";
import { KioskJobConsole } from "@/components/KioskJobConsole";
import { Footer } from "@/components/landing/Footer";
import { WavesShaderBackground } from "@/components/WavesShaderBackground";


function KioskContent() {
  const searchParams = useSearchParams();
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Auto-resolve code from URL query parameter (from QR code scan)
  useEffect(() => {
    const codeParam = searchParams.get("code");
    if (codeParam && codeParam.length === 6) {
      handleCodeSubmit(codeParam);
    }
  }, [searchParams]);

  // Subscribe to live session updates while looking at job
  useEffect(() => {
    if (!session?.id) return;
    const unsubscribe = subscribeToSession(session.id, (updated) => {
      if (!updated || updated.status === "DELETED" || updated.status === "EXPIRED") {
        setSession(null);
      } else {
        setSession(updated);
      }
    });
    return () => unsubscribe();
  }, [session?.id]);

  const handleCodeSubmit = async (code: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      setSession(await resolveByAccessCode(code));
    } catch (e) {
      setErrorMessage((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteAndPurge = async () => {
    if (!session) return;
    setIsPurging(true);
    setErrorMessage(null);
    try {
      await deleteSession(session.id);
      setSession(null);
      setSuccessToast("Job completed. Uploaded files purged permanently.");
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (e) {
      setErrorMessage((e as Error).message);
    } finally {
      setIsPurging(false);
    }
  };

  const handleCancel = () => {
    setSession(null);
    setErrorMessage(null);
  };

  return (
    <div className="relative min-h-[100dvh] flex flex-col text-[var(--text-primary)] transition-colors duration-200 overflow-x-hidden">
      {/* Animated WebGL "Waves" Shader Background */}
      <WavesShaderBackground />

      <Navbar currentRole="kiosk" />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 pt-24 pb-12 sm:pt-28">
        {errorMessage && session && (
          <p role="alert" className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs text-center">
            {errorMessage}
          </p>
        )}

        {/* Success Toast */}
        {successToast && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold text-center max-w-md mx-auto shadow-sm dark:shadow-lg backdrop-blur-md">
            {successToast}
          </div>
        )}

        <AnimatePresence mode="wait">
          {!session ? (
            <motion.div
              key="entry"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <KioskEntryView
                onSubmitCode={handleCodeSubmit}
                isLoading={isLoading}
                errorMessage={errorMessage}
                onClearError={() => setErrorMessage(null)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="job"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <KioskJobConsole
                session={session}
                onPrint={() => {}}
                onCompleteAndPurge={handleCompleteAndPurge}
                onCancel={handleCancel}
                isPurging={isPurging}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}

export default function KioskPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading Kiosk Console…</div>}>
      <KioskContent />
    </Suspense>
  );
}
