"use client";

import { Check, CircleDot, Clock } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { SessionStatus } from "@/lib/types";

interface LiveStatusTrackerProps {
  status: SessionStatus;
}

export function LiveStatusTracker({ status }: LiveStatusTrackerProps) {
  const shouldReduceMotion = useReducedMotion();

  const steps = [
    {
      id: "UPLOADED",
      label: "Uploaded & Encrypted",
      desc: "Files staged in temporary volatile memory",
      isDone: ["ACTIVE", "ACCESSED", "PRINTED", "DELETED"].includes(status),
      isCurrent: status === "ACTIVE",
    },
    {
      id: "ACCESSED",
      label: "Accessed by Kiosk Operator",
      desc: "Shopkeeper verified code & parameters",
      isDone: ["ACCESSED", "PRINTED", "DELETED"].includes(status),
      isCurrent: status === "ACCESSED",
    },
    {
      id: "PRINTED",
      label: "Printed & Destroyed",
      desc: "Hardware print finished, files incinerated",
      isDone: ["PRINTED", "DELETED"].includes(status),
      isCurrent: status === "PRINTED" || status === "DELETED",
    },
  ];

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white/90 dark:bg-[#121214]/90 backdrop-blur-md p-5 sm:p-6 shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-colors">
      <div className="flex items-center gap-2 pb-3 mb-4 border-b border-zinc-200 dark:border-white/10">
        <Clock className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
        <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-mono">
          Real-Time Spooling Pipeline
        </h4>
      </div>

      <div className="space-y-4">
        {steps.map((step, idx) => {
          return (
            <div key={step.id} className="flex items-start gap-3.5">
              <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                {step.isDone && !step.isCurrent ? (
                  <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shadow-xs">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                ) : step.isCurrent ? (
                  <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-400 dark:border-emerald-500/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.25)] dark:shadow-[0_0_12px_rgba(34,197,94,0.3)]">
                    <motion.div
                      animate={
                        shouldReduceMotion
                          ? {}
                          : { scale: [1, 1.25, 1] }
                      }
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <CircleDot className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </motion.div>
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full border border-zinc-200 dark:border-white/15 bg-zinc-100 dark:bg-white/5 text-zinc-500 flex items-center justify-center text-[10px] font-bold font-mono">
                    {idx + 1}
                  </div>
                )}

                {/* Vertical connector line */}
                {idx < steps.length - 1 && (
                  <div
                    className={`absolute top-6 left-1/2 -translate-x-1/2 w-0.5 h-5 ${
                      step.isDone ? "bg-emerald-500" : "bg-zinc-200 dark:bg-white/10"
                    }`}
                  />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className={`text-xs font-semibold font-sans ${
                    step.isCurrent
                      ? "text-emerald-600 dark:text-emerald-400 font-bold"
                      : step.isDone
                      ? "text-zinc-900 dark:text-white"
                      : "text-zinc-400 dark:text-zinc-500"
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-sans mt-0.5">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
