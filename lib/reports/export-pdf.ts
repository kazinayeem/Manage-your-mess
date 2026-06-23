import { jsPDF } from "jspdf";
import autoTable, { type CellInput } from "jspdf-autotable";
import type { ReportColumn, ReportPayload, ReportSection } from "@/lib/reports/types";
import { reportLabel, formatReportCurrency, appBrandName } from "@/lib/reports/labels";
import { localizeReportPayload } from "@/lib/reports/localize-payload";

const FONT_NAME = "NotoSansBengali";
const FONT_FILE = "NotoSansBengali-Regular.ttf";

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
const FOOTER_HEIGHT = 18;

let cachedFontBase64: string | null = null;

async function loadFontBase64(): Promise<string> {
  if (cachedFontBase64) return cachedFontBase64;
  const response = await fetch("/fonts/NotoSansBengali-Regular.ttf");
  if (!response.ok) throw new Error("Failed to load embedded report font.");
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  cachedFontBase64 = btoa(binary);
  return cachedFontBase64;
}

async function applyFont(doc: jsPDF): Promise<string> {
  const base64 = await loadFontBase64();
  if (!(doc as unknown as { existsFileInVFS?: (name: string) => boolean }).existsFileInVFS?.(FONT_FILE)) {
    doc.addFileToVFS(FONT_FILE, base64);
    doc.addFont(FONT_FILE, FONT_NAME, "normal");
    doc.addFont(FONT_FILE, FONT_NAME, "bold");
  }
  doc.setFont(FONT_NAME, "normal");
  return FONT_NAME;
}

function formatCellValue(value: string | number, col: ReportColumn, currency: string, locale: string): string {
  if (value === null || value === undefined || value === "") return "—";
  if (col.format === "currency" && typeof value === "number") {
    return formatReportCurrency(value, currency, locale, { suffix: currency !== "BDT" });
  }
  if (col.format === "number" && typeof value === "number") {
    return value.toLocaleString(locale === "bn" ? "bn-BD" : "en-US");
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
      second: "2-digit",
    }),
  };
}

function ensureSpace(doc: jsPDF, y: number, needed: number) {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed <= pageHeight - FOOTER_HEIGHT) return y;
  doc.addPage();
  return PAGE_MARGIN;
}

function drawSectionTitle(doc: jsPDF, title: string, y: number, pageWidth: number) {
  doc.setFont(FONT_NAME, "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...C.black);
  doc.text(title, PAGE_MARGIN, y);
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.25);
  doc.line(PAGE_MARGIN, y + 1.5, pageWidth - PAGE_MARGIN, y + 1.5);
  doc.setFont(FONT_NAME, "normal");
}

