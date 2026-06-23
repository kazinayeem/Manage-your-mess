import { jsPDF } from "jspdf";
import autoTable, { type CellInput } from "jspdf-autotable";
import type { ReportColumn, ReportPayload, ReportSection } from "@/lib/reports/types";
import { reportLabel, formatReportCurrency, appBrandName } from "@/lib/reports/labels";
import { localizeReportPayload } from "@/lib/reports/localize-payload";
import { applyPdfFont, PDF_FONT, setPdfFont } from "@/lib/reports/pdf-font";
import {
  drawDepositVsExpenseChart,
  drawExpenseBreakdownChart,
  drawMealBreakdownChart,
} from "@/lib/reports/pdf-charts";

const C = {
  black: [0, 0, 0] as [number, number, number],
  dark: [38, 38, 38] as [number, number, number],
  mid: [95, 95, 95] as [number, number, number],
  light: [246, 246, 246] as [number, number, number],
  lightAlt: [252, 252, 252] as [number, number, number],
  border: [155, 155, 155] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

const PAGE_MARGIN = 14;
const FOOTER_HEIGHT = 16;
const COMPACT_HEADER_HEIGHT = 10;

let cachedLogoData: { data: string; format: "PNG" | "JPEG" } | null = null;

async function loadLogoImage(): Promise<{ data: string; format: "PNG" | "JPEG" } | null> {
  if (cachedLogoData) return cachedLogoData;
  for (const url of ["/cover.png", "/icon.svg"]) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const blob = await response.blob();
      if (!blob.type.startsWith("image/")) continue;
      const format = blob.type.includes("png") ? "PNG" : "JPEG";
      const buffer = await response.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i += 8192) {
        binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
      }
      cachedLogoData = { data: btoa(binary), format };
      return cachedLogoData;
    } catch {
      // try next asset
    }
  }
  return null;
}

