import { SignIn } from "@clerk/nextjs";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-slate-50 dark:bg-zinc-950">
      <div className="mb-6 flex items-center justify-between w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
        >
          <ArrowLeft size={14} />
          <span>Back to Home</span>
        </Link>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
          <Printer size={14} />
          <span>ZDrop Print Portal</span>
        </span>
      </div>
      <Suspense fallback={<div className="text-xs text-slate-400">Loading sign in…</div>}>
        <SignIn />
      </Suspense>
    </div>
  );
}
