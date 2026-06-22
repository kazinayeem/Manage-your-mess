export type DateRangePreset =
  | "today"
  | "yesterday"
  | "this_week"
  | "this_month"
  | "last_month"
  | "last_3_months"
  | "last_6_months"
  | "this_year"
  | "custom";

export type DateRange = {
  preset: DateRangePreset;
  start: Date;
  end: Date;
  label: string;
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function resolveDateRange(
  preset: DateRangePreset,
  customStart?: string,
  customEnd?: string,
  ref = new Date()
): DateRange {
  const now = startOfDay(ref);

  switch (preset) {
    case "today":
      return { preset, start: now, end: endOfDay(now), label: "Today" };
    case "yesterday": {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return { preset, start: y, end: endOfDay(y), label: "Yesterday" };
    }
    case "this_week": {
      const start = new Date(now);
      start.setDate(start.getDate() - start.getDay());
      return { preset, start, end: endOfDay(ref), label: "This Week" };
    }
    case "last_month": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0));
      return {
        preset,
        start,
        end,
        label: start.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      };
    }
    case "last_3_months": {
      const start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      return { preset, start, end: endOfDay(ref), label: "Last 3 Months" };
    }
    case "last_6_months": {
      const start = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      return { preset, start, end: endOfDay(ref), label: "Last 6 Months" };
    }
    case "this_year": {
      const start = new Date(now.getFullYear(), 0, 1);
      return { preset, start, end: endOfDay(ref), label: String(now.getFullYear()) };
    }
    case "custom": {
      const start = customStart ? startOfDay(new Date(customStart)) : now;
      const end = customEnd ? endOfDay(new Date(customEnd)) : endOfDay(ref);
      return {
        preset,
        start,
        end,
        label: `${start.toLocaleDateString()} – ${end.toLocaleDateString()}`,
      };
    }
    case "this_month":
    default: {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        preset: "this_month",
        start,
        end: endOfDay(ref),
        label: start.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      };
    }
  }
}

export const DATE_RANGE_PRESETS: { value: DateRangePreset; labelEn: string; labelBn: string }[] = [
  { value: "today", labelEn: "Today", labelBn: "আজ" },
  { value: "yesterday", labelEn: "Yesterday", labelBn: "গতকাল" },
  { value: "this_week", labelEn: "This Week", labelBn: "এই সপ্তাহ" },
  { value: "this_month", labelEn: "This Month", labelBn: "এই মাস" },
  { value: "last_month", labelEn: "Last Month", labelBn: "গত মাস" },
  { value: "last_3_months", labelEn: "Last 3 Months", labelBn: "গত ৩ মাস" },
  { value: "last_6_months", labelEn: "Last 6 Months", labelBn: "গত ৬ মাস" },
  { value: "this_year", labelEn: "This Year", labelBn: "এই বছর" },
  { value: "custom", labelEn: "Custom Range", labelBn: "কাস্টম তারিখ" },
];
