import { FileMetadata, PrintPreferences, ShopPricing, CostEstimate } from "./types";

export const DEFAULT_PRICING: ShopPricing = {
  bwRate: 2,           // ₹2 per page for B&W
  colorRate: 10,       // ₹10 per page for Color
  duplexDiscount: 0,   // ₹0 discount per sheet for duplex
  currencySymbol: "₹",
  upiId: "",
};

/**
 * Parses a page range string (e.g. "1-5, 8, 10-12") against document total pages.
 */
function selectPages(pageRange: string, documentPages: number): Set<number> | null {
  if (!pageRange || pageRange.trim().toUpperCase() === "ALL") {
    return null;
  }

  const parts = pageRange.split(",");
  const uniquePages = new Set<number>();

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if (trimmed.includes("-")) {
      const [startStr, endStr] = trimmed.split("-").map((s) => s.trim());
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end) && start > 0) {
        const from = Math.min(start, end);
        const to = Math.min(Math.max(start, end), documentPages > 0 ? documentPages : 9999);
        for (let p = from; p <= to; p++) {
          uniquePages.add(p);
        }
      }
    } else {
      const p = parseInt(trimmed, 10);
      if (!isNaN(p) && p > 0 && (documentPages <= 0 || p <= documentPages)) {
        uniquePages.add(p);
      }
    }
  }

  return uniquePages.size ? uniquePages : null;
}

/**
 * Calculates complete, accurate print cost and itemized breakdown.
 */
