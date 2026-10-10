"use client";

import React from "react";
import Image from "next/image";

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
  variant = "mark",
}: ZDropLogoProps) {
  const iconDimensions = {
    sm: { width: 24, height: 26, wrapper: "w-6 h-6.5" },
    md: { width: 32, height: 35, wrapper: "w-8 h-8.5" },
    lg: { width: 40, height: 44, wrapper: "w-10 h-11" },
    xl: { width: 48, height: 52, wrapper: "w-12 h-13" },
  }[size];

  const fullDimensions = {
    sm: { width: 92, height: 28 },
    md: { width: 112, height: 35 },
    lg: { width: 138, height: 42 },
    xl: { width: 168, height: 52 },
  }[size];

  const textStyles = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
  }[size];

  if (variant === "full") {
    return (
      <div className={`relative inline-flex items-center select-none ${className}`}>
        <Image
          src="/zdrop-logo-dark.png"
          alt="ZDrop"
          width={fullDimensions.width}
          height={fullDimensions.height}
          className="hidden dark:block object-contain"
          priority
        />
        <Image
          src="/zdrop-logo.png"
          alt="ZDrop"
          width={fullDimensions.width}
          height={fullDimensions.height}
          className="block dark:hidden object-contain"
          priority
        />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Official Emerald-Green ZDrop Document Mark */}
      <div className={`relative flex items-center justify-center shrink-0 ${iconDimensions.wrapper}`}>
        {/* Subtle Ambient Emerald Bloom */}
        <div className="absolute inset-0 rounded-lg bg-emerald-500/25 blur-md -z-10" />

        <Image
          src="/zdrop-icon-tight.png"
          alt="ZDrop"
          width={iconDimensions.width}
          height={iconDimensions.height}
          style={{ width: "auto", height: "auto" }}
          className="w-full h-full object-contain drop-shadow-[0_2px_10px_rgba(1,186,87,0.45)]"
          priority
        />
      </div>

      {showText && (
        <span className={`font-heading font-extrabold tracking-tight text-zinc-900 dark:text-white flex items-center ${textStyles}`}>
          <span className="text-[#01ba57] font-heading font-black mr-0.5">Z</span>
          <span className="text-zinc-900 dark:text-white font-heading">Drop</span>
        </span>
      )}
    </div>
  );
}
