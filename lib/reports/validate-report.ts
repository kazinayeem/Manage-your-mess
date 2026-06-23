import type { ReportColumn, ReportPayload } from "@/lib/reports/types";

export type ReportValidation = {
  valid: boolean;
  warnings: string[];
};

const NEGATIVE_ALLOWED_CURRENCY_KEYS = new Set(["balance"]);

function hasInvalidCurrencyValue(value: number, col: ReportColumn) {
  if (Number.isNaN(value)) return true;
  if (col.allowNegative || NEGATIVE_ALLOWED_CURRENCY_KEYS.has(col.key)) return false;
  return value < 0;
}

export function validateReportPayload(payload: ReportPayload): ReportValidation {
  const warnings: string[] = [];

  if (payload.rows.length === 0) {
    warnings.push("No data rows in this report.");
  }

  if (payload.summary.length === 0) {
    warnings.push("Executive summary is empty.");
  }

  if (payload.sections?.some((section) => section.columns.length === 0)) {
    warnings.push("One or more report sections are missing column definitions.");
  }

  if (payload.sections?.some((section) => section.rows.some((row) => Object.keys(row).length === 0))) {
    warnings.push("One or more report sections contain empty rows.");
  }

  const currencyCols = payload.columns.filter((c) => c.format === "currency");
  if (currencyCols.length > 0 && payload.rows.length > 0) {
    for (const col of currencyCols) {
      const values = payload.rows
        .map((r) => r[col.key])
        .filter((v): v is number => typeof v === "number");
      if (values.some((v) => hasInvalidCurrencyValue(v, col))) {
        warnings.push(`Invalid amounts detected in column "${col.label}".`);
        break;
      }
    }
  }

  if (payload.sections?.length) {
    for (const section of payload.sections) {
      const sectionCurrencyCols = section.columns.filter((c) => c.format === "currency");
      for (const col of sectionCurrencyCols) {
        const values = section.rows
          .map((r) => r[col.key])
          .filter((v): v is number => typeof v === "number");
        if (values.some((v) => hasInvalidCurrencyValue(v, col))) {
          warnings.push(`Invalid amounts detected in section "${section.title}".`);
          break;
        }
      }
    }
  }

  return { valid: warnings.length === 0, warnings };
}