function drawHeader(
  doc: jsPDF,
  payload: ReportPayload,
  locale: string,
  generatedMeta: ReturnType<typeof getGeneratedStrings>
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - PAGE_MARGIN * 2;
  let y = PAGE_MARGIN;

  doc.setFillColor(...C.black);
  doc.roundedRect(PAGE_MARGIN, y, 15, 15, 2, 2, "F");
  doc.setFont(FONT_NAME, "bold");
  doc.setTextColor(...C.white);
  doc.setFontSize(10);
  doc.text("MF", PAGE_MARGIN + 7.5, y + 9.5, { align: "center" });

  doc.setTextColor(...C.black);
  doc.setFontSize(8.5);
  doc.text(appBrandName(locale), PAGE_MARGIN + 20, y + 4);
  doc.setFontSize(15.5);
  doc.text(payload.meta.messName, PAGE_MARGIN + 20, y + 10);
  doc.setFont(FONT_NAME, "normal");
  doc.setFontSize(8.5);
  const address = payload.meta.messAddress || payload.emptyState?.description || reportLabel("confidential", locale);
  doc.setTextColor(...C.mid);
  doc.text(address, PAGE_MARGIN + 20, y + 14.5, {
    maxWidth: contentWidth - 20,
  });

  y += 20;

  doc.setDrawColor(...C.black);
  doc.setLineWidth(0.45);
  doc.line(PAGE_MARGIN, y, pageWidth - PAGE_MARGIN, y);
  y += 5;

  doc.setFont(FONT_NAME, "bold");
  doc.setFontSize(12.5);
  doc.setTextColor(...C.black);
  doc.text(payload.meta.reportTitle, PAGE_MARGIN, y);

  const metaRows: Array<[string, string]> = [
    [reportLabel("generatedOn", locale), generatedMeta.dateStr],
    [reportLabel("generatedAt", locale), generatedMeta.timeStr],
    [reportLabel("generatedBy", locale), payload.meta.generatedBy || "—"],
    [reportLabel("language", locale), payload.meta.language || locale],
    [reportLabel("period", locale), payload.meta.periodLabel],
    [reportLabel("month", locale), payload.meta.monthLabel],
  ];

  const boxX = pageWidth - PAGE_MARGIN - 74;
  const boxY = y - 6;
  doc.setLineWidth(0.2);
  doc.setDrawColor(...C.border);
  doc.roundedRect(boxX, boxY, 74, 32, 1.5, 1.5);

  doc.setFont(FONT_NAME, "normal");
  doc.setFontSize(7.5);
  metaRows.forEach(([label, value], index) => {
    const rowY = boxY + 5 + index * 4.6;
    doc.setTextColor(...C.mid);
    doc.text(`${label}:`, boxX + 2.5, rowY);
    doc.setTextColor(...C.black);
    doc.text(value, boxX + 28, rowY, { maxWidth: 43 });
  });

  if (payload.meta.reportId) {
    y += 7;
    doc.setFont(FONT_NAME, "normal");
    doc.setFontSize(8);
    doc.setTextColor(...C.dark);
    doc.text(`${reportLabel("reportId", locale)}: ${payload.meta.reportId}`, PAGE_MARGIN, y);
  }

  return Math.max(y + 10, boxY + 36);
}

function drawSummary(doc: jsPDF, payload: ReportPayload, locale: string, y: number, pageWidth: number) {
  if (!payload.summary.length) return y;
  y = ensureSpace(doc, y, 38);
  drawSectionTitle(doc, reportLabel("summary", locale), y, pageWidth);
  y += 4;

  const cols = 3;
  const gutter = 4;
  const cardWidth = (pageWidth - PAGE_MARGIN * 2 - gutter * (cols - 1)) / cols;
  const cardHeight = 13.5;

  payload.summary.forEach((item, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    const cardX = PAGE_MARGIN + col * (cardWidth + gutter);
    const cardY = y + row * (cardHeight + 3);
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.2);
    doc.setFillColor(...(index % 2 === 0 ? C.light : C.white));
    doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 1.5, 1.5, "FD");
    doc.setFont(FONT_NAME, "normal");
    doc.setFontSize(7.6);
    doc.setTextColor(...C.mid);
    doc.text(item.label, cardX + 2.5, cardY + 4.5, { maxWidth: cardWidth - 5 });
    doc.setFont(FONT_NAME, "bold");
    doc.setFontSize(9.4);
    doc.setTextColor(...C.black);
    doc.text(item.value, cardX + cardWidth - 2.5, cardY + 10, { align: "right", maxWidth: cardWidth - 5 });
  });

  const rows = Math.ceil(payload.summary.length / cols);
  return y + rows * (cardHeight + 3) + 3;
}

function buildBodyRows(section: ReportSection, currency: string, locale: string): CellInput[][] {
  return section.rows.map((row) =>
    section.columns.map((col) => formatCellValue(row[col.key] ?? "", col, currency, locale))
  );
}

