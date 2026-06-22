import * as XLSX from "xlsx";
import type { ReportColumn, ReportPayload } from "@/lib/reports/types";

function formatCellValue(value: string | number, col: ReportColumn): string | number {
  if (col.format === "currency" && typeof value === "number") {
    const hasDecimals = Math.round(value * 100) % 100 !== 0;
    return `৳${value.toLocaleString("en-US", {
      minimumFractionDigits: hasDecimals ? 2 : 0,
      maximumFractionDigits: hasDecimals ? 2 : 0,
    })}`;
  }
  return value;
}

function slugifyFilename(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildSheetData(payload: ReportPayload): (string | number)[][] {
  const header: (string | number)[] = [
    payload.meta.messName,
    payload.meta.reportTitle,
    payload.meta.periodLabel,
  ];
  const summaryRows: (string | number)[][] = payload.summary.map((s) => [s.label, s.value]);
  const colHeaders = payload.columns.map((c) => c.label);
  const dataRows = payload.rows.map((row) =>
    payload.columns.map((col) => formatCellValue(row[col.key] ?? "", col))
  );

  return [
    header,
    [],
    ["Summary"],
    ...summaryRows,
    [],
    colHeaders,
    ...dataRows,
  ];
}

export function downloadReportCsv(payload: ReportPayload): void {
  const rows = buildSheetData(payload);
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
  link.download = `${slugifyFilename(payload.meta.messName)}-${slugifyFilename(payload.meta.reportTitle)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadReportExcel(payload: ReportPayload): void {
  const ws = XLSX.utils.aoa_to_sheet(buildSheetData(payload));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, payload.meta.reportTitle.slice(0, 31));
  XLSX.writeFile(
    wb,
    `${slugifyFilename(payload.meta.messName)}-${slugifyFilename(payload.meta.reportTitle)}.xlsx`
  );
}
