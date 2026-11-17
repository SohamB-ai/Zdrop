"use client";

import { QrScanner } from "@/components/QrScanner";
import { Printer, Shield, Clock, Lock } from "lucide-react";
import { KioskOtpInput } from "@/components/KioskOtpInput";

interface KioskEntryViewProps {
  onSubmitCode: (code: string) => void;
  isLoading?: boolean;
  errorMessage?: string | null;
  onClearError?: () => void;
}

export function KioskEntryView({
  onSubmitCode,
  isLoading = false,
  errorMessage = null,
  onClearError,
}: KioskEntryViewProps) {
  return (
    <div className="space-y-6">
      {/* Print Shop Counter Hero */}
      <div className="zd-kiosk-hero">
        <p className="zd-eyebrow">
          <span className="zd-dot" aria-hidden="true" />
          Print Shop Counter
        </p>

        <h1>Enter 6-Digit Print Code</h1>

        <p>
          Type the 6-digit code given by the student or scan their phone screen to unlock and print their document.
        </p>
      </div>

      {/* Code Input Card */}
      <div className="zd-kiosk-card">
        <KioskOtpInput
          onSubmit={onSubmitCode}
          isLoading={isLoading}
          errorMessage={errorMessage}
          onClearError={onClearError}
        />
      </div>

      <div className="text-center">
        <QrScanner onCode={onSubmitCode} disabled={isLoading} />
      </div>

      {/* Operator Guidelines Strip */}
      <div className="zd-guidelines-grid">
        <div className="zd-guideline-card">
          <div className="zd-guideline-icon">
            <Shield size={18} />
          </div>
          <div className="zd-guideline-text">
            <h3>No File Clutter</h3>
            <p>
              Print directly from the browser. No files are saved to your computer&apos;s Downloads folder.
            </p>
          </div>
        </div>

        <div className="zd-guideline-card">
          <div className="zd-guideline-icon">
            <Lock size={18} />
          </div>
          <div className="zd-guideline-text">
            <h3>Customer Privacy</h3>
            <p>
              Direct print only. Files are permanently shredded from the server as soon as you finish printing.
            </p>
          </div>
        </div>

        <div className="zd-guideline-card">
          <div className="zd-guideline-icon">
            <Clock size={18} />
          </div>
          <div className="zd-guideline-text">
            <h3>Ready Print Settings</h3>
            <p>
              Copies, color mode, and page ranges are already set by the customer on their phone.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