function formatCellValue(
  value: string | number | null | undefined,
  col: ReportColumn,
  currency: string,
  locale: string
): string {
  if (value === null || value === undefined || value === "") {
    return locale === "bn" ? "কোনো ডেটা নেই" : "No Data";
  }
  if (col.format === "currency" && typeof value === "number") {
    return formatReportCurrency(value, currency, locale, { suffix: currency !== "BDT" });
  }
  if (col.format === "number" && typeof value === "number") {
    return value.toLocaleString(locale === "bn" ? "bn-BD" : "en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }
  if (col.format === "portion" && typeof value === "number") {
    return value.toLocaleString(locale === "bn" ? "bn-BD" : "en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }
  return String(value);
}

function safeFilename(payload: ReportPayload): string {
  const date = new Date(payload.meta.generatedAt).toISOString().split("T")[0];
  const type = payload.meta.reportType;
  const mess = payload.meta.messName.replace(/[^\w\u0980-\u09FF]+/g, "-").slice(0, 40);
  return `${mess}-${type}-${date}.pdf`;
}

function getGeneratedStrings(locale: string, generatedAt: string) {
  const generated = new Date(generatedAt);
  const dateLocale = locale === "bn" ? "bn-BD" : "en-US";
  return {
    dateStr: generated.toLocaleDateString(dateLocale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    timeStr: generated.toLocaleTimeString(dateLocale, {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    }),
    timestampStr: generated.toLocaleString(dateLocale, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

function pageWidth(doc: jsPDF) {
  return doc.internal.pageSize.getWidth();
}

function pageHeight(doc: jsPDF) {
  return doc.internal.pageSize.getHeight();
}

function ensureSpace(doc: jsPDF, y: number, needed: number) {
  if (y + needed <= pageHeight(doc) - FOOTER_HEIGHT) return y;
  doc.addPage();
  return PAGE_MARGIN + COMPACT_HEADER_HEIGHT;
}

function columnWidthStyles(
  columns: ReportColumn[],
  tableWidth: number,
  orientation: "portrait" | "landscape"
): Record<number, { cellWidth: number; halign: "left" | "right" | "center" }> {
  const weights = columns.map((col) => {
    if (col.key === "description" || col.key === "items" || col.key === "notes") return 2.8;
    if (col.key === "name" || col.key === "member" || col.key === "category") return 2;
    if (col.format === "currency" || col.format === "number") return 1.2;
    return 1.4;
  });
  const total = weights.reduce((sum, w) => sum + w, 0);
  return Object.fromEntries(
    columns.map((col, index) => [
      index,
      {
        cellWidth: (weights[index] / total) * tableWidth,
        halign: (col.align ??
          (col.format === "currency" || col.format === "number" ? "right" : "left")) as
          | "left"
          | "right"
          | "center",
      },
    ])
  );
}

function drawBrandMark(
  doc: jsPDF,
  x: number,
  y: number,
  size: number,
  logo: { data: string; format: "PNG" | "JPEG" } | null
) {
  if (logo) {
    try {
      doc.addImage(logo.data, logo.format, x, y, size, size);
      return;
    } catch {
      // fall through to text mark
    }
  }
  doc.setFillColor(...C.black);
  doc.roundedRect(x, y, size, size, 2, 2, "F");
  setPdfFont(doc, Math.max(8, size * 0.38), C.white);
  doc.text("MF", x + size / 2, y + size * 0.62, { align: "center" });
}

async function drawCoverPage(
  doc: jsPDF,
  payload: ReportPayload,
  locale: string,
  generatedMeta: ReturnType<typeof getGeneratedStrings>,
  logo: { data: string; format: "PNG" | "JPEG" } | null
) {
  const w = pageWidth(doc);
  const h = pageHeight(doc);
  const cx = w / 2;

  doc.setFillColor(...C.light);
  doc.rect(0, 0, w, h, "F");

  drawBrandMark(doc, cx - 14, 38, 28, logo);

  setPdfFont(doc, 11, C.mid);
  doc.text(appBrandName(locale), cx, 74, { align: "center" });

  setPdfFont(doc, 20, C.black);
  doc.text(payload.meta.reportTitle, cx, 88, { align: "center", maxWidth: w - PAGE_MARGIN * 4 });

  setPdfFont(doc, 14, C.dark);
  doc.text(payload.meta.messName, cx, 100, { align: "center", maxWidth: w - PAGE_MARGIN * 4 });

  if (payload.meta.messAddress) {
    setPdfFont(doc, 9, C.mid);
    doc.text(payload.meta.messAddress, cx, 108, { align: "center", maxWidth: w - PAGE_MARGIN * 4 });
  }

  const boxW = Math.min(150, w - PAGE_MARGIN * 2);
  const boxX = (w - boxW) / 2;
  const boxY = 118;
  const boxH = 58;

  doc.setDrawColor(...C.border);
  doc.setFillColor(...C.white);
  doc.setLineWidth(0.25);
  doc.roundedRect(boxX, boxY, boxW, boxH, 2, 2, "FD");

  const infoRows: Array<[string, string]> = [
    [reportLabel("reportType", locale), payload.meta.reportTitle],
    [reportLabel("period", locale), payload.meta.periodLabel],
    [reportLabel("month", locale), payload.meta.monthLabel],
    [reportLabel("generatedOn", locale), generatedMeta.dateStr],
    [reportLabel("generatedAt", locale), generatedMeta.timeStr],
    [
      reportLabel("generatedBy", locale),
      payload.meta.generatedBy || (locale === "bn" ? "কোনো ডেটা নেই" : "No Data"),
    ],
  ];

  let rowY = boxY + 8;
  infoRows.forEach(([label, value]) => {
    setPdfFont(doc, 8, C.mid);
    doc.text(`${label}:`, boxX + 6, rowY);
    setPdfFont(doc, 8.5, C.black);
    doc.text(value, boxX + boxW - 6, rowY, { align: "right", maxWidth: boxW * 0.58 });
    rowY += 7.5;
  });

  if (payload.meta.reportId) {
    setPdfFont(doc, 7.5, C.mid);
    doc.text(`${reportLabel("reportId", locale)}: ${payload.meta.reportId}`, cx, boxY + boxH + 8, {
      align: "center",
    });
  }

  setPdfFont(doc, 8, C.mid);
  doc.text(
    locale === "bn" ? "গোপনীয় ব্যবসায়িক রিপোর্ট" : "Confidential Business Report",
    cx,
    h - 28,
    { align: "center" }
  );
}

function drawCompactHeader(doc: jsPDF, payload: ReportPayload, locale: string) {
  const w = pageWidth(doc);
  setPdfFont(doc, 7.5, C.mid);
  doc.text(
    `${appBrandName(locale)} · ${payload.meta.messName} · ${payload.meta.reportTitle}`,
    PAGE_MARGIN,
    PAGE_MARGIN + 3
  );
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.2);
  doc.line(
    PAGE_MARGIN,
    PAGE_MARGIN + COMPACT_HEADER_HEIGHT - 2,
    w - PAGE_MARGIN,
    PAGE_MARGIN + COMPACT_HEADER_HEIGHT - 2
  );
}

function drawSectionTitle(doc: jsPDF, title: string, y: number) {
  const w = pageWidth(doc);
  setPdfFont(doc, 10.5, C.black);
  doc.text(title, PAGE_MARGIN, y);
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.25);
  doc.line(PAGE_MARGIN, y + 1.5, w - PAGE_MARGIN, y + 1.5);
}

function drawSummary(doc: jsPDF, payload: ReportPayload, locale: string, y: number) {
  if (!payload.summary.length) return y;
  y = ensureSpace(doc, y, 40);
  drawSectionTitle(doc, reportLabel("summary", locale), y);
  y += 5;

  const w = pageWidth(doc);
  const cols = 3;
  const gutter = 4;
  const cardWidth = (w - PAGE_MARGIN * 2 - gutter * (cols - 1)) / cols;
  const cardHeight = 14;

  payload.summary.forEach((item, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    const cardX = PAGE_MARGIN + col * (cardWidth + gutter);
    const cardY = y + row * (cardHeight + 3);

    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.2);
    doc.setFillColor(...(index % 2 === 0 ? C.light : C.white));
    doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 1.5, 1.5, "FD");

    setPdfFont(doc, 7.4, C.mid);
    doc.text(item.label, cardX + 2.5, cardY + 4.5, { maxWidth: cardWidth - 5 });
    setPdfFont(doc, 9.2, C.black);
    doc.text(
      item.value || (locale === "bn" ? "কোনো ডেটা নেই" : "No Data"),
      cardX + cardWidth - 2.5,
      cardY + 10.5,
      { align: "right", maxWidth: cardWidth - 5 }
    );
  });

  const rows = Math.ceil(payload.summary.length / cols);
  return y + rows * (cardHeight + 3) + 4;
}

function drawAnalyticsSection(
  doc: jsPDF,
  payload: ReportPayload,
  locale: string,
  currency: string,
  y: number
) {
  if (!payload.analytics) return y;

  const depositTotal = payload.analytics.depositStats?.total ?? 0;
  const expenseTotal =
    payload.analytics.expenseBreakdown?.reduce((sum, item) => sum + item.amount, 0) ?? 0;

  const hasCharts =
    (payload.analytics.expenseBreakdown?.length ?? 0) > 0 ||
    depositTotal > 0 ||
    expenseTotal > 0 ||
    payload.analytics.mealBreakdown;

  if (!hasCharts) return y;

  y = ensureSpace(doc, y, 50);
  drawSectionTitle(doc, locale === "bn" ? "ভিজ্যুয়াল সারাংশ" : "Visual Summary", y);
  y += 6;

  const w = pageWidth(doc);
  const contentWidth = w - PAGE_MARGIN * 2;
  const half = (contentWidth - 4) / 2;

  const leftEnd = drawExpenseBreakdownChart(
    doc,
    PAGE_MARGIN,
    y,
    half,
    locale === "bn" ? "খরচ বিভাজন" : "Expense Distribution",
    payload.analytics,
    locale,
    currency
  );

  const rightEnd = drawDepositVsExpenseChart(
    doc,
    PAGE_MARGIN + half + 4,
    y,
    half,
    locale === "bn" ? "জমা বনাম খরচ" : "Deposits vs Expenses",
    depositTotal,
    expenseTotal,
    locale,
    currency
  );

  y = Math.max(leftEnd, rightEnd) + 4;

  y = drawMealBreakdownChart(
    doc,
    PAGE_MARGIN,
    y,
    contentWidth,
    locale === "bn" ? "মিল বিভাজন" : "Meal Breakdown",
    payload.analytics,
    locale
  );

  return y + 2;
}

function buildBodyRows(
  section: ReportSection,
  currency: string,
  locale: string
): CellInput[][] {
  return section.rows.map((row) =>
    section.columns.map((col) => formatCellValue(row[col.key], col, currency, locale))
  );
}

function drawTableSection(
  doc: jsPDF,
  section: ReportSection,
  locale: string,
  currency: string,
  y: number,
  orientation: "portrait" | "landscape",
  payload: ReportPayload
) {
  const w = pageWidth(doc);
  const tableWidth = w - PAGE_MARGIN * 2;
  y = ensureSpace(doc, y, 22);
  drawSectionTitle(doc, section.title, y);
  y += 4;

  if (!section.rows.length) {
    doc.setDrawColor(...C.border);
    doc.roundedRect(PAGE_MARGIN, y + 2, tableWidth, 16, 1.5, 1.5);
    setPdfFont(doc, 9, C.mid);
    doc.text(section.emptyMessage || reportLabel("noData", locale), w / 2, y + 12, {
      align: "center",
    });
    return y + 22;
  }

  autoTable(doc, {
    startY: y + 1,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN, top: PAGE_MARGIN + COMPACT_HEADER_HEIGHT, bottom: FOOTER_HEIGHT },
    tableWidth,
    head: [section.columns.map((col) => col.label)],
    body: buildBodyRows(section, currency, locale),
    theme: "grid",
    showHead: "everyPage",
    rowPageBreak: "avoid",
    styles: {
      font: PDF_FONT,
      fontStyle: "normal",
      fontSize: orientation === "landscape" ? 7 : 7.4,
      cellPadding: { top: 2, right: 2, bottom: 2, left: 2 },
      overflow: "linebreak",
      textColor: C.black,
      lineColor: C.border,
      lineWidth: 0.15,
      valign: "middle",
      minCellHeight: 6,
    },
    headStyles: {
      fillColor: C.light,
      textColor: C.black,
      font: PDF_FONT,
      fontStyle: "normal",
      fontSize: orientation === "landscape" ? 7.2 : 7.6,
      lineColor: C.border,
      lineWidth: 0.2,
    },
    alternateRowStyles: { fillColor: C.lightAlt },
    columnStyles: columnWidthStyles(section.columns, tableWidth, orientation),
    didDrawPage: (data) => {
      if (data.pageNumber > 1) {
        drawCompactHeader(doc, payload, locale);
      }
    },
  });

  return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
}

function drawPageFooter(
  doc: jsPDF,
  page: number,
  pageCount: number,
  payload: ReportPayload,
  locale: string,
  timestampStr: string
) {
  const w = pageWidth(doc);
  const h = pageHeight(doc);
  const footerTop = h - 13;

  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.25);
  doc.line(PAGE_MARGIN, footerTop, w - PAGE_MARGIN, footerTop);

  setPdfFont(doc, 7, C.mid);
  doc.text(
    locale === "bn" ? `${appBrandName(locale)} দ্বারা প্রস্তুত` : `Generated by ${appBrandName(locale)}`,
    PAGE_MARGIN,
    footerTop + 4.5
  );

  const center = payload.meta.reportId
    ? `${reportLabel("reportId", locale)}: ${payload.meta.reportId} · ${timestampStr}`
    : timestampStr;
  doc.text(center, w / 2, footerTop + 4.5, { align: "center" });

  doc.text(
    `${reportLabel("page", locale)} ${page} ${reportLabel("of", locale)} ${pageCount}`,
    w - PAGE_MARGIN,
    footerTop + 4.5,
    { align: "right" }
  );
}

function validatePdfDocument(doc: jsPDF): void {
  if (doc.getNumberOfPages() < 1) {
    throw new Error("PDF generation produced an empty document.");
  }
}

export async function buildReportPdf(
  rawPayload: ReportPayload,
  locale: string,
  orientation: "portrait" | "landscape" = "portrait"
): Promise<{ doc: jsPDF; filename: string }> {
  const payload = localizeReportPayload(rawPayload, locale);
  const currency = payload.meta.currency ?? "BDT";
  const logo = await loadLogoImage();

  const doc = new jsPDF({
    orientation,
    unit: "mm",
    format: "a4",
    compress: true,
    putOnlyUsedFonts: false,
  });

  await applyPdfFont(doc);
  doc.text("MessFlow Pro মেসফ্লো প্রো", -100, -100);

  const generatedMeta = getGeneratedStrings(locale, payload.meta.generatedAt);

  await drawCoverPage(doc, payload, locale, generatedMeta, logo);
  doc.addPage();

  let y = PAGE_MARGIN + COMPACT_HEADER_HEIGHT;
  drawCompactHeader(doc, payload, locale);

  y = drawSummary(doc, payload, locale, y);
  y = drawAnalyticsSection(doc, payload, locale, currency, y);

  const sections: ReportSection[] =
    payload.sections && payload.sections.length
      ? payload.sections
      : payload.columns.length
        ? [
            {
              key: "main",
              title: reportLabel("dataTable", locale),
              columns: payload.columns,
              rows: payload.rows,
              emptyMessage: payload.emptyState?.description,
            },
          ]
        : [];

  if (!sections.length) {
    y = ensureSpace(doc, y, 28);
    const w = pageWidth(doc);
    doc.setDrawColor(...C.border);
    doc.roundedRect(PAGE_MARGIN, y, w - PAGE_MARGIN * 2, 24, 2, 2);
    setPdfFont(doc, 11, C.black);
    doc.text(payload.emptyState?.title || reportLabel("noData", locale), w / 2, y + 9, {
      align: "center",
    });
    setPdfFont(doc, 8.5, C.mid);
    doc.text(
      payload.emptyState?.description || reportLabel("noData", locale),
      w / 2,
      y + 15,
      { align: "center", maxWidth: w - PAGE_MARGIN * 2 - 8 }
    );
  } else {
    for (const section of sections) {
      y = drawTableSection(doc, section, locale, currency, y, orientation, payload);
    }
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    drawPageFooter(doc, i, pageCount, payload, locale, generatedMeta.timestampStr);
  }

  validatePdfDocument(doc);
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
