"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { SessionData, FileMetadata, PrintPreferences } from "@/lib/types";
import {
  createMockSession,
  deleteMockSession,
  subscribeToSession,
} from "@/lib/mock-session-store";
import { Navbar } from "@/components/Navbar";
import { UploadView } from "@/views/UploadView";
import { CodeView } from "@/views/CodeView";
import { SuccessView } from "@/views/SuccessView";

type StudentStep = "UPLOAD" | "CODE" | "SUCCESS";

export default function StudentPage() {
  const [step, setStep] = useState<StudentStep>("UPLOAD");
  const [session, setSession] = useState<SessionData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  // Subscribe to real-time session changes (e.g. operator accesses or deletes file)
  useEffect(() => {
    if (!session?.id) return;

    const unsubscribe = subscribeToSession(session.id, (updated) => {
      if (!updated) return;
      setSession(updated);

      if (updated.status === "DELETED") {
        setStep("SUCCESS");
      }
    });

    return () => unsubscribe();
  }, [session?.id]);

  const handleGenerateCode = (
    files: FileMetadata[],
    preferences: PrintPreferences
  ) => {
    setIsGenerating(true);
    // Simulate brief network upload
    setTimeout(() => {
      const newSession = createMockSession(files, preferences);
      setSession(newSession);
      setIsGenerating(false);
      setStep("CODE");
    }, 600);
  };

  const handleRevokeSession = () => {
    if (!session?.id) return;
    setIsRevoking(true);
    setTimeout(() => {
      deleteMockSession(session.id, "STUDENT_REVOKE");
      setIsRevoking(false);
      setStep("SUCCESS");
    }, 400);
  };

  const handleReset = () => {
    setSession(null);
    setStep("UPLOAD");
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#f8fafc]">
      <Navbar currentRole="student" />

      <main className="flex-1">
        <AnimatePresence mode="wait">
          {step === "UPLOAD" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <UploadView
                onGenerateCode={handleGenerateCode}
                isGenerating={isGenerating}
              />
            </motion.div>
          )}

          {step === "CODE" && session && (
            <motion.div
              key="code"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
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
            >
              <SuccessView session={session} onReset={handleReset} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
