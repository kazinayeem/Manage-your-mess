import type { BillCategoryType } from "@prisma/client";

export const BILL_CATEGORIES: { value: BillCategoryType; label: string; group: "rent" | "utility" | "service" | "other" }[] = [
  { value: "HOUSE_RENT", label: "House Rent", group: "rent" },
  { value: "ELECTRICITY", label: "Electricity Bill", group: "utility" },
  { value: "WATER", label: "Water Bill", group: "utility" },
  { value: "GAS", label: "Gas Bill", group: "utility" },
  { value: "INTERNET", label: "Internet Bill", group: "utility" },
  { value: "CLEANER_SALARY", label: "Cleaner Salary", group: "service" },
  { value: "SECURITY_GUARD", label: "Security Guard", group: "service" },
  { value: "GENERATOR", label: "Generator Cost", group: "utility" },
  { value: "MAINTENANCE", label: "Maintenance Cost", group: "service" },
  { value: "GARBAGE", label: "Garbage Collection", group: "service" },
  { value: "PARKING", label: "Parking Fee", group: "other" },
  { value: "SERVICE_CHARGE", label: "Service Charge", group: "other" },
  { value: "FURNITURE_REPAIR", label: "Furniture Repair", group: "other" },
  { value: "EMERGENCY", label: "Emergency Expense", group: "other" },
  { value: "OTHER", label: "Other Shared Cost", group: "other" },
];

export function getBillCategoryLabel(category: BillCategoryType): string {
  return BILL_CATEGORIES.find((c) => c.value === category)?.label ?? category;
}

export function isRentCategory(category: BillCategoryType): boolean {
  return category === "HOUSE_RENT";
}

export function isUtilityCategory(category: BillCategoryType): boolean {
  return ["ELECTRICITY", "WATER", "GAS", "INTERNET", "GENERATOR"].includes(category);
}

export type BillShareBreakdown = {
  rent: number;
  electricity: number;
  water: number;
  gas: number;
  internet: number;
  maintenance: number;
  other: number;
  total: number;
};

export function emptyBillBreakdown(): BillShareBreakdown {
  return { rent: 0, electricity: 0, water: 0, gas: 0, internet: 0, maintenance: 0, other: 0, total: 0 };
}

export function addToBillBreakdown(
  breakdown: BillShareBreakdown,
  category: BillCategoryType,
  amount: number
): BillShareBreakdown {
  const next = { ...breakdown };
  switch (category) {
    case "HOUSE_RENT":
      next.rent += amount;
      break;
    case "ELECTRICITY":
      next.electricity += amount;
      break;
    case "WATER":
      next.water += amount;
      break;
    case "GAS":
      next.gas += amount;
      break;
    case "INTERNET":
    case "GENERATOR":
      next.internet += amount;
      break;
    case "MAINTENANCE":
    case "CLEANER_SALARY":
    case "SECURITY_GUARD":
    case "GARBAGE":
      next.maintenance += amount;
      break;
    default:
      next.other += amount;
  }
  next.total = next.rent + next.electricity + next.water + next.gas + next.internet + next.maintenance + next.other;
  return next;
}
