"use client";

import React from "react";

export interface GradientBlobCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  innerClassName?: string;
  blobClassName?: string;
  blobGradient?: string;
  standalone?: boolean;
}

const GradientBlobCard: React.FC<GradientBlobCardProps> = ({
  children,
  className = "",
  innerClassName = "",
  blobClassName = "",
  blobGradient = "from-pink-500 via-red-500 to-yellow-500",
  standalone = false,
  ...props
}) => {
  // If standalone or no children provided, render the default standalone demo card
  if (standalone || !children) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div
          className="relative w-[200px] h-[250px] rounded-[14px] flex flex-col items-center justify-center
                      shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff] dark:shadow-[20px_20px_60px_#111,-20px_-20px_60px_#222]
                      overflow-hidden"
        >
          {/* Glassy Background */}
          <div
            className="absolute top-[5px] left-[5px] w-[190px] h-[240px] bg-white/95 dark:bg-black/70 backdrop-blur-[24px]
                        rounded-[10px] outline outline-2 outline-white dark:outline-gray-700 z-10"
          />

          {/* Animated Gradient Blob (same bold colors for light & dark mode) */}
          <div
            className="absolute top-1/2 left-1/2 w-[150px] h-[150px] rounded-full opacity-100
                        filter blur-[12px] z-0 animate-blob 
                        bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500"
          />

          {/* Inline keyframes animation */}
          <style>
            {`
              @keyframes blob {
                0% {
                  transform: translate(-100%, -100%);
                }
                25% {
                  transform: translate(0%, -100%);
                }
                50% {
                  transform: translate(0%, 0%);
                }
                75% {
                  transform: translate(-100%, 0%);
                }
                100% {
                  transform: translate(-100%, -100%);
                }
              }

              .animate-blob {
                animation: blob 5s linear infinite;
              }
            `}
          </style>
        </div>
      </div>
    );
  }

  // When used to wrap cards across the app:
  return (
    <div
      className={`relative rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[20px_20px_60px_#09090b,-20px_-20px_60px_#18181b] border border-zinc-200 dark:border-white/10 group ${className}`}
      {...props}
    >
      {/* Animated Gradient Blob */}
      <div
        className={`absolute top-1/2 left-1/2 w-[220px] h-[220px] rounded-full opacity-100 filter blur-[14px] z-0 animate-blob pointer-events-none bg-gradient-to-r ${blobGradient} ${blobClassName}`}
      />

      {/* Glassy Background layer */}
      <div
        className={`absolute inset-[3px] bg-white/95 dark:bg-[#121214]/90 backdrop-blur-[24px] rounded-[inherit] outline outline-1 outline-zinc-200/80 dark:outline-gray-800/80 z-10 ${innerClassName}`}
      />

      {/* Card Content */}
      <div className="relative z-20 h-full w-full">
        {children}
      </div>

      <style>
        {`
          @keyframes blob {
            0% {
              transform: translate(-100%, -100%);
            }
            25% {
              transform: translate(0%, -100%);
            }
            50% {
              transform: translate(0%, 0%);
            }
            75% {
              transform: translate(-100%, 0%);
            }
            100% {
              transform: translate(-100%, -100%);
            }
          }

          .animate-blob {
            animation: blob 5s linear infinite;
          }
        `}
      </style>
    </div>
  );
};

export { GradientBlobCard };
export default GradientBlobCard;
