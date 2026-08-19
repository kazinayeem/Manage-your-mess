import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Stable currency formatting — avoids Intl currency hydration mismatches between Node and browser. */
export function formatCurrency(amount: number, currency = "BDT") {
  const hasDecimals = Math.round(amount * 100) % 100 !== 0;
  const formatted = amount.toLocaleString("en-US", {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
  });
  const symbols: Record<string, string> = { BDT: "৳", USD: "$", EUR: "€" };
  const symbol = symbols[currency] ?? `${currency} `;
  return `${symbol}${formatted}`;
}

export function formatDate(date: Date | string, locale = "en") {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function calculateMealRate(totalExpense: number, totalMeals: number) {
  if (totalMeals <= 0) return 0;
  return totalExpense / totalMeals;
}

export function calculateMemberCost(mealCount: number, mealRate: number) {
  return mealCount * mealRate;
}
