import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(priceStr?: string): string {
  if (!priceStr) return "";

  let p = priceStr.trim().replace(/[R$\s\u00a0]/g, "");
  if (!p) return "";

  // Brazilian format with thousands separator: "1.299,90" or "299,90"
  // The dot is thousands separator, comma is decimal
  if (p.includes(",")) {
    // Remove thousands dots, replace decimal comma with dot
    const normalized = p.replace(/\./g, "").replace(",", ".");
    const num = parseFloat(normalized);
    if (!isNaN(num)) {
      return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
  }

  // US format with dot decimal: "299.99"
  if (p.includes(".") && !p.includes(",")) {
    const num = parseFloat(p);
    if (!isNaN(num)) {
      return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
  }

  // Plain integer
  const num = parseFloat(p.replace(/[^\d]/g, ""));
  if (!isNaN(num)) {
    return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return p;
}

