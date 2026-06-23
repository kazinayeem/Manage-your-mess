import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { ReportColumn, ReportPayload } from "@/lib/reports/types";
import {
  reportLabel,
  formatReportCurrency,
  appBrandName,
  columnLabel,
} from "@/lib/reports/labels";
import { localizeReportPayload } from "@/lib/reports/localize-payload";

const FONT_NAME = "NotoSansBengali";
const FONT_FILE = "NotoSansBengali-Regular.ttf";

const C = {
  black: [0, 0, 0] as [number, number, number],
  dark: [40, 40, 40] as [number, number, number],
  mid: [100, 100, 100] as [number, number, number],
  light: [245, 245, 245] as [number, number, number],
  border: [180, 180, 180] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

let cachedFontBase64: string | null = null;

async function loadFontBase64(): Promise<string> {
  if (cachedFontBase64) return cachedFontBase64;
  const response = await fetch("/fonts/NotoSansBengali-Regular.ttf");
  if (!response.ok) throw new Error("Failed to load Bengali font (Noto Sans Bengali)");
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  cachedFontBase64 = btoa(binary);
  return cachedFontBase64;
}

function containsBengali(text: string): boolean {
  return /[\u0980-\u09FF]/.test(text);
}

function needsUnicodeFont(payload: ReportPayload, locale: string): boolean {
  if (locale === "bn") return true;
  const sample = [
    payload.meta.messName,
    payload.meta.messAddress ?? "",
    ...payload.rows.flatMap((r) => Object.values(r).map(String)),
  ].join(" ");
  return containsBengali(sample);
}

async function applyFont(doc: jsPDF, useUnicode: boolean): Promise<string> {
  if (useUnicode) {
    const base64 = await loadFontBase64();
    doc.addFileToVFS(FONT_FILE, base64);
    doc.addFont(FONT_FILE, FONT_NAME, "normal");
    doc.setFont(FONT_NAME, "normal");
    return FONT_NAME;
  }
  doc.setFont("helvetica", "normal");
  return "helvetica";
}

function formatCellValue(
  value: string | number,
  col: ReportColumn,
  currency: string,
  locale: string
): string {
  if (col.format === "currency" && typeof value === "number") {
    return formatReportCurrency(value, currency, locale, { suffix: currency !== "BDT" });
  }
  if (col.format === "number" && typeof value === "number") {
    return value.toLocaleString(locale === "bn" ? "bn-BD" : "en-US");
  }
  return String(value ?? "");
}

function safeFilename(payload: ReportPayload): string {
  const date = new Date(payload.meta.generatedAt).toISOString().split("T")[0];
  const type = payload.meta.reportType;
  const mess = payload.meta.messName.replace(/[^\w\u0980-\u09FF]+/g, "-").slice(0, 40);
  return `${mess}-${type}-${date}.pdf`;
}

function drawPageFooter(
  doc: jsPDF,
  page: number,
  pageCount: number,
  payload: ReportPayload,
  locale: string,
  dateStr: string,
  margin: number
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.3);
  doc.line(margin, pageH - 16, pageWidth - margin, pageH - 16);

  doc.setFontSize(7);
  doc.setTextColor(...C.mid);
  const left = `${appBrandName(locale)} · ${reportLabel("confidential", locale)}`;
  doc.text(left, margin, pageH - 10);

  const center = payload.meta.reportId
    ? `${reportLabel("reportId", locale)}: ${payload.meta.reportId} · ${dateStr}`
    : dateStr;
  doc.text(center, pageWidth / 2, pageH - 10, { align: "center" });

  doc.text(
    `${reportLabel("page", locale)} ${page} ${reportLabel("of", locale)} ${pageCount}`,
    pageWidth - margin,
    pageH - 10,
    { align: "right" }
  );
}

