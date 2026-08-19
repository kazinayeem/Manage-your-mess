"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { fetchReportData } from "@/actions/reports";
import { generateReportPdf, printReportPdf } from "@/lib/reports/export-pdf";
import { downloadReportCsv, downloadReportExcel } from "@/lib/reports/export-spreadsheet";
import { localizeReportPayload } from "@/lib/reports/localize-payload";
import { validateReportPayload } from "@/lib/reports/validate-report";
import { ReportPrintView } from "@/components/mess/report-print-view";
import { formatReportCurrency } from "@/lib/reports/labels";
import type { ReportPayload, ReportType, MonthOption, ReportCurrency } from "@/lib/reports/types";
import { DATE_RANGE_PRESETS, resolveDateRange, type DateRangePreset } from "@/lib/reports/date-ranges";
import type { MessCapabilities } from "@/lib/mess-permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  Loader2,
  Calendar,
  BarChart3,
  Users,
  Utensils,
  Receipt,
  Wallet,
  Sheet,
  Printer,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import type { ReportColumn } from "@/lib/reports/types";

const REPORT_ICONS: Partial<Record<ReportType, typeof FileText>> = {
  monthly: BarChart3,
  yearly: BarChart3,
  member: Users,
  meal: Utensils,
  expense: Receipt,
  deposit: Wallet,
  balance_sheet: Sheet,
  rent: Receipt,
  utility: Receipt,
  shared_expense: Receipt,
  bill_settlement: Sheet,
  due: Wallet,
  bazaar: Receipt,
  transaction: FileText,
  daily: Calendar,
  weekly: Calendar,
};

type ReportDef = {
  type: ReportType;
  labelKey: string;
  descKey: string;
  needsDate?: boolean;
};

const REPORT_DEFS: ReportDef[] = [
  { type: "monthly", labelKey: "monthly", descKey: "monthlyDesc" },
  { type: "member", labelKey: "member", descKey: "memberDesc" },
  { type: "meal", labelKey: "meal", descKey: "mealDesc" },
  { type: "expense", labelKey: "expense", descKey: "expenseDesc" },
  { type: "deposit", labelKey: "deposit", descKey: "depositDesc" },
  { type: "utility", labelKey: "utility", descKey: "utilityDesc" },
  { type: "rent", labelKey: "rent", descKey: "rentDesc" },
  { type: "balance_sheet", labelKey: "balanceSheet", descKey: "balanceSheetDesc" },
  { type: "due", labelKey: "dueReport", descKey: "dueReportDesc" },
  { type: "bazaar", labelKey: "bazaar", descKey: "bazaarDesc" },
  { type: "transaction", labelKey: "transaction", descKey: "transactionDesc" },
  { type: "shared_expense", labelKey: "sharedExpense", descKey: "sharedExpenseDesc" },
  { type: "bill_settlement", labelKey: "billSettlement", descKey: "billSettlementDesc" },
  { type: "yearly", labelKey: "yearly", descKey: "yearlyDesc" },
  { type: "daily", labelKey: "daily", descKey: "dailyDesc", needsDate: true },
  { type: "weekly", labelKey: "weekly", descKey: "weeklyDesc", needsDate: true },
];

function formatPreviewValue(
  value: string | number,
  col: ReportColumn,
  currency: string,
  locale: string
): string {
  if (col.format === "currency" && typeof value === "number") {
    return formatReportCurrency(value, currency, locale);
  }
  if (col.format === "number" && typeof value === "number") {
    return value.toLocaleString(locale === "bn" ? "bn-BD" : "en-US");
  }
  return String(value);
}

