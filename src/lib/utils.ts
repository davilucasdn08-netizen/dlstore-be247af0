import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(priceStr?: string) {
  if (!priceStr) return "";
  // Resolve Brazilian formatting edge cases
  const cleanStr = priceStr.replace(/\./g, "").replace(",", ".");
  const num = parseFloat(cleanStr);
  if (isNaN(num)) return priceStr;
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
