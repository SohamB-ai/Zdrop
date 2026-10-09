"use client";

import React, { useEffect, useCallback } from "react";
import { ReactLenis, useLenis } from "lenis/react";
import "lenis/dist/lenis.css";

interface SmoothScrollProps {
  children: React.ReactNode;
}

export function useSmoothScrollTo() {
  const lenis = useLenis();

  const scrollTo = useCallback(
    (target: string | number, offset = -80) => {
      if (typeof target === "number" || target === "#" || target === "#top" || target === "") {
        if (lenis) {
          lenis.scrollTo(0, { duration: 1.2 });
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        return;
      }

      const selector = target.startsWith("#") ? target : `#${target}`;
      const element = document.querySelector(selector);
      if (element) {
        if (lenis) {
          lenis.scrollTo(element as HTMLElement, { offset, duration: 1.2 });
        } else {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }
    },
    [lenis]
  );

  return scrollTo;
}

function LenisAnchorHandler() {
  const lenis = useLenis();

  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement)?.closest("a");
      const button = (e.target as HTMLElement)?.closest("[data-scroll-to]");

      let targetId: string | null = null;

      if (button) {
        targetId = button.getAttribute("data-scroll-to");
      } else if (anchor) {
        const href = anchor.getAttribute("href");
        if (href && (href === "#" || href.startsWith("#"))) {
          targetId = href;
        }
      }

      if (!targetId) return;

      e.preventDefault();

      if (targetId === "#" || targetId === "#top" || targetId === "top") {
        if (lenis) {
          lenis.scrollTo(0, { duration: 1.2 });
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        window.history.pushState(null, "", window.location.pathname);
        return;
      }

      const selector = targetId.startsWith("#") ? targetId : `#${targetId}`;
      const element = document.querySelector(selector);
      if (element) {
        if (lenis) {
          lenis.scrollTo(element as HTMLElement, { offset: -80, duration: 1.2 });
        } else {
          element.scrollIntoView({ behavior: "smooth" });
        }
        window.history.pushState(null, "", selector);
      }
    };

    document.addEventListener("click", handleAnchorClick);
    return () => document.removeEventListener("click", handleAnchorClick);
  }, [lenis]);

  return null;
}

export function SmoothScroll({ children }: SmoothScrollProps) {
  return (
    <ReactLenis
      root
      options={{
        lerp: 0.1,
        duration: 0.8,
        smoothWheel: true,
        wheelMultiplier: 1.0,
        touchMultiplier: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      }}
    >
      <LenisAnchorHandler />
      {children}
    </ReactLenis>
  );
}