export function ReportsHub({
  messId,
  months,
  defaultMonthId,
  defaultDate,
  planTier,
  generatedBy,
  capabilities,
}: {
  messId: string;
  months: MonthOption[];
  defaultMonthId: string;
  defaultDate: string;
  planTier: string;
  generatedBy?: string;
  capabilities: MessCapabilities;
}) {
  const t = useTranslations("messReports");
  const appLocale = useLocale();
  const [reportLocale, setReportLocale] = useState<"en" | "bn">(
    appLocale === "bn" ? "bn" : "en"
  );
  const [currency, setCurrency] = useState<ReportCurrency>("BDT");
  const [datePreset, setDatePreset] = useState<DateRangePreset>("this_month");
  const [customStart, setCustomStart] = useState(defaultDate);
  const [customEnd, setCustomEnd] = useState(defaultDate);
  const [monthId, setMonthId] = useState(defaultMonthId);
  const [reportDate] = useState(defaultDate);
  const [activeType, setActiveType] = useState<ReportType | null>("monthly");
  const [payload, setPayload] = useState<ReportPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");

  const dateRange = useMemo(
    () =>
      resolveDateRange(
        datePreset,
        datePreset === "custom" ? customStart : undefined,
        datePreset === "custom" ? customEnd : undefined
      ),
    [datePreset, customStart, customEnd]
  );

  const loadReport = useCallback(
    async (type: ReportType) => {
      setLoading(true);
      setActiveType(type);
      const def = REPORT_DEFS.find((d) => d.type === type);
      const result = await fetchReportData(messId, monthId, type, {
        date: def?.needsDate ? reportDate : undefined,
        dateRangeStart: dateRange.start.toISOString().split("T")[0],
        dateRangeEnd: dateRange.end.toISOString().split("T")[0],
        currency,
        generatedBy,
        locale: reportLocale,
      });
      setLoading(false);
      if (!result.success) {
        toast.error(result.error);
        setPayload(null);
        return;
      }
      setPayload(result.data);
    },
    [messId, monthId, reportDate, dateRange, currency, generatedBy, reportLocale]
  );

  const displayPayload = useMemo(
    () => (payload ? localizeReportPayload(payload, reportLocale) : null),
    [payload, reportLocale]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadReport("monthly");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadReport]);

  async function handleExport(format: "pdf" | "csv" | "excel" | "print") {
    if (!payload) {
      toast.error(t("loadFirst"));
      return;
    }

    const validation = validateReportPayload(payload);
    if (validation.warnings.length > 0) {
      toast.warning(validation.warnings.join(" "));
    }

    setExporting(format);
    try {
      if (format === "pdf") {
        await generateReportPdf(payload, reportLocale, orientation);
      } else if (format === "print") {
        await printReportPdf(payload, reportLocale, orientation);
      } else if (format === "csv") {
        downloadReportCsv(payload, reportLocale);
      } else {
        downloadReportExcel(payload, reportLocale);
      }
      toast.success(t("exportSuccess", { format: format.toUpperCase() }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("exportFailed"));
    } finally {
      setExporting(null);
    }
  }

  function handleShare() {
    if (!payload) return;
    const text = `${payload.meta.reportTitle} — ${payload.meta.messName} (${payload.meta.periodLabel})`;
    if (navigator.share) {
      navigator.share({ title: text, text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Report summary copied to clipboard");
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="border-zinc-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("filtersTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0">
          <div className="flex flex-wrap gap-2">
            {DATE_RANGE_PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => {
                  setDatePreset(p.value);
                  setPayload(null);
                }}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors touch-manipulation ${
                  datePreset === p.value
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-emerald-300"
                }`}
              >
                {reportLocale === "bn" ? p.labelBn : p.labelEn}
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label htmlFor="month">{t("selectMonth")}</Label>
              <select
                id="month"
                value={monthId}
                onChange={(e) => {
                  setMonthId(e.target.value);
                  setPayload(null);
                }}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
              >
                {months.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label} {m.status === "ACTIVE" ? `(${t("running")})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>{t("language")}</Label>
              <select
                value={reportLocale}
                onChange={(e) => setReportLocale(e.target.value as "en" | "bn")}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
              >
                <option value="en">English</option>
                <option value="bn">বাংলা</option>
              </select>
            </div>
            <div>
              <Label>{t("currency")}</Label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as ReportCurrency)}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
              >
                <option value="BDT">BDT (৳)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
            <div>
              <Label>{t("pdfOrientation")}</Label>
              <select
                value={orientation}
                onChange={(e) => setOrientation(e.target.value as "portrait" | "landscape")}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
              >
                <option value="portrait">A4 Portrait</option>
                <option value="landscape">A4 Landscape</option>
              </select>
            </div>
          </div>

          {datePreset === "custom" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>{t("dateFrom")}</Label>
                <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>{t("dateTo")}</Label>
                <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="mt-1" />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{planTier} {t("plan")}</Badge>
            <Badge variant="secondary">{dateRange.label}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Report type grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {REPORT_DEFS.map((def) => {
          const Icon = REPORT_ICONS[def.type] ?? FileText;
          const isActive = activeType === def.type;
          return (
            <Card
              key={def.type}
              className={`cursor-pointer border transition-all hover:shadow-md ${
                isActive ? "border-emerald-500 ring-1 ring-emerald-500" : "border-zinc-200"
              }`}
              onClick={() => loadReport(def.type)}
            >
              <CardHeader className="pb-1 pt-4">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Icon className="h-4 w-4 shrink-0 text-emerald-600" />
                  {t(def.labelKey)}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-xs text-zinc-500 line-clamp-2">{t(def.descKey)}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Preview + export */}
      <Card className="border-zinc-200 shadow-sm">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg">
              {displayPayload ? displayPayload.meta.reportTitle : t("previewTitle")}
            </CardTitle>
            {displayPayload && (
              <p className="mt-1 text-sm text-zinc-500">
                {displayPayload.meta.messName} — {displayPayload.meta.periodLabel}
                {displayPayload.meta.generatedBy && ` · ${displayPayload.meta.generatedBy}`}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {capabilities.canUsePdfExport && (
              <Button size="sm" variant="outline" className="gap-1.5" disabled={!payload || !!exporting} onClick={() => handleExport("pdf")}>
                {exporting === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                PDF
              </Button>
            )}
            {capabilities.canUseCsvExport && (
              <Button size="sm" variant="outline" className="gap-1.5" disabled={!payload || !!exporting} onClick={() => handleExport("csv")}>
                CSV
              </Button>
            )}
            {capabilities.canUseExcelExport && (
              <Button size="sm" variant="outline" className="gap-1.5" disabled={!payload || !!exporting} onClick={() => handleExport("excel")}>
                Excel
              </Button>
            )}
            {capabilities.canUsePdfExport && (
              <Button size="sm" variant="outline" className="gap-1.5" disabled={!payload} onClick={() => handleExport("print")}>
                <Printer className="h-4 w-4" />
                {t("print")}
              </Button>
            )}
            <Button size="sm" variant="outline" className="gap-1.5" disabled={!payload} onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-zinc-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {t("loading")}
            </div>
          ) : !displayPayload ? (
            <div className="py-16 text-center text-sm text-zinc-500">{t("selectReport")}</div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {displayPayload.summary.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 print:border-zinc-300"
                  >
                    <p className="text-xs text-zinc-500">{item.label}</p>
                    <p className="mt-1 text-lg font-semibold tabular-nums text-zinc-900">{item.value}</p>
                  </div>
                ))}
              </div>

              {displayPayload.analytics?.mealBreakdown && (
                <div className="rounded-lg border border-zinc-200 p-4">
                  <p className="mb-2 text-sm font-medium">{t("mealAnalytics")}</p>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>Breakfast: {displayPayload.analytics.mealBreakdown.breakfast.toFixed(1)}</div>
                    <div>Lunch: {displayPayload.analytics.mealBreakdown.lunch.toFixed(1)}</div>
                    <div>Dinner: {displayPayload.analytics.mealBreakdown.dinner.toFixed(1)}</div>
                  </div>
                </div>
              )}

              <div className="table-scroll-x overflow-x-auto rounded-lg border border-zinc-200">
                <table className="min-w-[600px] w-full text-sm">
                  <thead>
                    <tr className="border-b bg-zinc-100 text-left text-zinc-900">
                      {displayPayload.columns.map((col) => (
                        <th key={col.key} className={`px-3 py-2.5 font-medium ${col.align === "right" ? "text-right" : "text-left"}`}>
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayPayload.rows.length === 0 ? (
                      <tr>
                        <td colSpan={displayPayload.columns.length} className="px-3 py-8 text-center text-zinc-500">
                          {t("noData")}
                        </td>
                      </tr>
                    ) : (
                      displayPayload.rows.map((row, i) => (
                        <tr key={i} className="border-b border-zinc-100 hover:bg-zinc-50">
                          {displayPayload.columns.map((col) => (
                            <td
                              key={col.key}
                              className={`px-3 py-2 tabular-nums ${col.align === "right" ? "text-right" : "text-left"}`}
                            >
                              {formatPreviewValue(row[col.key] ?? "", col, currency, reportLocale)}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-zinc-400">
                {t("rowsCount", { count: displayPayload.rows.length })}
                {displayPayload.meta.reportId && ` · ID: ${displayPayload.meta.reportId}`}
              </p>
              {displayPayload && <ReportPrintView payload={displayPayload} locale={reportLocale} />}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
