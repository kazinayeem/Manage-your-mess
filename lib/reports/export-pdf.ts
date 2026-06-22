import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { ReportColumn, ReportPayload } from "@/lib/reports/types";
import { reportLabel, formatReportCurrency } from "@/lib/reports/labels";

const FONT_NAME = "NotoSansBengali";
const FONT_FILE = "NotoSansBengali-Regular.ttf";
let fontLoaded = false;

async function ensureBengaliFont(doc: jsPDF): Promise<void> {
  if (fontLoaded) {
    doc.setFont(FONT_NAME, "normal");
    return;
  }
  const response = await fetch("/fonts/NotoSansBengali-Regular.ttf");
  if (!response.ok) throw new Error("Failed to load Bengali font");
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  doc.addFileToVFS(FONT_FILE, btoa(binary));
  doc.addFont(FONT_FILE, FONT_NAME, "normal");
  fontLoaded = true;
  doc.setFont(FONT_NAME, "normal");
}

function formatCellValue(
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

function slugifyFilename(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function drawPieChart(
  doc: jsPDF,
  cx: number,
  cy: number,
  r: number,
  slices: { label: string; amount: number }[],
  locale: string
) {
  const total = slices.reduce((s, x) => s + x.amount, 0);
  if (total <= 0) return;
  const colors: [number, number, number][] = [
    [5, 150, 105],
    [14, 165, 233],
    [245, 158, 11],
    [239, 68, 68],
    [139, 92, 246],
    [100, 116, 139],
  ];
  let startAngle = 0;
  slices.forEach((slice, i) => {
    const angle = (slice.amount / total) * Math.PI * 2;
    const endAngle = startAngle + angle;
    const [rC, gC, bC] = colors[i % colors.length];
    doc.setFillColor(rC, gC, bC);
    doc.triangle(
      cx,
      cy,
      cx + r * Math.cos(startAngle),
      cy + r * Math.sin(startAngle),
      cx + r * Math.cos(endAngle),
      cy + r * Math.sin(endAngle),
      "F"
    );
    startAngle = endAngle;
  });
  doc.setFontSize(7);
  doc.setTextColor(60, 60, 60);
  slices.forEach((slice, i) => {
    const pct = Math.round((slice.amount / total) * 100);
    doc.text(`${slice.label}: ${pct}%`, cx + r + 4, cy - r + 6 + i * 5);
  });
}

export async function generateReportPdf(
  payload: ReportPayload,
  locale: string,
  orientation: "portrait" | "landscape" = "portrait"
): Promise<void> {
  const useBengali = locale === "bn";
  const currency = payload.meta.currency ?? "BDT";
  const doc = new jsPDF({ orientation, unit: "mm", format: "a4" });

  if (useBengali) await ensureBengaliFont(doc);
  else doc.setFont("helvetica", "normal");

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const generated = new Date(payload.meta.generatedAt);
  const dateStr = generated.toLocaleDateString(locale === "bn" ? "bn-BD" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = generated.toLocaleTimeString(locale === "bn" ? "bn-BD" : "en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  // Header band
  doc.setFillColor(5, 150, 105);
  doc.rect(0, 0, pageWidth, 38, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text("MessFlow Pro", margin, 10);
  doc.setFontSize(15);
  doc.text(payload.meta.messName, margin, 18);
  doc.setFontSize(10);
  doc.text(payload.meta.reportTitle, margin, 26);
  doc.setFontSize(8);
  if (payload.meta.messAddress) {
    doc.text(payload.meta.messAddress, margin, 32);
  }

  doc.setTextColor(30, 30, 30);
  let y = 46;

  // Meta block
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  const metaLines = [
    `${reportLabel("generatedOn", locale)}: ${dateStr}`,
    `${reportLabel("generatedAt", locale)}: ${timeStr}`,
    `${reportLabel("reportType", locale)}: ${payload.meta.reportTitle}`,
    payload.meta.generatedBy
      ? `${reportLabel("generatedBy", locale)}: ${payload.meta.generatedBy}`
      : null,
    payload.meta.dateRangeLabel ? `Period: ${payload.meta.dateRangeLabel}` : null,
    payload.meta.reportId ? `${reportLabel("reportId", locale)}: ${payload.meta.reportId}` : null,
  ].filter(Boolean) as string[];

  metaLines.forEach((line) => {
    doc.text(line, margin, y);
    y += 4.5;
  });
  y += 4;

  // Summary cards
  if (payload.summary.length > 0) {
    doc.setFontSize(10);
    doc.setTextColor(5, 150, 105);
    doc.text(reportLabel("summary", locale), margin, y);
    y += 5;

    const colCount = orientation === "landscape" ? 4 : 3;
    const boxWidth = (pageWidth - margin * 2 - (colCount - 1) * 3) / colCount;
    let col = 0;
    let rowY = y;

    payload.summary.forEach((item, i) => {
      const x = margin + (i % colCount) * (boxWidth + 3);
      if (i > 0 && i % colCount === 0) rowY += 14;

      doc.setFillColor(236, 253, 245);
      doc.roundedRect(x, rowY, boxWidth, 12, 1.5, 1.5, "F");
      doc.setFontSize(6.5);
      doc.setTextColor(100, 100, 100);
      doc.text(item.label, x + 2.5, rowY + 4.5);
      doc.setFontSize(8.5);
      doc.setTextColor(30, 30, 30);
      doc.text(item.value, x + 2.5, rowY + 9.5);
    });

    const summaryRows = Math.ceil(payload.summary.length / colCount);
    y = rowY + summaryRows * 14 + 4;
  }

  // Expense pie chart (simple)
  if (payload.analytics?.expenseBreakdown && payload.analytics.expenseBreakdown.length > 0) {
    const topSlices = payload.analytics.expenseBreakdown
      .filter((x) => x.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);
    if (topSlices.length > 0) {
      doc.setFontSize(9);
      doc.setTextColor(5, 150, 105);
      doc.text(locale === "bn" ? "খরচ বিভাজন" : "Expense Breakdown", margin, y);
      y += 4;
      drawPieChart(doc, margin + 18, y + 14, 12, topSlices, locale);
      y += 32;
    }
  }

  // Data table
  if (payload.rows.length > 0) {
    const head = [payload.columns.map((c) => c.label)];
    const body = payload.rows.map((row) =>
      payload.columns.map((col) => formatCellValue(row[col.key] ?? "", col, currency, locale))
    );

    autoTable(doc, {
      startY: y,
      head,
      body,
      margin: { left: margin, right: margin },
      styles: {
        font: useBengali ? FONT_NAME : "helvetica",
        fontSize: orientation === "landscape" ? 7 : 8,
        cellPadding: 2,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [5, 150, 105],
        textColor: 255,
        fontStyle: "normal",
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: Object.fromEntries(
        payload.columns.map((col, i) => [i, { halign: col.align ?? "left" }])
      ),
    });
  } else {
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text(reportLabel("noData", locale), margin, y + 6);
  }

  // Footer all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageH = doc.internal.pageSize.getHeight();
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, pageH - 14, pageWidth - margin, pageH - 14);
    doc.setFontSize(7);
    doc.setTextColor(140, 140, 140);
    doc.text(reportLabel("footer", locale), margin, pageH - 9);
    doc.text(
      `${reportLabel("page", locale)} ${i} ${reportLabel("of", locale)} ${pageCount}`,
      pageWidth - margin,
      pageH - 9,
      { align: "right" }
    );
    if (payload.meta.reportId) {
      doc.text(payload.meta.reportId, pageWidth / 2, pageH - 9, { align: "center" });
    }
    doc.setFontSize(6);
    doc.text(`${dateStr} ${timeStr}`, pageWidth / 2, pageH - 5, { align: "center" });
  }

  const filename = `${slugifyFilename(payload.meta.messName)}-${slugifyFilename(payload.meta.reportTitle)}.pdf`;
  doc.save(filename);
}

export async function printReportPdf(payload: ReportPayload, locale: string): Promise<void> {
  await generateReportPdf(payload, locale);
}
