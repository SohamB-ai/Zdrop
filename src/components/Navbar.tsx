"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, LogOut, Printer, QrCode, Store, UserRound } from "lucide-react";
import { ZDropLogo } from "./ZDropLogo";
import { ThemeToggle } from "./ThemeToggle";
import { ShopQrModal } from "./ShopQrModal";
import { useAuth } from "@/lib/auth-context";

interface NavbarProps {
  currentRole?: "student" | "kiosk";
  showSections?: boolean;
}

export function Navbar({
  currentRole = "student",
  showSections = true,
}: NavbarProps) {
  const { user, shop, logout } = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);
  const [posterOpen, setPosterOpen] = useState(false);
  const [error, setError] = useState("");
  const account = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!accountOpen) return;
    const dismiss = (event: PointerEvent) => {
      if (!account.current?.contains(event.target as Node))
        setAccountOpen(false);
    };
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAccountOpen(false);
        account.current?.querySelector("button")?.focus();
      }
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", keyboard);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", keyboard);
    };
  }, [accountOpen]);

  return (
    <header className="zd-header">
      <a className="zd-skip" href="#main-content">
        Skip to content
      </a>
      <nav className="zd-container zd-nav" aria-label="Primary navigation">
        <Link href="/" className="zd-brand" aria-label="ZDrop home">
          <ZDropLogo />
        </Link>
        {currentRole === "student" && showSections && (
          <div className="zd-nav-links">
            <a href="#how-it-works">How it works</a>
            <a href="#faq">Good to know</a>
          </div>
        )}
        <div className="zd-nav-actions">
          <div className="zd-nav-roles" aria-label="Choose your workspace">
            <Link
              href="/"
              aria-current={currentRole === "student" ? "page" : undefined}
            >
              Send files <ArrowUpRight size={14} />
            </Link>
            <Link
              href="/kiosk"
              aria-current={currentRole === "kiosk" ? "page" : undefined}
            >
              <Printer size={15} />
              Print shop
            </Link>
          </div>
          <ThemeToggle />

          {user ? (
            <div className="zd-account" ref={account}>
              <button
                type="button"
                className="zd-icon-button"
                aria-label="Your account"
                aria-expanded={accountOpen}
                aria-controls="account-options"
                onClick={() => setAccountOpen(!accountOpen)}
              >
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt={user.name || "User avatar"}
                    style={{ width: "22px", height: "22px", borderRadius: "50%" }}
                  />
                ) : (
                  <UserRound size={18} />
                )}
              </button>
              {accountOpen && (
                <div id="account-options" className="zd-account-menu" style={{ width: "260px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", paddingBottom: "8px", borderBottom: "1px solid var(--line)" }}>
                    <strong style={{ fontSize: "14px" }}>{user.name || user.email}</strong>
                    <small style={{ color: "var(--text-muted)", wordBreak: "break-all" }}>{user.email}</small>
                    <span
                      style={{
                        display: "inline-block",
                        marginTop: "4px",
                        fontSize: "10px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "var(--success)",
                        background: "var(--success-soft)",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        width: "fit-content",
                      }}
                    >
                      {shop ? "Shop Owner" : "Customer"}
                    </span>
                  </div>

                  {shop ? (
                    <div style={{ padding: "8px 0", borderBottom: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-primary)" }}>{shop.shopName}</span>
                      <span style={{ fontSize: "10px", fontFamily: "var(--font-jetbrains), monospace", color: "var(--text-muted)" }}>
                        CODE: {shop.shopCode}
                      </span>
                      {shop.pricing?.upiId && (
                        <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>
                          UPI: {shop.pricing.upiId}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setPosterOpen(true);
                          setAccountOpen(false);
                        }}
                        style={{ marginTop: "4px" }}
                      >
                        <QrCode size={15} />
                        Counter QR Standee
                      </button>
                      <Link
                        href="/kiosk"
                        onClick={() => setAccountOpen(false)}
                        className="zd-button zd-button--secondary"
                        style={{ fontSize: "12px", minHeight: "32px", padding: "4px 8px", justifyContent: "center" }}
                      >
                        <Printer size={14} />
                        <span>Open Print Counter</span>
                      </Link>
                    </div>
                  ) : (
                    <div style={{ padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
                      <Link
                        href="/shop/onboarding"
                        onClick={() => setAccountOpen(false)}
                        className="zd-button zd-button--secondary w-full"
                        style={{ fontSize: "11px", minHeight: "32px", padding: "4px 8px" }}
                      >
                        <Store size={14} />
                        <span>Register as Print Shop</span>
                      </Link>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await logout();
                        setAccountOpen(false);
                      } catch {
                        setError("Could not sign out. Please try again.");
                      }
                    }}
                    style={{ color: "var(--danger)", marginTop: "4px" }}
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                  {error && <p role="alert" style={{ color: "var(--danger)", fontSize: "11px", margin: "4px 0 0" }}>{error}</p>}
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/sign-in"
              className="zd-button zd-button--secondary"
              style={{ fontSize: "12px", minHeight: "34px", padding: "4px 12px" }}
            >
              Sign In
            </Link>
          )}
        </div>
      </nav>

      {shop && (
        <ShopQrModal
          shop={shop}
          isOpen={posterOpen}
          onClose={() => setPosterOpen(false)}
        />
      )}
    </header>
  );
}