function drawTableSection(
  doc: jsPDF,
  section: ReportSection,
  locale: string,
  currency: string,
  y: number,
  orientation: "portrait" | "landscape"
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  y = ensureSpace(doc, y, 24);
  drawSectionTitle(doc, section.title, y, pageWidth);
  y += 3.5;

  if (!section.rows.length) {
    doc.setDrawColor(...C.border);
    doc.roundedRect(PAGE_MARGIN, y + 2, pageWidth - PAGE_MARGIN * 2, 18, 1.5, 1.5);
    doc.setFont(FONT_NAME, "normal");
    doc.setFontSize(9);
    doc.setTextColor(...C.mid);
    doc.text(section.emptyMessage || reportLabel("noData", locale), pageWidth / 2, y + 13, {
      align: "center",
    });
    return y + 24;
  }

  autoTable(doc, {
    startY: y + 2,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN, top: PAGE_MARGIN, bottom: FOOTER_HEIGHT },
    head: [section.columns.map((col) => col.label)],
    body: buildBodyRows(section, currency, locale),
    theme: "grid",
    showHead: "everyPage",
    rowPageBreak: "avoid",
    styles: {
      font: FONT_NAME,
      fontStyle: "normal",
      fontSize: orientation === "landscape" ? 7 : 7.6,
      cellPadding: { top: 2.2, right: 2.3, bottom: 2.2, left: 2.3 },
      overflow: "linebreak",
      textColor: C.black,
      lineColor: C.border,
      lineWidth: 0.15,
      valign: "middle",
    },
    headStyles: {
      fillColor: C.light,
      textColor: C.black,
      font: FONT_NAME,
      fontStyle: "bold",
      lineColor: C.border,
      lineWidth: 0.2,
    },
    alternateRowStyles: { fillColor: C.lightAlt },
    columnStyles: Object.fromEntries(
      section.columns.map((col, index) => [
        index,
        {
          halign: col.align ?? (col.format === "currency" || col.format === "number" ? "right" : "left"),
          cellWidth: "wrap",
        },
      ])
    ),
  });

  return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 7;
}

function drawPageFooter(
  doc: jsPDF,
  page: number,
  pageCount: number,
  payload: ReportPayload,
  locale: string,
  timestampStr: string
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerTop = pageHeight - 15;

  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.3);
  doc.line(PAGE_MARGIN, footerTop, pageWidth - PAGE_MARGIN, footerTop);

  doc.setFont(FONT_NAME, "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(...C.mid);
  doc.text(
    locale === "bn" ? `${appBrandName(locale)} দ্বারা প্রস্তুত` : `Generated by ${appBrandName(locale)}`,
    PAGE_MARGIN,
    footerTop + 5
  );

  const center = payload.meta.reportId
    ? `${reportLabel("reportId", locale)}: ${payload.meta.reportId} · ${timestampStr}`
    : timestampStr;
  doc.text(center, pageWidth / 2, footerTop + 5, { align: "center" });

  doc.text(
    `${reportLabel("page", locale)} ${page} ${reportLabel("of", locale)} ${pageCount}`,
    pageWidth - PAGE_MARGIN,
    footerTop + 5,
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
  const doc = new jsPDF({
    orientation,
    unit: "mm",
    format: "a4",
    putOnlyUsedFonts: true,
    compress: true,
  });

  await applyFont(doc);

  const pageWidth = doc.internal.pageSize.getWidth();
  const generatedMeta = getGeneratedStrings(locale, payload.meta.generatedAt);
  let y = drawHeader(doc, payload, locale, generatedMeta);

  y = drawSummary(doc, payload, locale, y, pageWidth);

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
    doc.setDrawColor(...C.border);
    doc.roundedRect(PAGE_MARGIN, y, pageWidth - PAGE_MARGIN * 2, 24, 2, 2);
    doc.setFont(FONT_NAME, "bold");
    doc.setFontSize(11);
    doc.setTextColor(...C.black);
    doc.text(payload.emptyState?.title || reportLabel("noData", locale), pageWidth / 2, y + 9, {
      align: "center",
    });
    doc.setFont(FONT_NAME, "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...C.mid);
    doc.text(
      payload.emptyState?.description || reportLabel("noData", locale),
      pageWidth / 2,
      y + 15,
      { align: "center", maxWidth: pageWidth - PAGE_MARGIN * 2 - 8 }
    );
  } else {
    for (const section of sections) {
      y = drawTableSection(doc, section, locale, currency, y, orientation);
    }
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    drawPageFooter(doc, i, pageCount, payload, locale, generatedMeta.timestampStr);
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
