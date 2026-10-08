"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { SessionData } from "@/lib/types";
import {
  resolveByAccessCode,
  deleteMockSession,
  subscribeToSession,
} from "@/lib/mock-session-store";
import { Navbar } from "@/components/Navbar";
import { KioskEntryView } from "@/views/KioskEntryView";
import { KioskJobConsole } from "@/components/KioskJobConsole";

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
      if (!updated || updated.status === "DELETED") {
        setSession(null);
      } else {
        setSession(updated);
      }
    });
    return () => unsubscribe();
  }, [session?.id]);

  const handleCodeSubmit = (code: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    setTimeout(() => {
      const found = resolveByAccessCode(code);
      setIsLoading(false);

      if (!found) {
        setErrorMessage(
          "Code not found, expired, or already completed. Please check with customer."
        );
      } else {
        setSession(found);
      }
    }, 400);
  };

  const handleCompleteAndPurge = () => {
    if (!session?.id) return;
    setIsPurging(true);

    setTimeout(() => {
      deleteMockSession(session.id, "OPERATOR_PRINT");
      setIsPurging(false);
      setSession(null);
      setSuccessToast("Job completed successfully. Storage purged.");

      setTimeout(() => setSuccessToast(null), 3500);
    }, 500);
  };

  const handleCancel = () => {
    setSession(null);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#f8fafc]">
      <Navbar currentRole="kiosk" />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        {/* Success Toast */}
        {successToast && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold text-center max-w-md mx-auto shadow-xs">
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
    </div>
  );
}

export default function KioskPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading Kiosk...</div>}>
      <KioskContent />
    </Suspense>
  );
}
