import type { ReportPayload } from "@/lib/reports/types";
import {
  reportTitle,
  columnLabel,
  summaryLabel,
  summaryKeyFromLabel,
  statusLabel,
  roleLabel,
  reportLabel,
} from "@/lib/reports/labels";

export function localizeReportPayload(payload: ReportPayload, locale: string): ReportPayload {
  const loc = locale === "bn" ? "bn" : "en";

  const localizedColumns = payload.columns.map((col) => ({
    ...col,
    label: columnLabel(col.key, loc),
  }));

  const localizedSummary = payload.summary.map((item) => {
    const key = summaryKeyFromLabel(item.label);
    const label = summaryLabel(key, loc);
    return { ...item, label: label === key ? item.label : label };
  });

  const localizedRows = payload.rows.map((row) => {
    const next = { ...row };
    if (typeof next.status === "string") next.status = statusLabel(next.status, loc);
    if (typeof next.role === "string") next.role = roleLabel(next.role, loc);
    if (
      typeof next.type === "string" &&
      ["Meal", "Expense", "Deposit", "CREDIT", "DEBIT"].includes(next.type)
    ) {
      next.type = statusLabel(next.type, loc);
    }
    return next;
  });

  const localizedSections = payload.sections?.map((section) => ({
    ...section,
    columns: section.columns.map((col) => ({
      ...col,
      label: columnLabel(col.key, loc),
    })),
    rows: section.rows.map((row) => {
      const next = { ...row };
      if (typeof next.status === "string") next.status = statusLabel(next.status, loc);
      if (typeof next.role === "string") next.role = roleLabel(next.role, loc);
      if (
        typeof next.type === "string" &&
        ["Meal", "Expense", "Deposit", "CREDIT", "DEBIT"].includes(next.type)
      ) {
        next.type = statusLabel(next.type, loc);
      }
      return next;
    }),
  }));

  return {
    ...payload,
    meta: {
      ...payload.meta,
      reportTitle: reportTitle(payload.meta.reportType, loc),
      language: loc === "bn" ? reportLabel("bangla", loc) : reportLabel("english", loc),
    },
    summary: localizedSummary,
    columns: localizedColumns,
    rows: localizedRows,
    sections: localizedSections,
  };
}
