"use client";

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from "react";
import { Delete, ArrowRight, AlertCircle, RefreshCw } from "lucide-react";

interface KioskOtpInputProps {
  onSubmit: (code: string) => void;
  isLoading?: boolean;
  errorMessage?: string | null;
  onClearError?: () => void;
}

export function KioskOtpInput({
  onSubmit,
  isLoading = false,
  errorMessage = null,
  onClearError,
}: KioskOtpInputProps) {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleDigitChange = (index: number, value: string) => {
    if (onClearError) onClearError();
    const clean = value.replace(/[^0-9]/g, "");
    if (!clean) {
      setDigits((prev) => {
        const updated = [...prev];
        updated[index] = "";
        return updated;
      });
      return;
    }

    const lastChar = clean[clean.length - 1];
    setDigits((prev) => {
      const updated = [...prev];
      updated[index] = lastChar;
      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
      } else {
        const fullCode = updated.join("");
        if (fullCode.length === 6 && updated.every((d) => d !== "")) {
          setTimeout(() => onSubmit(fullCode), 10);
        }
      }
      return updated;
    });
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (onClearError) onClearError();
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (onClearError) onClearError();
    const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);
    if (!pasted) return;

    setDigits(() => {
      const updated = ["", "", "", "", "", ""];
      for (let i = 0; i < pasted.length; i++) {
        updated[i] = pasted[i];
      }
      if (pasted.length === 6) {
        setTimeout(() => onSubmit(pasted), 10);
      } else if (pasted.length < 6) {
        inputRefs.current[pasted.length]?.focus();
      }
      return updated;
    });
  };

  const handleKeypadPress = (val: string) => {
    if (onClearError) onClearError();
    if (val === "BACKSPACE") {
      setDigits((prev) => {
        const updated = [...prev];
        for (let i = 5; i >= 0; i--) {
          if (updated[i]) {
            updated[i] = "";
            inputRefs.current[i]?.focus();
            break;
          }
        }
        return updated;
      });
      return;
    }

    if (val === "CLEAR") {
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      return;
    }

    setDigits((prev) => {
      const firstEmpty = prev.findIndex((d) => d === "");
      if (firstEmpty !== -1) {
        const updated = [...prev];
        updated[firstEmpty] = val;
        if (firstEmpty < 5) {
          inputRefs.current[firstEmpty + 1]?.focus();
        } else {
          const fullCode = updated.join("");
          if (fullCode.length === 6 && updated.every((d) => d !== "")) {
            setTimeout(() => onSubmit(fullCode), 10);
          }
        }
        return updated;
      } else {
        // If all 6 digits were already filled, start fresh with the new digit in slot 0
        const updated = [val, "", "", "", "", ""];
        inputRefs.current[1]?.focus();
        return updated;
      }
    });
  };

  const isComplete = digits.every((d) => d !== "");

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* 6 Digit Input Boxes */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-3" onPaste={handlePaste}>
        {digits.map((digit, idx) => (
          <div key={idx} className="flex items-center">
            <input
              ref={(el) => {
                inputRefs.current[idx] = el;
              }}
              id={`kiosk-otp-${idx}`}
              name={`kiosk-otp-${idx}`}
              type="text"
              inputMode="numeric"
              autoComplete={idx === 0 ? "one-time-code" : "off"}
              aria-label={`Access code digit ${idx + 1}`}
              maxLength={1}
              value={digit}
              onFocus={(e) => e.target.select()}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              disabled={isLoading}
              className={`w-9 min-[375px]:w-10 h-14 sm:w-14 sm:h-20 text-center text-2xl sm:text-3xl font-extrabold font-mono rounded-xl border-2 transition-all outline-none ${
                digit
                  ? "border-emerald-500 bg-emerald-50/60 dark:bg-[#18181b] text-emerald-700 dark:text-emerald-400 shadow-[0_0_12px_rgba(34,197,94,0.3)]"
                  : "border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-white hover:border-zinc-400 dark:hover:border-white/20 focus:border-emerald-500 focus:bg-white dark:focus:bg-[#18181b] focus:ring-4 focus:ring-emerald-500/20"
              }`}
            />
            {idx === 2 && (
              <span className="hidden min-[375px]:inline mx-1 text-zinc-400 dark:text-zinc-600 font-bold text-xl select-none">
                •
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 rounded-xl">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Manual Submit Button */}
      <button
        type="button"
        onClick={() => isComplete && onSubmit(digits.join(""))}
        disabled={!isComplete || isLoading}
        className="w-full h-13 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-400 hover:to-green-400 text-zinc-950 font-bold rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] cursor-pointer shadow-[0_0_24px_rgba(34,197,94,0.35)] text-sm font-sans"
      >
        {isLoading ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" />
            <span>Resolving Code…</span>
          </>
        ) : (
          <>
            <span>Access Session Documents</span>
            <ArrowRight className="w-4 h-4 text-zinc-950" />
          </>
        )}
      </button>

      {/* On-screen Keypad for Touch Kiosks */}
      <div className="pt-2">
        <p className="text-[11px] font-semibold text-zinc-500 text-center uppercase tracking-wider mb-2 font-mono">
          Counter Terminal Keypad
        </p>
        <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "CLEAR", "0", "BACKSPACE"].map(
            (key) => (
              <button
                key={key}
                type="button"
                onClick={() => handleKeypadPress(key)}
                disabled={isLoading}
                className="h-12 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#18181b] hover:bg-zinc-100 dark:hover:bg-[#27272a] hover:border-emerald-500/30 text-zinc-900 dark:text-white font-bold text-base flex items-center justify-center active:scale-[0.96] transition cursor-pointer shadow-2xs dark:shadow-none"
              >
                {key === "BACKSPACE" ? (
                  <Delete className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                ) : key === "CLEAR" ? (
                  <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold font-mono">CLEAR</span>
                ) : (
                  key
                )}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
