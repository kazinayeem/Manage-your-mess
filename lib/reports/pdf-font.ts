import type { jsPDF } from "jspdf";

export const PDF_FONT = "NotoSansBengali";
const FONT_FILE = "NotoSansBengali-Regular.ttf";

let cachedBase64: string | null = null;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 8192;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export async function loadPdfFontBase64(): Promise<string> {
  if (cachedBase64) return cachedBase64;
  const response = await fetch("/fonts/NotoSansBengali-Regular.ttf");
  if (!response.ok) {
    throw new Error("Failed to load Bangla font for PDF export.");
  }
  cachedBase64 = arrayBufferToBase64(await response.arrayBuffer());
  return cachedBase64;
}

/** Embed Noto Sans Bengali (supports Bangla + Latin). Never use fake bold — use font size for emphasis. */
export async function applyPdfFont(doc: jsPDF): Promise<void> {
  const base64 = await loadPdfFontBase64();
  const docWithVfs = doc as jsPDF & { existsFileInVFS?: (name: string) => boolean };
  if (!docWithVfs.existsFileInVFS?.(FONT_FILE)) {
    doc.addFileToVFS(FONT_FILE, base64);
    doc.addFont(FONT_FILE, PDF_FONT, "normal");
  }
  doc.setFont(PDF_FONT, "normal");
}

export function setPdfFont(doc: jsPDF, size: number, color: [number, number, number] = [0, 0, 0]) {
  doc.setFont(PDF_FONT, "normal");
  doc.setFontSize(size);
  doc.setTextColor(...color);
}
