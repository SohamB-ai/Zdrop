"use client";

import React, { useEffect, useRef, useState } from "react";

interface GlowingArcBackgroundProps {
  colorScheme?: "emerald" | "amber";
  className?: string;
  enableMouseParallax?: boolean;
}

export function GlowingArcBackground({
  colorScheme = "emerald",
  className = "",
  enableMouseParallax = true,
}: GlowingArcBackgroundProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enableMouseParallax) return;

    let rafId: number;
    const handleMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        // Normalized coordinates between -1 and 1
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
        setMousePos({ x, y });
      });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, [enableMouseParallax]);

  // Color configurations based on selected scheme
  const isEmerald = colorScheme === "emerald";

  const colors = isEmerald
    ? {
        primary: "#01ba57",
        secondary: "#10b981",
        accent: "#4ade80",
        filament: "#f0fdf4",
        ambientRgba: "rgba(1, 186, 87, 0.35)",
        coneGlow: "rgba(16, 185, 129, 0.28)",
        shadowRgba: "rgba(1, 186, 87, 0.6)",
      }
    : {
        primary: "#ea580c",
        secondary: "#f97316",
        accent: "#fbbf24",
        filament: "#fffbeb",
        ambientRgba: "rgba(234, 88, 12, 0.35)",
        coneGlow: "rgba(249, 115, 22, 0.28)",
        shadowRgba: "rgba(234, 88, 12, 0.6)",
      };

  // Particles along the glowing horizon
  const particles = [
    { top: "28%", left: "32%", delay: "0s", duration: "7s", size: "2.5px" },
    { top: "22%", left: "48%", delay: "1.5s", duration: "8.5s", size: "3px" },
    { top: "35%", left: "62%", delay: "3s", duration: "6s", size: "2px" },
    { top: "44%", left: "74%", delay: "0.8s", duration: "7.5s", size: "3.5px" },
    { top: "58%", left: "84%", delay: "2.2s", duration: "9s", size: "2px" },
    { top: "68%", left: "88%", delay: "4s", duration: "6.5s", size: "3px" },
    { top: "78%", left: "94%", delay: "1.2s", duration: "8s", size: "2.5px" },
  ];

  // Parallax transform calculations
  const parallaxX = mousePos.x * 12;
  const parallaxY = mousePos.y * 8;

  // Arc path geometry matching the reference screenshot:
  // Sweeps from top-left, crests across upper-center, curves down across right hemisphere
  const arcPath =
    "M -120 220 C 220 90, 680 80, 1040 310 C 1280 470, 1440 730, 1620 980";

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none overflow-hidden select-none bg-[#09090b] ${className}`}
      aria-hidden="true"
    >
      {/* 1. Deep Space Cosmic Canvas Gradient */}
      <div className="absolute inset-0 bg-radial-at-c from-[#0d1210]/60 via-[#09090b]/95 to-[#09090b] -z-30" />

      {/* 2. Expansive Volumetric Light Cone on Right Hemisphere (matching screenshot) */}
      <div
        className="absolute top-[10%] right-[-15%] w-[900px] h-[900px] rounded-full blur-[160px] animate-flare-pulse opacity-75 -z-20 transition-transform duration-700 ease-out"
        style={{
          background: `radial-gradient(circle at 60% 50%, ${colors.coneGlow} 0%, ${colors.ambientRgba} 40%, transparent 75%)`,
          transform: `translate3d(${parallaxX * 1.5}px, ${parallaxY * 1.5}px, 0)`,
        }}
      />

      {/* 3. Secondary Ambient Atmospheric Bloom */}
      <div
        className="absolute top-[2%] left-[25%] w-[700px] h-[450px] rounded-full blur-[140px] opacity-40 -z-20"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${colors.ambientRgba} 0%, transparent 70%)`,
        }}
      />

      {/* 4. Multi-Layered SVG Luminous Arc */}
      <div
        className="absolute inset-0 w-full h-full animate-arc-breathe transition-transform duration-500 ease-out"
        style={{
          transform: `translate3d(${parallaxX * 0.6}px, ${parallaxY * 0.6}px, 0)`,
        }}
      >
        <svg
          viewBox="0 0 1440 900"
          preserveAspectRatio="none"
          className="w-full h-full overflow-visible"
        >
          <defs>
            {/* Linear gradient along the arc trajectory */}
            <linearGradient id="arcCoreGrad" x1="0%" y1="15%" x2="100%" y2="90%">
              <stop offset="0%" stopColor={colors.primary} stopOpacity="0.4" />
              <stop offset="35%" stopColor={colors.secondary} stopOpacity="0.85" />
              <stop offset="65%" stopColor={colors.accent} stopOpacity="1" />
              <stop offset="85%" stopColor={colors.filament} stopOpacity="1" />
              <stop offset="100%" stopColor={colors.primary} stopOpacity="0.75" />
            </linearGradient>

            <linearGradient id="arcBloomGrad" x1="0%" y1="15%" x2="100%" y2="90%">
              <stop offset="0%" stopColor={colors.primary} stopOpacity="0.1" />
              <stop offset="40%" stopColor={colors.primary} stopOpacity="0.5" />
              <stop offset="70%" stopColor={colors.secondary} stopOpacity="0.8" />
              <stop offset="100%" stopColor={colors.primary} stopOpacity="0.3" />
            </linearGradient>

            <linearGradient id="photonStreamGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="45%" stopColor={colors.accent} stopOpacity="0.9" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="55%" stopColor={colors.accent} stopOpacity="0.9" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>

            {/* Custom SVG Gaussian Blur Filter */}
            <filter id="deepBlur" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="35" />
            </filter>
            <filter id="midBlur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="14" />
            </filter>
            <filter id="coreBlur" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="4.5" />
            </filter>
          </defs>

          {/* Layer 1: Wide Volumetric Atmospheric Bloom */}
          <path
            d={arcPath}
            fill="none"
            stroke="url(#arcBloomGrad)"
            strokeWidth="70"
            filter="url(#deepBlur)"
            opacity="0.5"
          />

          {/* Layer 2: Mid-Range Radiance Aura */}
          <path
            d={arcPath}
            fill="none"
            stroke="url(#arcCoreGrad)"
            strokeWidth="28"
            filter="url(#midBlur)"
            opacity="0.75"
          />

          {/* Layer 3: Inner Intense Core Glow */}
          <path
            d={arcPath}
            fill="none"
            stroke="url(#arcCoreGrad)"
            strokeWidth="10"
            filter="url(#coreBlur)"
            opacity="0.95"
          />

          {/* Layer 4: Razor-Sharp Laser Filament Core */}
          <path
            d={arcPath}
            fill="none"
            stroke={colors.filament}
            strokeWidth="2.75"
            strokeLinecap="round"
            opacity="0.98"
          />

          {/* Layer 5: Animated Photon Pulse Beam traveling continuously */}
          <path
            d={arcPath}
            fill="none"
            stroke="url(#photonStreamGrad)"
            strokeWidth="5"
            strokeLinecap="round"
            className="animate-photon-stream"
          />
        </svg>
      </div>

      {/* 5. Drifting Celestial Particles / Micro-Embers along the Horizon */}
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            top: p.top,
            left: p.left,
            width: p.size,
            height: p.size,
            backgroundColor: colors.accent,
            boxShadow: `0 0 12px ${colors.secondary}, 0 0 4px #ffffff`,
            animation: `stardust-drift ${p.duration} ease-in-out infinite`,
            animationDelay: p.delay,
          }}
        />
      ))}

      {/* 6. Content Vignette & Readability Shields */}
      {/* Top soft vignette for navbar clarity */}
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#09090b]/90 via-[#09090b]/50 to-transparent pointer-events-none" />

      {/* Left-edge darkening to preserve heading contrast */}
      <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-[#09090b]/80 via-[#09090b]/40 to-transparent pointer-events-none" />

      {/* Bottom seamless fade into next sections */}
      <div className="absolute bottom-0 inset-x-0 h-44 bg-gradient-to-t from-[#09090b] via-[#09090b]/80 to-transparent pointer-events-none" />
    </div>
  );
}
