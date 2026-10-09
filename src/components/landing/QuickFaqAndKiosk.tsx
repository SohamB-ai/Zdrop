"use client";

import Link from "next/link";
import { HelpCircle, Monitor, ArrowRight, ShieldCheck } from "lucide-react";
import GradientBlobCard from "@/components/ui/gradient-bold-card";

export function QuickFaqAndKiosk() {
  const faqs = [
    {
      q: "Do I need an account or phone number?",
      a: "No. ZDrop is completely anonymous. You never share phone numbers, emails, or personal credentials.",
    },
    {
      q: "How does the auto-purge deletion work?",
      a: "Your files are incinerated from storage immediately when the operator clicks print, backed by a 15-minute server expiration fail-safe.",
    },
    {
      q: "What file formats and sizes are supported?",
      a: "PDF, DOCX, JPG, and PNG files up to 25MB each, with a maximum of 3 files per instant session.",
    },
  ];

  return (
    <section className="py-16 sm:py-24 border-t border-white/5 relative" id="faq">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-16">
        {/* Concise FAQ Grid */}
        <div>
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-3">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Frequently Asked Questions</span>
            </div>
            <h2 className="text-3xl sm:text-4xl text-white font-normal font-instrument-serif tracking-tight">
              Essential Answers, Zero Fluff
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {faqs.map((faq, idx) => (
              <GradientBlobCard
                key={idx}
                className="h-full hover:border-emerald-500/40 transition-all duration-200"
              >
                <div className="p-5 sm:p-6 space-y-2.5 h-full">
                  <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{faq.q}</span>
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                    {faq.a}
                  </p>
                </div>
              </GradientBlobCard>
            ))}
          </div>
        </div>

        {/* Operator Kiosk Banner Card */}
        <GradientBlobCard className="rounded-3xl border border-emerald-500/30">
          <div className="p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left max-w-xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
                <Monitor className="w-3.5 h-3.5" />
                <span>For Print Shop & Counter Operators</span>
              </div>
              <h3 className="text-2xl sm:text-3xl text-white font-normal font-instrument-serif">
                Running a Xerox Counter or Copy Shop?
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 font-sans">
                Enter customer PINs or scan QR codes to spool print files directly to your connected laser printers with zero manual downloading.
              </p>
            </div>

            <Link
              href="/kiosk"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-sm font-bold font-sans transition-all active:scale-95 shadow-[0_0_24px_rgba(34,197,94,0.4)] shrink-0 cursor-pointer"
            >
              <Monitor className="w-4 h-4" />
              <span>Launch Operator Kiosk</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </GradientBlobCard>
      </div>
    </section>
  );
}