export async function buildReportPdf(
  rawPayload: ReportPayload,
  locale: string,
  orientation: "portrait" | "landscape" = "portrait"
): Promise<{ doc: jsPDF; filename: string }> {
  const payload = localizeReportPayload(rawPayload, locale);
  const currency = payload.meta.currency ?? "BDT";
  const doc = new jsPDF({ orientation, unit: "mm", format: "a4" });
  const fontFamily = await applyFont(doc, needsUnicodeFont(payload, locale));

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const generated = new Date(payload.meta.generatedAt);
  const dateLocale = locale === "bn" ? "bn-BD" : "en-US";
  const dateStr = generated.toLocaleDateString(dateLocale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = generated.toLocaleTimeString(dateLocale, {
    hour: "numeric",
    minute: "2-digit",
  });

  let y = margin;

  // ── Header ──────────────────────────────────────────────────────────────
  doc.setTextColor(...C.black);
  doc.setFontSize(8);
  doc.text(appBrandName(locale), margin, y);
  y += 5;

  doc.setFontSize(16);
  doc.text(payload.meta.messName, margin, y);
  y += 6;

  if (payload.meta.messAddress) {
    doc.setFontSize(9);
    doc.setTextColor(...C.mid);
    doc.text(payload.meta.messAddress, margin, y);
    y += 5;
  }

  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.4);
  doc.line(margin, y + 1, pageWidth - margin, y + 1);
  y += 8;

  doc.setFontSize(12);
  doc.setTextColor(...C.black);
  doc.text(payload.meta.reportTitle, margin, y);
  y += 7;

  doc.setFontSize(8);
  doc.setTextColor(...C.dark);
  const metaRows: [string, string][] = [
    [reportLabel("generatedOn", locale), dateStr],
    [reportLabel("generatedAt", locale), timeStr],
    [reportLabel("reportType", locale), payload.meta.reportTitle],
    [reportLabel("period", locale), payload.meta.periodLabel],
    [reportLabel("month", locale), payload.meta.monthLabel],
    [reportLabel("language", locale), payload.meta.language ?? locale],
  ];
  if (payload.meta.generatedBy) {
    metaRows.push([reportLabel("generatedBy", locale), payload.meta.generatedBy]);
  }
  if (payload.meta.reportId) {
    metaRows.push([reportLabel("reportId", locale), payload.meta.reportId]);
  }

  const colW = contentWidth / 2;
  metaRows.forEach(([label, value], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = margin + col * colW;
    const my = y + row * 5;
    doc.setTextColor(...C.mid);
    doc.text(`${label}:`, x, my);
    doc.setTextColor(...C.black);
    doc.text(value, x + 32, my);
  });
  y += Math.ceil(metaRows.length / 2) * 5 + 6;

  // ── Executive summary ───────────────────────────────────────────────────
  if (payload.summary.length > 0) {
    doc.setFontSize(10);
    doc.setTextColor(...C.black);
    doc.text(reportLabel("summary", locale), margin, y);
    y += 3;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      theme: "plain",
      head: [[reportLabel("summary", locale), ""]],
      body: payload.summary.map((s) => [s.label, s.value]),
      showHead: false,
      styles: {
        font: fontFamily,
        fontSize: 8,
        cellPadding: 2.5,
        textColor: C.black,
        lineColor: C.border,
        lineWidth: 0.2,
      },
      columnStyles: {
        0: { cellWidth: contentWidth * 0.45, textColor: C.mid },
        1: { cellWidth: contentWidth * 0.55, halign: "right", fontStyle: "bold" },
      },
      alternateRowStyles: { fillColor: C.light },
    });

    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  // ── Expense breakdown (monochrome table) ────────────────────────────────
  if (payload.analytics?.expenseBreakdown?.length) {
    const slices = payload.analytics.expenseBreakdown
      .filter((x) => x.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
    const total = slices.reduce((s, x) => s + x.amount, 0);

    if (slices.length > 0 && total > 0) {
      doc.setFontSize(10);
      doc.text(reportLabel("expenseBreakdown", locale), margin, y);
      y += 3;

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [[columnLabel("category", locale), columnLabel("amount", locale), "%"]],
        body: slices.map((s) => [
          s.label,
          formatReportCurrency(s.amount, currency, locale),
          `${Math.round((s.amount / total) * 100)}%`,
        ]),
        styles: { font: fontFamily, fontSize: 8, cellPadding: 2.5, textColor: C.black },
        headStyles: {
          fillColor: C.light,
          textColor: C.black,
          fontStyle: "bold",
          lineColor: C.border,
        },
        columnStyles: {
          1: { halign: "right" },
          2: { halign: "right" },
        },
        alternateRowStyles: { fillColor: [252, 252, 252] },
      });

      y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    }
  }

  // ── Data table ──────────────────────────────────────────────────────────
  if (payload.rows.length > 0) {
    doc.setFontSize(10);
    doc.text(reportLabel("dataTable", locale), margin, y);
    y += 3;

    const head = [payload.columns.map((c) => c.label)];
    const body = payload.rows.map((row) =>
      payload.columns.map((col) => formatCellValue(row[col.key] ?? "", col, currency, locale))
    );

    autoTable(doc, {
      startY: y,
      head,
      body,
      margin: { left: margin, right: margin, top: margin, bottom: 22 },
      styles: {
        font: fontFamily,
        fontSize: orientation === "landscape" ? 7 : 7.5,
        cellPadding: 2.5,
        overflow: "linebreak",
        textColor: C.black,
        lineColor: C.border,
        lineWidth: 0.2,
        valign: "middle",
      },
      headStyles: {
        fillColor: C.light,
        textColor: C.black,
        fontStyle: "bold",
        lineColor: C.border,
      },
      alternateRowStyles: { fillColor: [252, 252, 252] },
      showHead: "everyPage",
      rowPageBreak: "avoid",
      columnStyles: Object.fromEntries(
        payload.columns.map((col, i) => [
          i,
          {
            halign: col.align ?? (col.format === "currency" || col.format === "number" ? "right" : "left"),
            cellWidth: "wrap",
          },
        ])
      ),
    });
  } else {
    doc.setFontSize(9);
    doc.setTextColor(...C.mid);
    doc.text(reportLabel("noData", locale), margin, y + 4);
  }

  // Footers on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    drawPageFooter(doc, i, pageCount, payload, locale, dateStr, margin);
  }

  return { doc, filename: safeFilename(payload) };
}

export async function generateReportPdf(
  payload: ReportPayload,
  locale: string,
  orientation: "portrait" | "landscape" = "portrait"
): Promise<void> {
  const { doc, filename } = await buildReportPdf(payload, locale, orientation);
  doc.save(filename);
}

export async function printReportPdf(
  payload: ReportPayload,
  locale: string,
  orientation: "portrait" | "landscape" = "portrait"
): Promise<void> {
  const { doc } = await buildReportPdf(payload, locale, orientation);
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  iframe.src = url;
  document.body.appendChild(iframe);
  iframe.onload = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      iframe.remove();
    }, 1000);
  };
}
