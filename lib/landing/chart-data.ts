export const MONTHS_BN = ["জান", "ফেব", "মার", "এপ্র", "মে", "জুন", "জুল", "আগ", "সেপ", "অক্ট", "নভ", "ডিস"];
export const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function getChartMonths(locale: string) {
  return locale === "bn" ? MONTHS_BN : MONTHS_EN;
}

export const expenseTrend = [
  { month: 0, value: 42000 },
  { month: 1, value: 38000 },
  { month: 2, value: 51000 },
  { month: 3, value: 47000 },
  { month: 4, value: 55000 },
  { month: 5, value: 49000 },
];

export const mealTrend = [
  { month: 0, breakfast: 120, lunch: 145, dinner: 138 },
  { month: 1, breakfast: 115, lunch: 150, dinner: 142 },
  { month: 2, breakfast: 128, lunch: 155, dinner: 148 },
  { month: 3, breakfast: 122, lunch: 148, dinner: 140 },
  { month: 4, breakfast: 130, lunch: 160, dinner: 152 },
  { month: 5, breakfast: 125, lunch: 158, dinner: 149 },
];

export const depositTrend = [
  { month: 0, value: 85000 },
  { month: 1, value: 92000 },
  { month: 2, value: 78000 },
  { month: 3, value: 105000 },
  { month: 4, value: 98000 },
  { month: 5, value: 112000 },
];

export const dueTrend = [
  { month: 0, value: 12000 },
  { month: 1, value: 9500 },
  { month: 2, value: 8000 },
  { month: 3, value: 6500 },
  { month: 4, value: 4200 },
  { month: 5, value: 2800 },
];

export const memberGrowth = [
  { month: 0, value: 18 },
  { month: 1, value: 22 },
  { month: 2, value: 25 },
  { month: 3, value: 28 },
  { month: 4, value: 32 },
  { month: 5, value: 36 },
];

export const utilityCost = [
  { name: "electricity", value: 8500 },
  { name: "gas", value: 3200 },
  { name: "water", value: 1800 },
  { name: "internet", value: 2500 },
];

export const healthScore = [
  { label: "collection", value: 88 },
  { label: "expenses", value: 76 },
  { label: "meals", value: 92 },
  { label: "deposits", value: 85 },
];
