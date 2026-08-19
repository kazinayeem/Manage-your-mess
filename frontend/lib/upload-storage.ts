import "server-only";

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

const STORAGE_ROOT = path.join(process.cwd(), "storage", "uploads");

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const ALLOWED_DOC_TYPES = new Set(["application/pdf"]);

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
};

const BLOCKED_EXTENSIONS = new Set([
  "exe",
  "sh",
  "bat",
  "cmd",
  "php",
  "js",
  "html",
  "svg",
  "wasm",
]);

export type UploadCategory = "bazaar" | "payments";

function maxSizeFor(category: UploadCategory) {
  return category === "payments" ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
}

function allowedTypesFor(category: UploadCategory) {
  return category === "payments"
    ? ALLOWED_IMAGE_TYPES
    : new Set([...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOC_TYPES]);
}

/** Returns API path to fetch the file (auth-protected). */
export async function saveSecureUpload(
  file: File | null,
  category: UploadCategory
): Promise<string | null> {
  if (!file || file.size === 0) return null;

  const maxSize = maxSizeFor(category);
  if (file.size > maxSize) {
    throw new Error(`File must be under ${Math.round(maxSize / (1024 * 1024))}MB`);
  }

  const allowed = allowedTypesFor(category);
  const mime = file.type || "application/octet-stream";
  if (!allowed.has(mime)) {
    throw new Error("File type not allowed");
  }

  const rawExt = file.name.split(".").pop()?.toLowerCase() || "";
  if (BLOCKED_EXTENSIONS.has(rawExt)) {
    throw new Error("File extension not allowed");
  }

  const ext = EXT_BY_MIME[mime] ?? rawExt;
  if (!ext || BLOCKED_EXTENSIONS.has(ext)) {
    throw new Error("Invalid file extension");
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Magic-byte checks for common types
  if (mime === "image/jpeg" && buffer[0] !== 0xff) throw new Error("Invalid JPEG file");
  if (mime === "image/png" && buffer.toString("ascii", 0, 4) !== "\x89PNG") {
    throw new Error("Invalid PNG file");
  }
  if (mime === "application/pdf" && buffer.toString("ascii", 0, 4) !== "%PDF") {
    throw new Error("Invalid PDF file");
  }

  const dir = path.join(STORAGE_ROOT, category);
  await mkdir(dir, { recursive: true });
  const filename = `${Date.now()}-${randomBytes(8).toString("hex")}.${ext}`;
  await writeFile(path.join(dir, filename), buffer);

  return `/api/files/${category}/${filename}`;
}

export function resolveStoragePath(category: string, filename: string): string | null {
  if (!/^[a-z0-9._-]+$/i.test(filename)) return null;
  if (filename.includes("..")) return null;
  const allowed = new Set(["bazaar", "payments"]);
  if (!allowed.has(category)) return null;
  return path.join(STORAGE_ROOT, category, filename);
}

/** Legacy public URLs still served from public/uploads for backwards compatibility */
export function isLegacyPublicUpload(url: string) {
  return url.startsWith("/uploads/");
}
