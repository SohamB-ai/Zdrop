"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { SessionData, FileMetadata, PrintPreferences } from "@/lib/types";
import {
  createSession,
  restoreSession,
  deleteSession,
  subscribeToSession,
} from "@/lib/session-client";
import { Navbar } from "@/components/Navbar";
import { UploadView } from "@/views/UploadView";
import { CodeView } from "@/views/CodeView";
import { SuccessView } from "@/views/SuccessView";

type StudentStep = "UPLOAD" | "CODE" | "SUCCESS";

export default function StudentPage() {
  const [step, setStep] = useState<StudentStep>("UPLOAD");
  const [session, setSession] = useState<SessionData | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  const [error, setError] = useState<string | null>(null);
  useEffect(() => { restoreSession().then(s => { if (s) { setSession(s); setStep(['DELETED', 'EXPIRED'].includes(s.status) ? 'SUCCESS' : 'CODE'); } }).catch(() => {}); }, []);
  // Subscribe to real-time session changes (e.g. operator accesses or deletes file)
  useEffect(() => {
    if (!session?.id) return;

    const unsubscribe = subscribeToSession(session.id, (updated) => {
      if (!updated) return;
      setError(null); setSession(updated);

      if (updated.status === "DELETED" || updated.status === "EXPIRED") {
        setStep("SUCCESS");
      }
    }, setError);

    return () => unsubscribe();
  }, [session?.id]);

  const handleGenerateCode = async (files: FileMetadata[], preferences: PrintPreferences) => {
    setIsGenerating(true); setUploadProgress(0); setError(null);
    try { const s = await createSession(files, preferences, setUploadProgress); setSession(s); setStep('CODE'); }
    catch (e) { setError((e as Error).message); }
    finally { setIsGenerating(false); }
  };
  const handleRevokeSession = async () => {
    if (!session) return;
    setIsRevoking(true); setError(null);
    try { setSession(await deleteSession(session.id)); setStep('SUCCESS'); }
    catch (e) { setError((e as Error).message); }
    finally { setIsRevoking(false); }
  };

  const handleReset = () => {
    sessionStorage.removeItem("zdrop-session");
    setSession(null); setError(null);
    setStep("UPLOAD");
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#f8fafc]">
      <Navbar currentRole="student" />

      <main className="flex-1">
        {error && <p role="alert" className="max-w-md mx-auto p-4 text-sm text-red-700">{error}</p>}
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
                uploadProgress={uploadProgress}
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
