"use client";

import type { ReportPayload, ReportColumn } from "@/lib/reports/types";
import { formatReportCurrency } from "@/lib/reports/labels";
import { reportLabel, appBrandName } from "@/lib/reports/labels";

function formatCell(value: string | number, col: ReportColumn, currency: string, locale: string) {
  if (col.format === "currency" && typeof value === "number") {
    return formatReportCurrency(value, currency, locale);
  }
  if (col.format === "number" && typeof value === "number") {
    return value.toLocaleString(locale === "bn" ? "bn-BD" : "en-US");
  }
  return String(value ?? "");
}

export function ReportPrintView({
  payload,
  locale,
}: {
  payload: ReportPayload;
  locale: string;
}) {
  const currency = payload.meta.currency ?? "BDT";
  const generated = new Date(payload.meta.generatedAt);
  const dateLocale = locale === "bn" ? "bn-BD" : "en-US";

  return (
    <div className="report-print-root hidden print:block">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 12mm; }
          body { background: white !important; color: black !important; -webkit-print-color-adjust: economy; print-color-adjust: economy; }
          .report-print-root { display: block !important; font-family: "Noto Sans Bengali", "Hind Siliguri", Arial, sans-serif; font-size: 11pt; color: #000; }
          .report-print-root table { width: 100%; border-collapse: collapse; page-break-inside: auto; }
          .report-print-root tr { page-break-inside: avoid; page-break-after: auto; }
          .report-print-root thead { display: table-header-group; }
          .report-print-root th, .report-print-root td { border: 1px solid #bbb; padding: 4px 6px; }
          .report-print-root th { background: #f5f5f5 !important; font-weight: 600; }
          .report-print-root .num { text-align: right; font-variant-numeric: tabular-nums; }
          .report-print-root .no-print { display: none !important; }
        }
      `}</style>

      <header className="mb-4 border-b border-zinc-300 pb-3">
        <p className="text-xs text-zinc-600">{appBrandName(locale)}</p>
        <h1 className="text-xl font-bold">{payload.meta.messName}</h1>
        {payload.meta.messAddress && <p className="text-sm text-zinc-600">{payload.meta.messAddress}</p>}
        <h2 className="mt-2 text-base font-semibold">{payload.meta.reportTitle}</h2>
        <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-zinc-700">
          <span>{reportLabel("generatedOn", locale)}: {generated.toLocaleDateString(dateLocale)}</span>
          <span>{reportLabel("generatedAt", locale)}: {generated.toLocaleTimeString(dateLocale)}</span>
          <span>{reportLabel("period", locale)}: {payload.meta.periodLabel}</span>
          {payload.meta.generatedBy && (
            <span>{reportLabel("generatedBy", locale)}: {payload.meta.generatedBy}</span>
          )}
        </div>
      </header>

      {payload.summary.length > 0 && (
        <section className="mb-4">
          <h3 className="mb-2 text-sm font-semibold">{reportLabel("summary", locale)}</h3>
          <table>
            <tbody>
              {payload.summary.map((s) => (
                <tr key={s.label}>
                  <td className="w-1/2 text-zinc-600">{s.label}</td>
                  <td className="num font-medium">{s.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {payload.rows.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold">{reportLabel("dataTable", locale)}</h3>
          <table>
            <thead>
              <tr>
                {payload.columns.map((col) => (
                  <th key={col.key} className={col.align === "right" ? "num" : ""}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payload.rows.map((row, i) => (
                <tr key={i}>
                  {payload.columns.map((col) => (
                    <td key={col.key} className={col.align === "right" ? "num" : ""}>
                      {formatCell(row[col.key] ?? "", col, currency, locale)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <footer className="mt-6 border-t border-zinc-300 pt-2 text-xs text-zinc-500">
        {appBrandName(locale)} · {reportLabel("confidential", locale)}
        {payload.meta.reportId && ` · ${payload.meta.reportId}`}
      </footer>
    </div>
  );
}
