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
    <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={value <= min}
          className="w-9 h-9 flex items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition active:scale-[0.96] cursor-pointer"
          aria-label="Decrease copies"
        >
          <Minus className="w-4 h-4" />
        </button>

        <div className="w-12 text-center font-bold text-base text-slate-900 font-mono font-tabular">
          {value}
        </div>

        <button
          type="button"
          onClick={handleIncrement}
          disabled={value >= max}
          className="w-9 h-9 flex items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition active:scale-[0.96] cursor-pointer"
          aria-label="Increase copies"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
