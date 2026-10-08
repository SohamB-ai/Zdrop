import Link from "next/link";
import { ShieldCheck, Monitor } from "lucide-react";

interface NavbarProps {
  currentRole?: "student" | "kiosk";
}

export function Navbar({ currentRole = "student" }: NavbarProps) {
  return (
    <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-baseline gap-2 group">
          <span className="text-2xl font-bold tracking-tight text-blue-600 font-[family-name:var(--font-geist)]">
            ZDrop
          </span>
          <span className="text-xs text-slate-500 hidden sm:inline font-medium">
            Drop it. Print it. Done.
          </span>
        </Link>

        {/* Status / Role Toggle */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Zero-Retention Storage</span>
          </div>

          {currentRole === "student" ? (
            <Link
              href="/kiosk"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition active:scale-[0.98]"
            >
              <Monitor className="w-3.5 h-3.5 text-slate-500" />
              <span>Operator Kiosk</span>
            </Link>
          ) : (
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition active:scale-[0.98]"
            >
              <span>Student Upload</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
