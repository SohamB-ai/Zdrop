"use client";

import { motion } from "motion/react";

interface Option {
  id: string;
  label: string;
  subLabel?: string;
}

interface SegmentedControlProps {
  options: Option[];
  value: string;
  onChange: (val: string) => void;
  className?: string;
}

export function SegmentedControl({
  options,
  value,
  onChange,
  className = "",
}: SegmentedControlProps) {
  return (
    <div
      className={`relative flex bg-[#09090b] p-1 rounded-xl border border-white/10 transition-colors ${className}`}
      role="radiogroup"
    >
      {options.map((option) => {
        const isSelected = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(option.id)}
            className={`relative flex-1 py-2 px-3 text-xs sm:text-sm font-semibold text-center transition-colors duration-150 z-10 active:scale-[0.98] cursor-pointer rounded-lg flex flex-col items-center justify-center ${
              isSelected
                ? "text-emerald-300 font-bold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span>{option.label}</span>
            {option.subLabel && (
              <span
                className={`text-[10px] font-normal ${
                  isSelected ? "text-emerald-400" : "text-zinc-500"
                }`}
              >
                {option.subLabel}
              </span>
            )}
            {isSelected && (
              <motion.div
                layoutId="segmented-pill"
                className="absolute inset-0 bg-[#18181b] rounded-lg shadow-xs border border-emerald-500/40 -z-10 shadow-[0_0_12px_rgba(34,197,94,0.15)]"
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
