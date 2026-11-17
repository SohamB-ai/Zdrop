"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/landing/Footer";
import {
  Store,
  QrCode,
  DollarSign,
  Phone,
  MapPin,
  Tag,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";

export default function ShopOnboardingPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded, user: clerkUser } = useUser();
  const { shop, refreshShop } = useAuth();

  const [shopName, setShopName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [campusAddress, setCampusAddress] = useState("");
  const [shopCode, setShopCode] = useState("");
  const [upiId, setUpiId] = useState("");
  const [payeeName, setPayeeName] = useState("");
  const [bwRate, setBwRate] = useState<number>(2.0);
  const [colorRate, setColorRate] = useState<number>(10.0);
  const [duplexDiscount, setDuplexDiscount] = useState<number>(0.0);
  const [currencySymbol, setCurrencySymbol] = useState("₹");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in?redirect_url=/shop/onboarding");
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (clerkUser) {
      if (clerkUser.fullName) setOwnerName(clerkUser.fullName);
      if (!shopCode) {
        const auto = clerkUser.firstName
          ? `${clerkUser.firstName.toUpperCase().slice(0, 4)}${Math.floor(10 + Math.random() * 90)}`
          : `SHOP${Math.floor(100 + Math.random() * 900)}`;
        setShopCode(auto);
      }
    }
  }, [clerkUser, shopCode]);

  useEffect(() => {
    if (shop) {
      router.push("/kiosk");
    }
  }, [shop, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    const cleanUpi = upiId.trim();
    if (!cleanUpi.includes("@") || cleanUpi.length < 5) {
      setErrorMessage("Please enter a valid UPI ID (e.g. shopname@okaxis, 9876543210@paytm).");
      return;
    }

    const cleanCode = shopCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    if (cleanCode.length < 3) {
      setErrorMessage("Shop Code must be at least 3 characters (e.g. CAMPUS1).");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/shops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopName: shopName.trim(),
          ownerName: ownerName.trim() || clerkUser?.fullName || "Operator",
          phone: phone.trim(),
          campusAddress: campusAddress.trim(),
          shopCode: cleanCode,
          pricing: {
            bwRate: Number(bwRate) || 2,
            colorRate: Number(colorRate) || 10,
            duplexDiscount: Number(duplexDiscount) || 0,
            currencySymbol: currencySymbol.trim() || "₹",
            upiId: cleanUpi,
            payeeName: payeeName.trim() || shopName.trim(),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create shop account.");
      }

      setSuccess(true);
      await refreshShop();
      setTimeout(() => {
        router.push("/kiosk");
      }, 1000);
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="zd-app min-h-screen flex items-center justify-center">
        <p className="text-xs text-slate-500">Checking authentication…</p>
      </div>
    );
  }

  return (
    <div className="zd-app">
      <Navbar currentRole="kiosk" showSections={false} />

      <main id="main-content" className="zd-main py-10 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <header className="zd-kiosk-hero">
            <p className="zd-eyebrow">
              <span className="zd-dot" aria-hidden="true" />
              Operator Setup
            </p>
            <h1>Register Your Print Shop</h1>
            <p>
              Set up your shop details, per-page rates, and UPI VPA so students can hand off files anonymously and pay your counter directly.
            </p>
          </header>

          {/* Authenticated Clerk / Google User Banner */}
          <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/70 dark:bg-blue-950/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold overflow-hidden shrink-0">
                {clerkUser?.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={clerkUser.imageUrl} alt="" className="w-10 h-10 object-cover" />
                ) : (
                  clerkUser?.firstName?.charAt(0) || "U"
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-blue-950 dark:text-blue-200">
                    Authenticated Print Shop Owner
                  </span>
                  <span className="text-[10px] bg-blue-200/80 dark:bg-blue-800/80 text-blue-900 dark:text-blue-100 px-1.5 py-0.5 rounded font-medium">
                    Google / Clerk
                  </span>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                  Logged in as <strong>{clerkUser?.primaryEmailAddress?.emailAddress}</strong> ({clerkUser?.fullName || "Operator"})
                </p>
              </div>
            </div>
          </div>

          {errorMessage && (
            <div role="alert" className="zd-alert-danger">
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          {success && (
            <div role="alert" className="zd-alert-success">
              <CheckCircle2 size={18} />
              <span>Shop registered successfully! Opening Print Counter…</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="zd-card-panel space-y-6">
            {/* 1. Identity & Contact */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2" style={{ borderBottom: "1px solid var(--line)" }}>
                <Store size={18} style={{ color: "var(--accent)" }} />
                <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                  1. Shop Profile & Location
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="zd-field">
                  <label htmlFor="shop-name">Shop Name *</label>
                  <input
                    id="shop-name"
                    className="zd-input"
                    placeholder="e.g. Campus Xerox & Prints"
                    required
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                  />
                </div>

                <div className="zd-field">
                  <label htmlFor="owner-name">Owner / Operator Name *</label>
                  <input
                    id="owner-name"
                    className="zd-input"
                    placeholder="e.g. Ramesh Sharma"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                  />
                </div>

                <div className="zd-field">
                  <label htmlFor="phone">Contact Phone *</label>
                  <input
                    id="phone"
                    type="tel"
                    className="zd-input"
                    placeholder="e.g. +91 9876543210"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="zd-field">
                  <label htmlFor="shop-code">
                    <span>Unique Counter Code *</span>
                    <small style={{ color: "var(--text-muted)", marginLeft: "4px" }}>(used in posters)</small>
                  </label>
                  <input
                    id="shop-code"
                    className="zd-input"
                    placeholder="e.g. CAMPUS1"
                    maxLength={10}
                    required
                    value={shopCode}
                    onChange={(e) => setShopCode(e.target.value.toUpperCase())}
                  />
                </div>
              </div>

              <div className="zd-field">
                <label htmlFor="address">Campus Address / Location *</label>
                <input
                  id="address"
                  className="zd-input"
                  placeholder="e.g. Ground Floor, Central Library, Engineering Campus"
                  required
                  value={campusAddress}
                  onChange={(e) => setCampusAddress(e.target.value)}
                />
              </div>
            </div>

            {/* 2. UPI Payment Setup */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-2 pb-2" style={{ borderBottom: "1px solid var(--line)" }}>
                <QrCode size={18} style={{ color: "var(--accent)" }} />
                <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                  2. UPI Settlement Setup (Direct Instant Bank Payments)
                </h3>
              </div>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                When a student gives you their 6-digit OTP at your counter, accepting it on your printer counter will immediately generate a dynamic QR code on their phone with your verified UPI ID and exact bill amount. Students pay your counter directly with zero commission.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="zd-field">
                  <label htmlFor="upi-id">Shop UPI VPA / Handle *</label>
                  <input
                    id="upi-id"
                    className="zd-input"
                    placeholder="e.g. rameshxerox@okaxis"
                    required
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                  />
                </div>

                <div className="zd-field">
                  <label htmlFor="payee-name">Registered Payee Name</label>
                  <input
                    id="payee-name"
                    className="zd-input"
                    placeholder="e.g. Ramesh Prints (optional)"
                    value={payeeName}
                    onChange={(e) => setPayeeName(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* 3. Base Pricing Rates */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-2 pb-2" style={{ borderBottom: "1px solid var(--line)" }}>
                <DollarSign size={18} style={{ color: "var(--accent)" }} />
                <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                  3. Print Pricing Rates
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="zd-field">
                  <label htmlFor="currency">Currency</label>
                  <input
                    id="currency"
                    className="zd-input"
                    maxLength={4}
                    value={currencySymbol}
                    onChange={(e) => setCurrencySymbol(e.target.value)}
                    required
                  />
                </div>

                <div className="zd-field">
                  <label htmlFor="bw-rate">B&W / Page</label>
                  <input
                    id="bw-rate"
                    type="number"
                    step="0.5"
                    min="0.1"
                    className="zd-input"
                    value={bwRate}
                    onChange={(e) => setBwRate(parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>

                <div className="zd-field">
                  <label htmlFor="color-rate">Color / Page</label>
                  <input
                    id="color-rate"
                    type="number"
                    step="0.5"
                    min="0.5"
                    className="zd-input"
                    value={colorRate}
                    onChange={(e) => setColorRate(parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>

                <div className="zd-field">
                  <label htmlFor="duplex-disc">Duplex Disc.</label>
                  <input
                    id="duplex-disc"
                    type="number"
                    step="0.25"
                    min="0"
                    className="zd-input"
                    value={duplexDiscount}
                    onChange={(e) => setDuplexDiscount(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="zd-button zd-button--primary w-full"
                style={{ height: "46px" }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Saving Shop Account…</span>
                  </>
                ) : (
                  <>
                    <span>Complete Setup & Open Print Counter</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
