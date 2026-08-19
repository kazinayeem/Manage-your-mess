import type { jsPDF } from "jspdf";
import type { ReportAnalytics } from "@/lib/reports/types";
import { formatReportCurrency } from "@/lib/reports/labels";
import { PDF_FONT } from "@/lib/reports/pdf-font";

const C = {
  black: [0, 0, 0] as [number, number, number],
  mid: [95, 95, 95] as [number, number, number],
  bar: [38, 38, 38] as [number, number, number],
  barAlt: [120, 120, 120] as [number, number, number],
  grid: [210, 210, 210] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

type ChartPalette = typeof C;

function drawBarRow(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  label: string,
  value: number,
  max: number,
  locale: string,
  currency: string,
  palette: ChartPalette = C
) {
  const barMaxWidth = width * 0.55;
  const ratio = max > 0 ? Math.min(value / max, 1) : 0;
  const barWidth = Math.max(ratio * barMaxWidth, value > 0 ? 2 : 0);

  doc.setFont(PDF_FONT, "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...palette.mid);
  doc.text(label, x, y + 3.5, { maxWidth: width * 0.32 });

  const barX = x + width * 0.34;
  doc.setDrawColor(...palette.grid);
  doc.setFillColor(...palette.white);
  doc.roundedRect(barX, y, barMaxWidth, 5, 0.8, 0.8, "S");
  if (barWidth > 0) {
    doc.setFillColor(...palette.bar);
    doc.roundedRect(barX, y, barWidth, 5, 0.8, 0.8, "F");
  }

  doc.setTextColor(...palette.black);
  doc.text(formatReportCurrency(value, currency, locale), x + width - 1, y + 3.5, {
    align: "right",
  });
}

export function drawExpenseBreakdownChart(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  title: string,
  analytics: ReportAnalytics | undefined,
  locale: string,
  currency: string
): number {
  const items = analytics?.expenseBreakdown?.filter((i) => i.amount > 0) ?? [];
  if (!items.length) return y;

  doc.setFont(PDF_FONT, "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...C.black);
  doc.text(title, x, y);
  y += 5;

  const max = Math.max(...items.map((i) => i.amount), 1);
  const top = items.slice(0, 6);
  top.forEach((item, index) => {
    drawBarRow(doc, x, y + index * 7.5, width, item.label, item.amount, max, locale, currency);
  });

  return y + top.length * 7.5 + 4;
}

export function drawDepositVsExpenseChart(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  title: string,
  depositTotal: number,
  expenseTotal: number,
  locale: string,
  currency: string
): number {
  if (depositTotal <= 0 && expenseTotal <= 0) return y;

  doc.setFont(PDF_FONT, "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...C.black);
  doc.text(title, x, y);
  y += 5;

  const max = Math.max(depositTotal, expenseTotal, 1);
  const labels =
    locale === "bn"
      ? { deposits: "মোট জমা", expenses: "মোট খরচ" }
      : { deposits: "Total Deposits", expenses: "Total Expenses" };

  drawBarRow(doc, x, y, width, labels.deposits, depositTotal, max, locale, currency);
  drawBarRow(doc, x, y + 8, width, labels.expenses, expenseTotal, max, locale, currency, {
    ...C,
    bar: C.barAlt,
  });

  return y + 20;
}

export function drawMealBreakdownChart(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  title: string,
  analytics: ReportAnalytics | undefined,
  locale: string
): number {
  const meal = analytics?.mealBreakdown;
  if (!meal) return y;

  const rows = [
    { label: locale === "bn" ? "সকাল" : "Breakfast", value: meal.breakfast },
    { label: locale === "bn" ? "দুপুর" : "Lunch", value: meal.lunch },
    { label: locale === "bn" ? "রাত" : "Dinner", value: meal.dinner },
  ].filter((r) => r.value > 0);

  if (!rows.length) return y;

  doc.setFont(PDF_FONT, "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...C.black);
  doc.text(title, x, y);
  y += 5;

  const max = Math.max(...rows.map((r) => r.value), 1);
  rows.forEach((row, index) => {
    const barMaxWidth = width * 0.55;
    const barWidth = (row.value / max) * barMaxWidth;
    const rowY = y + index * 7.5;

    doc.setFontSize(7.5);
    doc.setTextColor(...C.mid);
    doc.text(row.label, x, rowY + 3.5);

    const barX = x + width * 0.34;
    doc.setDrawColor(...C.grid);
    doc.setFillColor(...C.white);
    doc.roundedRect(barX, rowY, barMaxWidth, 5, 0.8, 0.8, "S");
    doc.setFillColor(...C.bar);
    doc.roundedRect(barX, rowY, Math.max(barWidth, 2), 5, 0.8, 0.8, "F");

    doc.setTextColor(...C.black);
    doc.text(String(row.value), x + width - 1, rowY + 3.5, { align: "right" });
  });

  return y + rows.length * 7.5 + 4;
}
