import { mkdir, writeFile } from "fs/promises";
import path from "path";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function saveBazaarFile(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (file.size > MAX_SIZE) throw new Error("File must be under 10MB");
  if (file.type && !ALLOWED_TYPES.has(file.type)) {
    throw new Error("Only images and PDF files are allowed");
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const dir = path.join(process.cwd(), "public", "uploads", "bazaar");
  await mkdir(dir, { recursive: true });
  const filename = `bazaar-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  await writeFile(path.join(dir, filename), buffer);
  return `/uploads/bazaar/${filename}`;
}

export async function saveBazaarFiles(files: File[]): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    const url = await saveBazaarFile(file);
    if (url) urls.push(url);
  }
  return urls;
}
