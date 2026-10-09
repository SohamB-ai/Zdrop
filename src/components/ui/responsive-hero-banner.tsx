"use client";

import React, { useState, useEffect } from "react";
import { ArrowUpRight, ArrowRight, Play, Menu, X } from "lucide-react";
import { useLenis } from "lenis/react";
import { ZDropLogo } from "@/components/ZDropLogo";

interface NavLink {
  label: string;
  href: string;
  isActive?: boolean;
}

interface Partner {
  logoUrl: string;
  href: string;
  name?: string;
}

interface ResponsiveHeroBannerProps {
  logoUrl?: string;
  backgroundImageUrl?: string;
  customBackground?: React.ReactNode;
  navLinks?: NavLink[];
  ctaButtonText?: string;
  ctaButtonHref?: string;
  badgeText?: string;
  badgeLabel?: string;
  title?: string;
  titleLine2?: string;
  description?: string;
  primaryButtonText?: string;
  primaryButtonHref?: string;
  secondaryButtonText?: string;
  secondaryButtonHref?: string;
  partnersTitle?: string;
  partners?: Partner[];
  children?: React.ReactNode;
}

const ResponsiveHeroBanner: React.FC<ResponsiveHeroBannerProps> = ({
  logoUrl,
  backgroundImageUrl,
  customBackground,
  navLinks = [
    { label: "Home", href: "#" },
    { label: "Why ZDrop", href: "#why-zdrop" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "FAQ", href: "#faq" },
    { label: "Drop Files", href: "#upload" },
  ],
  ctaButtonText = "Operator Kiosk",
  ctaButtonHref = "/kiosk",
  badgeLabel = "Zero-Trace",
  badgeText = "Instant Campus Document Printing",
  title = "Drop it. Print it. Done.",
  titleLine2 = "Zero WhatsApp. Zero USBs.",
  description = "Print campus documents in 10 seconds flat. Drop files on your phone, select print options in two taps, and hand a 6-digit PIN across the counter. No WhatsApp downloads, no flash drives, zero file leaks.",
  primaryButtonText = "Drop Files Below",
  primaryButtonHref = "#upload",
  secondaryButtonText = "Operator Kiosk",
  secondaryButtonHref = "/kiosk",
  partnersTitle = "Trusted across university xerox counters and campus copy centers",
  partners = [
    {
      name: "Library Copy Center",
      logoUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=200&auto=format&fit=crop",
      href: "#",
    },
    {
      name: "Campus Print Hub",
      logoUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=200&auto=format&fit=crop",
      href: "#",
    },
    {
      name: "Student Union Xerox",
      logoUrl: "https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=200&auto=format&fit=crop",
      href: "#",
    },
    {
      name: "Engineering Lab Printers",
      logoUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=200&auto=format&fit=crop",
      href: "#",
    },
    {
      name: "Autonomous Xerox Hub",
      logoUrl: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=200&auto=format&fit=crop",
      href: "#",
    },
  ],
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeHref, setActiveHref] = useState("#");
  const lenis = useLenis();

  // Scrollspy to automatically reflect current section in navbar
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 140;
      if (window.scrollY < 200) {
        setActiveHref("#");
        return;
      }
      const sections = ["upload", "why-zdrop", "how-it-works", "faq"];
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveHref(`#${id}`);
            return;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith("#") && href !== "") return;
    e.preventDefault();
    setMobileMenuOpen(false);
    setActiveHref(href);

    if (href === "#" || href === "#top" || href === "") {
      if (lenis) {
        lenis.scrollTo(0, { duration: 1.2 });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      window.history.pushState(null, "", window.location.pathname);
      return;
    }

    const targetEl = document.querySelector(href);
    if (targetEl) {
      if (lenis) {
        lenis.scrollTo(targetEl as HTMLElement, { offset: -80, duration: 1.2 });
      } else {
        targetEl.scrollIntoView({ behavior: "smooth" });
      }
      window.history.pushState(null, "", href);
    }
  };

  return (
    <section className="w-full isolate min-h-screen overflow-hidden relative bg-transparent">
      {/* Background layer */}
      {customBackground ? (
        customBackground
      ) : backgroundImageUrl ? (
        <>
          <img
            src={backgroundImageUrl}
            alt=""
            className="w-full h-full object-cover absolute top-0 right-0 bottom-0 left-0 opacity-25 filter contrast-125 brightness-90 pointer-events-none"
          />
          <div className="pointer-events-none absolute inset-0 ring-1 ring-black/30 bg-gradient-to-b from-[#09090b]/80 via-[#09090b]/90 to-[#09090b]" />
        </>
      ) : null}

      {/* Fixed Sticky Header Navbar */}
      <header className="fixed top-0 inset-x-0 z-50 bg-[#09090b]/85 backdrop-blur-xl border-b border-white/10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-3">
            <a
              href="#"
              onClick={(e) => handleNavClick(e, "#")}
              className="inline-flex items-center gap-2 select-none"
              aria-label="Back to top"
            >
              {logoUrl ? (
                <span
                  className="inline-flex items-center justify-center bg-center w-[100px] h-[40px] bg-cover rounded"
                  style={{ backgroundImage: `url(${logoUrl})` }}
                />
              ) : (
                <ZDropLogo size="md" showText={true} />
              )}
            </a>

            <nav className="hidden md:flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-full bg-white/5 px-2 py-1 ring-1 ring-white/10 backdrop-blur">
                {navLinks.map((link, index) => {
                  const isCurrent = activeHref === link.href || (link.href === "#" && activeHref === "#");
                  return (
                    <a
                      key={index}
                      href={link.href}
                      onClick={(e) => handleNavClick(e, link.href)}
                      className={`px-3 py-1.5 text-xs font-semibold font-sans transition-all duration-200 rounded-full cursor-pointer ${
                        isCurrent
                          ? "text-emerald-400 bg-emerald-500/15 shadow-[0_0_12px_rgba(34,197,94,0.2)]"
                          : "text-zinc-300 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {link.label}
                    </a>
                  );
                })}
                <a
                  href={ctaButtonHref}
                  className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-3.5 py-1.5 text-xs font-bold font-sans transition-all active:scale-95 shadow-[0_0_16px_rgba(34,197,94,0.35)]"
                >
                  <span>{ctaButtonText}</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </nav>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15 backdrop-blur text-white/90 cursor-pointer"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>

          {/* Mobile drawer dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-2 mb-4 p-4 rounded-2xl bg-[#121214]/95 border border-white/10 backdrop-blur-2xl shadow-2xl space-y-2 animate-fade-slide-in-1">
              {navLinks.map((link, idx) => {
                const isCurrent = activeHref === link.href;
                return (
                  <a
                    key={idx}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className={`block px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                      isCurrent
                        ? "text-emerald-400 bg-emerald-950/40"
                        : "text-zinc-300 hover:bg-white/5"
                    }`}
                  >
                    {link.label}
                  </a>
                );
              })}
              <a
                href={ctaButtonHref}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 text-sm font-bold text-zinc-950 bg-emerald-500 rounded-xl"
              >
                <span>{ctaButtonText}</span>
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          )}
        </div>
      </header>

      {/* Main hero fold */}
      <div className="z-10 relative pt-16 sm:pt-20">
        <div className="sm:pt-20 md:pt-24 lg:pt-28 max-w-7xl mx-auto pt-16 px-4 sm:px-6 pb-16">
          <div className="mx-auto max-w-3xl text-center">
            {/* Pill Badge */}
            <div className="mb-6 inline-flex items-center gap-3 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/15 backdrop-blur animate-fade-slide-in-1">
              <span className="inline-flex items-center text-xs font-bold text-zinc-950 bg-emerald-400 rounded-full py-0.5 px-2.5 font-sans">
                {badgeLabel}
              </span>
              <span className="text-sm font-medium text-emerald-200 font-sans">
                {badgeText}
              </span>
            </div>

            {/* Instrument Serif Display Headline */}
            <h1 className="sm:text-5xl md:text-6xl lg:text-7xl leading-[1.08] text-4xl text-white tracking-tight font-instrument-serif font-normal animate-fade-slide-in-2">
              {title}
              <br className="hidden sm:block" />
              <span className="text-emerald-400 italic block sm:inline mt-1 sm:mt-0 font-instrument-serif">
                {" "}{titleLine2}
              </span>
            </h1>

            {/* Description Copy */}
            <p className="sm:text-lg animate-fade-slide-in-3 text-base text-zinc-300 max-w-2xl mt-6 mx-auto font-sans leading-relaxed">
              {description}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:gap-4 mt-8 gap-3 items-center justify-center animate-fade-slide-in-4">
              <a
                href={primaryButtonHref}
                onClick={(e) => handleNavClick(e, primaryButtonHref)}
                className="inline-flex items-center gap-2 text-sm font-bold text-zinc-950 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-400 hover:to-green-400 rounded-full py-3.5 px-6 font-sans transition-all active:scale-95 shadow-[0_0_24px_rgba(34,197,94,0.35)] cursor-pointer"
              >
                <span>{primaryButtonText}</span>
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href={secondaryButtonHref}
                className="inline-flex items-center gap-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 px-6 py-3.5 text-sm font-medium text-white font-sans transition-all active:scale-95"
              >
                <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                <span>{secondaryButtonText}</span>
              </a>
            </div>
          </div>

          {/* Optional Children Slot (e.g. Interactive Print Terminal) */}
          {children && (
            <div className="mt-12 max-w-3xl mx-auto animate-fade-slide-in-4" id="upload">
              {children}
            </div>
          )}

          {/* Partners / Campus Trust Agencies */}
          <div className="mx-auto mt-20 max-w-5xl">
            <p className="animate-fade-slide-in-1 text-xs uppercase tracking-wider text-zinc-400 text-center font-mono">
              {partnersTitle}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 animate-fade-slide-in-2 text-zinc-400 mt-6 items-center justify-items-center gap-4">
              {partners.map((partner, index) => (
                <a
                  key={index}
                  href={partner.href}
                  title={partner.name || "Campus Print Partner"}
                  className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-emerald-500/30 text-xs text-zinc-300 font-sans transition-all"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="truncate max-w-[120px]">{partner.name || `Partner ${index + 1}`}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResponsiveHeroBanner;
