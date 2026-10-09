"use client";

import React from "react";

interface ZDropLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
  variant?: "mark" | "full";
}

export function ZDropLogo({
  size = "md",
  showText = true,
  className = "",
}: ZDropLogoProps) {
  const iconDimensions = {
    sm: { width: 24, height: 26, wrapper: "w-6 h-6.5" },
    md: { width: 32, height: 35, wrapper: "w-8 h-8.5" },
    lg: { width: 40, height: 44, wrapper: "w-10 h-11" },
    xl: { width: 48, height: 52, wrapper: "w-12 h-13" },
  }[size];

  const textStyles = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Crisp Emerald-Green ZDrop Document Mark */}
      <div className={`relative flex items-center justify-center shrink-0 ${iconDimensions.wrapper}`}>
        {/* Subtle Ambient Emerald Bloom */}
        <div className="absolute inset-0 rounded-lg bg-emerald-500/25 blur-md -z-10" />

        <svg
          viewBox="0 0 40 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_2px_10px_rgba(34,197,94,0.45)]"
        >
          {/* Document Sheet Body */}
          <path
            d="M6 4C6 2.89543 6.89543 2 8 2H26L34 10V40C34 41.1046 33.1046 42 32 42H8C6.89543 42 6 41.1046 6 40V4Z"
            fill="#121214"
            stroke="#22c55e"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Dog-Ear Fold */}
          <path
            d="M26 2V10H34"
            fill="#18181b"
            stroke="#22c55e"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Dynamic Stylized Z-Drop Bolt */}
          <path
            d="M14 16H26L18 26H24L17 35L19 28H14L18 19L14 16Z"
            fill="#22c55e"
          />
        </svg>
      </div>

      {showText && (
        <span className={`font-sans font-extrabold tracking-tight text-white flex items-center ${textStyles}`}>
          <span className="text-[#22c55e] font-instrument-serif italic font-normal text-[1.25em] mr-0.5">Z</span>
          <span className="text-white">Drop</span>
        </span>
      )}
    </div>
  );
}