export function calculatePrintCost(
  files: FileMetadata[],
  preferences: PrintPreferences,
  customPricing?: Partial<ShopPricing> | null
): CostEstimate {
  const pricing: ShopPricing = {
    ...DEFAULT_PRICING,
    ...(customPricing || {}),
  };

  // 1. Calculate raw document page count across all files
  const rawDocPages = files.reduce((acc, file) => {
    return acc + (file.pageCount && file.pageCount > 0 ? file.pageCount : 1);
  }, 0);

  // 2. Adjust for custom page ranges
  const selectedPages = selectPages(preferences.pageRange, Math.max(1, rawDocPages));
  const effectivePagesPerCopy = selectedPages?.size ?? Math.max(1, rawDocPages);

  // 3. Multiplied by number of copies
  const copies = Math.max(1, preferences.copies || 1);
  const totalPages = effectivePagesPerCopy * copies;

  // 4. Rate per page based on Color Mode (BW, COLOR, or AUTO Smart Color Saver)
  const colorPageNumbers: number[] = [];
  let pageOffset = 0;
  for (const file of files) {
    const colorPages = file.colorPages ?? (file.type?.startsWith("image/") ? [1] : []);
    for (const page of colorPages) {
      const documentPage = pageOffset + page;
      if (!selectedPages || selectedPages.has(documentPage)) colorPageNumbers.push(documentPage);
    }
    pageOffset += file.pageCount || 1;
  }
  const detectedColorPages = colorPageNumbers.length;

  const isAuto = preferences.colorMode === "AUTO";
  const isForcedColor = preferences.colorMode === "COLOR";

  let ratePerPage = pricing.bwRate;
  let subtotal = 0;
  let colorPagesCount = 0;
  let bwPagesCount = 0;
  let savingsVsFullColor = 0;
  let colorPagesList: string | undefined;

  const sym = pricing.currencySymbol || "₹";
  const sidesLabel = preferences.sides === "DOUBLE" ? " · 2-Sided" : "";

  if (isForcedColor) {
    ratePerPage = pricing.colorRate;
    colorPagesCount = totalPages;
    bwPagesCount = 0;
    subtotal = Math.round(totalPages * ratePerPage * 100) / 100;
  } else if (isAuto) {
    if (detectedColorPages > 0) {
      const colorPerCopy = Math.min(effectivePagesPerCopy, detectedColorPages);
      const bwPerCopy = Math.max(0, effectivePagesPerCopy - colorPerCopy);

      colorPagesCount = colorPerCopy * copies;
      bwPagesCount = bwPerCopy * copies;

      const colorCost = colorPagesCount * pricing.colorRate;
      const bwCost = bwPagesCount * pricing.bwRate;
      subtotal = Math.round((colorCost + bwCost) * 100) / 100;

      const fullColorCost = totalPages * pricing.colorRate;
      savingsVsFullColor = Math.max(0, Math.round((fullColorCost - subtotal) * 100) / 100);
      ratePerPage = pricing.colorRate;

      if (colorPageNumbers.length > 0) {
        colorPagesList = Array.from(new Set(colorPageNumbers)).sort((a, b) => a - b).join(", ");
      }
    } else {
      // Document is pure monochrome text or not analyzed yet
      ratePerPage = pricing.bwRate;
      bwPagesCount = totalPages;
      colorPagesCount = 0;
      subtotal = Math.round(totalPages * ratePerPage * 100) / 100;
    }
  } else {
    // Forced B&W
    ratePerPage = pricing.bwRate;
    bwPagesCount = totalPages;
    colorPagesCount = 0;
    subtotal = Math.round(totalPages * ratePerPage * 100) / 100;
  }

  // 5. Duplex savings (if double-sided discount is configured)
  let discount = 0;
  if (preferences.sides === "DOUBLE" && pricing.duplexDiscount > 0) {
    const physicalSheets = Math.ceil(effectivePagesPerCopy / 2) * copies;
    discount = Math.min(subtotal - 1, physicalSheets * pricing.duplexDiscount);
    discount = Math.round(discount * 100) / 100;
  }

  const totalAmount = Math.max(1, Math.round((subtotal - discount) * 100) / 100);

  let formula = "";
  if (isAuto && colorPagesCount > 0 && bwPagesCount > 0) {
    formula = `${colorPagesCount} Color (@ ${sym}${pricing.colorRate}) + ${bwPagesCount} B&W (@ ${sym}${pricing.bwRate})${sidesLabel}`;
    if (savingsVsFullColor > 0) {
      formula += ` · Saved ${sym}${savingsVsFullColor.toFixed(2)}!`;
    }
  } else if (isAuto && colorPagesCount > 0) {
    formula = `${totalPages} Color pages @ ${sym}${pricing.colorRate.toFixed(2)} (Smart Color)${sidesLabel}`;
  } else if (isAuto) {
    formula = `${totalPages} pages B&W @ ${sym}${pricing.bwRate.toFixed(2)} (All Text Detected)${sidesLabel}`;
  } else {
    const modeLabel = isForcedColor ? "Color" : "B&W";
    formula = `${effectivePagesPerCopy} ${
      effectivePagesPerCopy === 1 ? "page" : "pages"
    } × ${copies} ${copies === 1 ? "copy" : "copies"} @ ${sym}${ratePerPage.toFixed(
      2
    )} (${modeLabel}${sidesLabel})`;
  }

  return {
    totalPages,
    copies,
    ratePerPage,
    colorPagesCount,
    bwPagesCount,
    savingsVsFullColor,
    colorPagesList,
    subtotal,
    discount,
    totalAmount,
    currencySymbol: sym,
    formula,
    upiId: pricing.upiId || "",
    payeeName: pricing.payeeName || "",
  };
}

/**
 * Generates an official UPI Payment URL (supported by GPay, PhonePe, Paytm, BHIM, etc.)
 */
export function generateUpiUrl({
  upiId,
  payeeName = "ZDrop Print",
  amount,
  accessCode,
  currency = "INR",
}: {
  upiId: string;
  payeeName?: string;
  amount: number;
  accessCode?: string;
  currency?: string;
}): string {
  const cleanUpi = upiId.trim();
  if (!cleanUpi) return "";

  const note = accessCode ? `ZDrop Print #${accessCode}` : "ZDrop Document Print";

  return `upi://pay?pa=${encodeURIComponent(cleanUpi)}&pn=${encodeURIComponent(
    payeeName
  )}&am=${amount.toFixed(2)}&cu=${encodeURIComponent(currency)}&tn=${encodeURIComponent(
    note
  )}`;
}
