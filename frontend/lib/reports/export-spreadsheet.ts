import * as XLSX from "xlsx";
import type { ReportColumn, ReportPayload } from "@/lib/reports/types";
import { formatReportCurrency } from "@/lib/reports/labels";
import { localizeReportPayload } from "@/lib/reports/localize-payload";
import { reportLabel } from "@/lib/reports/labels";

function formatCellValue(
  value: string | number,
  col: ReportColumn,
  currency: string,
  locale: string
): string | number {
  if (col.format === "currency" && typeof value === "number") {
    return formatReportCurrency(value, currency, locale, { suffix: currency !== "BDT" });
  }
  if (col.format === "number" && typeof value === "number") {
    return value.toLocaleString(locale === "bn" ? "bn-BD" : "en-US");
  }
  return value;
}

function safeFilename(payload: ReportPayload, ext: string): string {
  const date = new Date(payload.meta.generatedAt).toISOString().split("T")[0];
  const mess = payload.meta.messName.replace(/[^\w\u0980-\u09FF]+/g, "-").slice(0, 40);
  return `${mess}-${payload.meta.reportType}-${date}.${ext}`;
}

function buildSheetData(payload: ReportPayload, locale: string): (string | number)[][] {
  const currency = payload.meta.currency ?? "BDT";
  const header: (string | number)[] = [
    payload.meta.messName,
    payload.meta.reportTitle,
    payload.meta.periodLabel,
  ];
  const summaryRows: (string | number)[][] = [
    [reportLabel("summary", locale), ""],
    ...payload.summary.map((s) => [s.label, s.value]),
  ];
  const colHeaders = payload.columns.map((c) => c.label);
  const dataRows = payload.rows.map((row) =>
    payload.columns.map((col) => formatCellValue(row[col.key] ?? "", col, currency, locale))
  );

  return [header, [], ...summaryRows, [], colHeaders, ...dataRows];
}

export function downloadReportCsv(payload: ReportPayload, locale = "en"): void {
  const localized = localizeReportPayload(payload, locale);
  const rows = buildSheetData(localized, locale);
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const str = String(cell ?? "");
          return str.includes(",") || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
        })
        .join(",")
    )
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = safeFilename(localized, "csv");
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadReportExcel(payload: ReportPayload, locale = "en"): void {
  const localized = localizeReportPayload(payload, locale);
  const ws = XLSX.utils.aoa_to_sheet(buildSheetData(localized, locale));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, localized.meta.reportTitle.slice(0, 31));
  XLSX.writeFile(wb, safeFilename(localized, "xlsx"));
}
