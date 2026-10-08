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
      className={`relative flex bg-slate-100 p-1 rounded-lg border border-slate-200 ${className}`}
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
            className={`relative flex-1 py-2 px-3 text-xs sm:text-sm font-semibold text-center transition-colors duration-150 z-10 active:scale-[0.98] cursor-pointer rounded-md flex flex-col items-center justify-center ${
              isSelected ? "text-slate-900" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>{option.label}</span>
            {option.subLabel && (
              <span className={`text-[10px] font-normal ${isSelected ? "text-slate-500" : "text-slate-400"}`}>
                {option.subLabel}
              </span>
            )}
            {isSelected && (
              <motion.div
                layoutId="segmented-pill"
                className="absolute inset-0 bg-white rounded-md shadow-sm border border-slate-200 -z-10"
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
