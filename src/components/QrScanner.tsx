'use client';
import { useEffect, useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';
import type { IScannerControls } from '@zxing/browser';

export function codeFromQr(value: string, origin?: string): string | null {
  if (/^\d{6}$/.test(value)) return value;
  try {
    const url = new URL(value);
    const code = url.searchParams.get('code');
    const isKioskPath = url.pathname === '/kiosk' || url.pathname.endsWith('/kiosk');
    return isKioskPath && code && /^\d{6}$/.test(code) ? code : null;
  } catch {
    return null;
  }
}

export function QrScanner({ onCode, disabled }: { onCode: (code: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const video = useRef<HTMLVideoElement>(null);
  const callback = useRef(onCode);
  callback.current = onCode;

  useEffect(() => {
    if (!open) return;
    let stopped = false;
    let controls: IScannerControls | undefined;
    const start = async () => {
      try {
        if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
          throw new Error('Camera scanning requires HTTPS or localhost.');
        }
        const { BrowserQRCodeReader } = await import('@zxing/browser');
        const reader = new BrowserQRCodeReader();
        controls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: 'environment' } }, audio: false },
          video.current!,
          (result) => {
            if (!result || stopped) return;
            const code = codeFromQr(result.getText(), window.location.origin);
            if (!code) {
              setError('Scan a ZDrop code from this website.');
              return;
            }
            stopped = true;
            controls?.stop();
            setOpen(false);
            callback.current(code);
          }
        );
        if (stopped) controls.stop();
      } catch (e) {
        if (!stopped) setError(e instanceof Error ? e.message : 'Unable to access camera. Enter the code instead.');
      }
    };
    void start();
    return () => {
      stopped = true;
      controls?.stop();
    };
  }, [open]);

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setError('');
          setOpen(!open);
        }}
        className="inline-flex items-center justify-center gap-2 min-h-11 px-5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer active:scale-[0.98] shadow-2xs dark:shadow-none"
      >
        <Camera className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
        <span>Scan Customer QR Code</span>
      </button>

      {open && (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121622] p-4 space-y-3 shadow-xl backdrop-blur-md transition-colors">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-900 dark:text-white font-display">Point camera at customer screen</span>
            <button
              aria-label="Close scanner"
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 transition cursor-pointer"
              onClick={() => setOpen(false)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <video ref={video} muted playsInline className="w-full aspect-video rounded-xl bg-black object-cover border border-slate-200 dark:border-white/10" />
          {error && <p role="alert" className="text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-lg border border-rose-200 dark:border-rose-500/30">{error}</p>}
        </div>
      )}
    </div>
  );
}
