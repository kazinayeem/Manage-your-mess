export const REPORT_TYPES = [
  "monthly",
  "balance_sheet",
  "member",
  "meal",
  "expense",
  "deposit",
  "daily",
  "weekly",
  "yearly",
  "rent",
  "utility",
  "shared_expense",
  "bill_settlement",
  "due",
  "bazaar",
  "transaction",
] as const;

export type ReportType = (typeof REPORT_TYPES)[number];

export type ReportCurrency = "BDT" | "USD" | "EUR";

export type ReportColumn = {
  key: string;
  label: string;
  format?: "currency" | "number" | "text" | "portion";
  align?: "left" | "right" | "center";
};

export type ReportAnalytics = {
  expenseBreakdown?: { label: string; amount: number }[];
  mealBreakdown?: { breakfast: number; lunch: number; dinner: number; guestMeals?: number };
  depositStats?: { total: number; highest?: string; lowest?: string; pending?: number };
  dueStats?: { membersWithDue: number; totalDue: number; highest?: string };
};

export type ReportSection = {
  key: string;
  title: string;
  columns: ReportColumn[];
  rows: Record<string, string | number>[];
  emptyMessage?: string;
};

export type ReportPayload = {
  meta: {
    messName: string;
    messAddress?: string | null;
    reportType: ReportType;
    reportTitle: string;
    periodLabel: string;
    monthLabel: string;
    generatedAt: string;
    generatedBy?: string;
    reportId?: string;
    currency?: ReportCurrency;
    language?: string;
    dateRangeLabel?: string;
  };
  summary: { label: string; value: string }[];
  columns: ReportColumn[];
  rows: Record<string, string | number>[];
  sections?: ReportSection[];
  emptyState?: {
    title: string;
    description: string;
  };
  analytics?: ReportAnalytics;
};

export type MonthOption = {
  id: string;
  label: string;
  year: number;
  month: number;
  status: string;
};

export type ReportFetchOptions = {
  date?: string;
  dateRangeStart?: string;
  dateRangeEnd?: string;
  currency?: ReportCurrency;
  generatedBy?: string;
  locale?: "en" | "bn";
};
