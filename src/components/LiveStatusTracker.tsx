"use client";

import { Check, CircleDot, Clock, ShieldCheck } from "lucide-react";
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
      label: "Uploaded and Encrypted",
      desc: "Files ready in temporary storage",
      isDone: ["ACTIVE", "ACCESSED", "PRINTED", "DELETED"].includes(status),
      isCurrent: status === "ACTIVE",
    },
    {
      id: "ACCESSED",
      label: "Accessed by Operator",
      desc: "Kiosk entered code and verified settings",
      isDone: ["ACCESSED", "PRINTED", "DELETED"].includes(status),
      isCurrent: status === "ACCESSED",
    },
    {
      id: "PRINTED",
      label: "Printed and Destroyed",
      desc: "Physical copy printed, files purged",
      isDone: ["PRINTED", "DELETED"].includes(status),
      isCurrent: status === "PRINTED" || status === "DELETED",
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
      <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100">
        <Clock className="w-4 h-4 text-blue-600" />
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
          Real-Time Session Status
        </h4>
      </div>

      <div className="space-y-4">
        {steps.map((step, idx) => {
          return (
            <div key={step.id} className="flex items-start gap-3">
              <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                {step.isDone && !step.isCurrent ? (
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                ) : step.isCurrent ? (
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <motion.div
                      animate={
                        shouldReduceMotion
                          ? {}
                          : { scale: [1, 1.25, 1] }
                      }
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <CircleDot className="w-4 h-4 text-blue-600" />
                    </motion.div>
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-slate-200 text-slate-300 flex items-center justify-center text-[10px] font-bold">
                    {idx + 1}
                  </div>
                )}

                {/* Vertical connector line */}
                {idx < steps.length - 1 && (
                  <div
                    className={`absolute top-6 left-1/2 -translate-x-1/2 w-0.5 h-5 ${
                      step.isDone ? "bg-emerald-300" : "bg-slate-200"
                    }`}
                  />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className={`text-xs font-semibold ${
                    step.isCurrent
                      ? "text-blue-600 font-bold"
                      : step.isDone
                      ? "text-slate-800"
                      : "text-slate-400"
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-[11px] text-slate-500">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
