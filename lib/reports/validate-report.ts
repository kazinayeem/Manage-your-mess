import type { ReportPayload } from "@/lib/reports/types";

export type ReportValidation = {
  valid: boolean;
  warnings: string[];
};

export function validateReportPayload(payload: ReportPayload): ReportValidation {
  const warnings: string[] = [];

  if (payload.rows.length === 0) {
    warnings.push("No data rows in this report.");
  }

  if (payload.summary.length === 0) {
    warnings.push("Executive summary is empty.");
  }

  const currencyCols = payload.columns.filter((c) => c.format === "currency");
  if (currencyCols.length > 0 && payload.rows.length > 0) {
    for (const col of currencyCols) {
      const values = payload.rows
        .map((r) => r[col.key])
        .filter((v): v is number => typeof v === "number");
      if (values.some((v) => Number.isNaN(v) || v < 0)) {
        warnings.push(`Invalid amounts detected in column "${col.label}".`);
        break;
      }
    }
  }

  return { valid: warnings.length === 0, warnings };
}
