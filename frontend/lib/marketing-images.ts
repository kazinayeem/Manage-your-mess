/** Marketing & UI screenshots in /public — used on landing, auth, OG, and mobile nav. */

export const MARKETING_COVER = "/cover.png";

export const MARKETING_SCREENSHOTS = [
  { src: "/1.png", alt: "BornoMess Manager dashboard overview" },
  { src: "/2.png", alt: "Meal tracking and daily meal entry" },
  { src: "/3.png", alt: "Expense and bazaar cost management" },
  { src: "/4.png", alt: "Member deposits and payment tracking" },
  { src: "/5.png", alt: "PDF reports and monthly summaries" },
  { src: "/6.png", alt: "Analytics center with charts" },
  { src: "/7.png", alt: "Bazaar assignment workflow" },
  { src: "/8.png", alt: "Mobile-first mess workspace" },
  { src: "/9.png", alt: "Member portal and notifications" },
] as const;

export const DASHBOARD_TAB_SCREENSHOTS: Record<string, string> = {
  dashboard: "/1.png",
  meals: "/2.png",
  expenses: "/3.png",
  deposits: "/4.png",
  reports: "/5.png",
  analytics: "/6.png",
};

export const HOW_IT_WORKS_SCREENSHOTS = [
  "/1.png",
  "/2.png",
  "/3.png",
  "/4.png",
  "/5.png",
  "/6.png",
] as const;

export const MOBILE_PREVIEW_SCREENSHOT = "/8.png";
