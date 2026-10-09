"use client";

import { ShieldAlert, Usb, Flame, CheckCircle2 } from "lucide-react";
import GradientBlobCard from "@/components/ui/gradient-bold-card";

export function WhyZDropSummary() {
  const pillars = [
    {
      icon: ShieldAlert,
      tag: "Zero Privacy Leaks",
      title: "No WhatsApp Download Trap",
      description:
        "Never save shop numbers to your contacts or leave unencrypted ID cards, resumes, and bank statements lingering in public downloads folders.",
      highlight: "0 Files Left on Stranger PCs",
    },
    {
      icon: Usb,
      tag: "Zero Malware Risk",
      title: "No Infected Flash Drives",
      description:
        "Avoid plugging personal flash drives into unmanaged cyber-cafe machines known for shortcut trojans and autorun viruses.",
      highlight: "100% Cloud-Encrypted Handshake",
    },
    {
      icon: Flame,
      tag: "Instant Shredding",
      title: "Dual-Trigger Auto-Purge",
      description:
        "Documents are cryptographically shredded the exact second the operator hits print, with an automatic 15-minute server expiration fail-safe.",
      highlight: "Permanent Zero-Trace Deletion",
    },
  ];

  return (
    <section className="py-16 sm:py-24 border-t border-white/5 relative" id="why-zdrop">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-3">
            <span>The ZDrop Advantage</span>
          </div>
          <h2 className="text-3xl sm:text-4xl text-white font-normal font-instrument-serif tracking-tight">
            Why Campus Counters Switched to ZDrop
          </h2>
          <p className="mt-3 text-sm text-zinc-400 font-sans">
            Printing at college xerox shops used to mean compromised files, malware-ridden flash drives, and loud verbal mistakes. We fixed all three.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <GradientBlobCard
                key={idx}
                className="h-full hover:border-emerald-500/40 transition-all duration-200"
              >
                <div className="p-6 sm:p-7 space-y-4 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-mono font-medium text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        {pillar.tag}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white font-sans">
                      {pillar.title}
                    </h3>

                    <p className="mt-2 text-xs text-zinc-400 leading-relaxed font-sans">
                      {pillar.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center gap-2 text-xs font-medium text-emerald-300 font-sans">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{pillar.highlight}</span>
                  </div>
                </div>
              </GradientBlobCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
