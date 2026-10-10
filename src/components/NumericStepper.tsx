"use client";

import { Minus, Plus } from "lucide-react";

interface NumericStepperProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  label?: string;
}

export function NumericStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  label = "Copies",
}: NumericStepperProps) {
  const handleDecrement = () => {
    if (value > min) onChange(value - 1);
  };

  const handleIncrement = () => {
    if (value < max) onChange(value + 1);
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#09090b] transition-colors">
      <span className="text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 font-sans">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={value <= min}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:border-emerald-500/40 hover:bg-zinc-100 dark:hover:bg-[#27272a] shadow-2xs dark:shadow-none disabled:opacity-30 disabled:pointer-events-none transition active:scale-[0.96] cursor-pointer"
          aria-label="Decrease copies"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <div className="w-10 text-center font-bold text-sm sm:text-base text-zinc-900 dark:text-white font-mono font-tabular">
          {value}
        </div>

        <button
          type="button"
          onClick={handleIncrement}
          disabled={value >= max}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:border-emerald-500/40 hover:bg-zinc-100 dark:hover:bg-[#27272a] shadow-2xs dark:shadow-none disabled:opacity-30 disabled:pointer-events-none transition active:scale-[0.96] cursor-pointer"
          aria-label="Increase copies"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
