"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { PrintPreferences } from "@/lib/types";
import { NumericStepper } from "./NumericStepper";
import { SegmentedControl } from "./SegmentedControl";

interface PrintPreferencesCardProps {
  preferences: PrintPreferences;
  onChange: (prefs: PrintPreferences) => void;
  disabled?: boolean;
}

export function PrintPreferencesCard({
  preferences,
  onChange,
  disabled = false,
}: PrintPreferencesCardProps) {
  const [isCustomPageRange, setIsCustomPageRange] = useState(
    preferences.pageRange !== "ALL"
  );

  const updateField = <K extends keyof PrintPreferences>(
    key: K,
    val: PrintPreferences[K]
  ) => {
    onChange({
      ...preferences,
      [key]: val,
    });
  };

  const handlePageRangeRadio = (custom: boolean) => {
    setIsCustomPageRange(custom);
    if (!custom) {
      updateField("pageRange", "ALL");
    } else {
      updateField("pageRange", "1-5");
    }
  };

  return (
    <fieldset
      disabled={disabled}
      className="bg-white/90 dark:bg-[#121214]/90 rounded-2xl border border-zinc-200 dark:border-white/10 p-4 sm:p-5 shadow-2xs space-y-4 transition-colors"
    >
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-zinc-200 dark:border-white/5">
        <SlidersHorizontal className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
        <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white tracking-tight font-sans">
          Print Preferences
        </h3>
      </div>

      {/* Copies Stepper */}
      <NumericStepper
        label="Number of Copies"
        value={preferences.copies}
        onChange={(val) => updateField("copies", val)}
      />

      {/* Color Mode */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block font-sans">
          Color Mode
        </label>
        <SegmentedControl
          name="colorMode"
          options={[
            { id: "BW", label: "Black & White", subLabel: "Economy" },
            { id: "COLOR", label: "Full Color", subLabel: "Vibrant" },
          ]}
          value={preferences.colorMode}
          onChange={(val) => updateField("colorMode", val as "BW" | "COLOR")}
        />
      </div>

      {/* Print Sides */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block font-sans">
          Print Sides
        </label>
        <SegmentedControl
          name="sides"
          options={[
            { id: "DOUBLE", label: "Double-Sided", subLabel: "Duplex" },
            { id: "SINGLE", label: "Single-Sided", subLabel: "Front Only" },
          ]}
          value={preferences.sides}
          onChange={(val) => updateField("sides", val as "SINGLE" | "DOUBLE")}
        />
      </div>

      {/* Page Selection */}
      <div className="space-y-2 pt-1">
        <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block font-sans">
          Page Range
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handlePageRangeRadio(false)}
            disabled={disabled}
            className={`p-2.5 rounded-xl border text-left transition cursor-pointer active:scale-[0.98] ${
              !isCustomPageRange
                ? "border-emerald-500 bg-emerald-50 text-emerald-900 dark:border-emerald-500/60 dark:bg-emerald-950/40 dark:text-emerald-200 font-semibold shadow-2xs"
                : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300 dark:border-white/10 dark:bg-[#18181b] dark:text-zinc-400 dark:hover:border-white/20"
            }`}
          >
            <div className="text-xs font-medium">All Pages</div>
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-normal">
              Print entire document
            </div>
          </button>

          <button
            type="button"
            onClick={() => handlePageRangeRadio(true)}
            disabled={disabled}
            className={`p-2.5 rounded-xl border text-left transition cursor-pointer active:scale-[0.98] ${
              isCustomPageRange
                ? "border-emerald-500 bg-emerald-50 text-emerald-900 dark:border-emerald-500/60 dark:bg-emerald-950/40 dark:text-emerald-200 font-semibold shadow-2xs"
                : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300 dark:border-white/10 dark:bg-[#18181b] dark:text-zinc-400 dark:hover:border-white/20"
            }`}
          >
            <div className="text-xs font-medium">Custom Range</div>
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-normal">
              Select specific pages
            </div>
          </button>
        </div>

        {isCustomPageRange && (
          <div className="mt-2">
            <input
              type="text"
              placeholder="e.g. 1-5, 8, 11-14"
              value={preferences.pageRange === "ALL" ? "" : preferences.pageRange}
              onChange={(e) => updateField("pageRange", e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-zinc-300 bg-white text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono dark:border-white/10 dark:bg-[#09090b] dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-emerald-400 dark:focus:ring-emerald-400"
            />
          </div>
        )}
      </div>

      {/* Optional Note */}
      <div className="space-y-1.5 pt-1">
        <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block font-sans">
          Instructions for Operator (Optional)
        </label>
        <input
          type="text"
          maxLength={120}
          placeholder="e.g. Staple top-left, landscape mode"
          value={preferences.customerNotes || ""}
          onChange={(e) => updateField("customerNotes", e.target.value)}
          className="w-full h-10 px-3 rounded-xl border border-zinc-300 bg-white text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-sans dark:border-white/10 dark:bg-[#09090b] dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-emerald-400 dark:focus:ring-emerald-400"
        />
      </div>
    </fieldset>
  );
}
