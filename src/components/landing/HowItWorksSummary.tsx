"use client";

import { UploadCloud, KeyRound, Printer, ArrowRight } from "lucide-react";
import GradientBlobCard from "@/components/ui/gradient-bold-card";

export function HowItWorksSummary() {
  const steps = [
    {
      step: "01",
      icon: UploadCloud,
      title: "Drop & Configure",
      description:
        "Select your PDFs, DOCX, or images on your phone. Choose copies, color mode, and double-sided preferences in 2 taps.",
    },
    {
      step: "02",
      icon: KeyRound,
      title: "Show 6-Digit PIN",
      description:
        "An ephemeral 6-digit PIN and QR code are instantly generated. Speak the PIN across the counter or flash your screen.",
    },
    {
      step: "03",
      icon: Printer,
      title: "Print & Disappear",
      description:
        "The operator spools your job instantly. As soon as printing finishes, your documents are permanently wiped with zero trace.",
    },
  ];

  return (
    <section className="py-16 sm:py-24 border-t border-zinc-200 dark:border-white/5 relative" id="how-it-works">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold mb-3">
            <span>Simple 3-Step Flow</span>
          </div>
          <h2 className="text-3xl sm:text-4xl text-zinc-900 dark:text-white font-bold tracking-tight font-heading">
            How ZDrop Works in Practice
          </h2>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400 font-sans">
            From file selection on your phone to physical printed sheets in under 15 seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <GradientBlobCard
                key={idx}
                className="h-full hover:border-emerald-500/40 transition-all duration-200"
              >
                <div className="p-6 sm:p-7 space-y-4 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-xl font-bold font-mono text-zinc-400 dark:text-zinc-500">
                        {item.step}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white font-heading">
                      {item.title}
                    </h3>

                    <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
                      {item.description}
                    </p>
                  </div>
                </div>
              </GradientBlobCard>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <a
            href="#upload"
            className="inline-flex items-center gap-2 text-xs font-bold font-heading text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 transition cursor-pointer"
          >
            <span>Ready to try? Drop files above</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </section>
  );
}
