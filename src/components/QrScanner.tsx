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
  const [open, setOpen] = useState(false); const [error, setError] = useState('');
  const video = useRef<HTMLVideoElement>(null); const callback = useRef(onCode); callback.current = onCode;
  useEffect(() => {
    if (!open) return;
    let stopped = false; let controls: IScannerControls | undefined;
    const start = async () => {
      try {
        if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) throw new Error('Camera scanning requires HTTPS or localhost.');
        const { BrowserQRCodeReader } = await import('@zxing/browser');
        const reader = new BrowserQRCodeReader();
        controls = await reader.decodeFromConstraints({ video: { facingMode: { ideal: 'environment' } }, audio: false }, video.current!, result => {
          if (!result || stopped) return;
          const code = codeFromQr(result.getText(), window.location.origin);
          if (!code) { setError('Scan a ZDrop code from this website.'); return; }
          stopped = true; controls?.stop(); setOpen(false); callback.current(code);
        });
        if (stopped) controls.stop();
      } catch (e) { if (!stopped) setError(e instanceof Error ? e.message : 'Unable to access camera. Enter the code instead.'); }
    };
    void start(); return () => { stopped = true; controls?.stop(); };
  }, [open]);
  return <div className="space-y-3">
    <button type="button" disabled={disabled} onClick={() => { setError(''); setOpen(!open); }} className="inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700"><Camera className="w-4 h-4" />Scan customer QR</button>
    {open && <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3"><div className="flex justify-between items-center"><span className="text-sm font-semibold">Point the camera at the access QR</span><button aria-label="Close scanner" className="p-2" onClick={() => setOpen(false)}><X className="w-5 h-5" /></button></div><video ref={video} muted playsInline className="w-full aspect-video rounded-lg bg-slate-900 object-cover" />{error && <p role="alert" className="text-sm text-red-700">{error}</p>}</div>}
  </div>;
}
