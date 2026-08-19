import type { Response } from "express";

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = "Success",
  status = 200
) {
  return res.status(status).json({ success: true, message, data });
}

export function sendList<T>(
  res: Response,
  data: T[],
  meta: { page?: number; limit?: number; total: number; totalPages?: number },
  message = "Success"
) {
  const page = meta.page ?? 1;
  const limit = meta.limit ?? 0;
  const totalPages =
    meta.totalPages ?? (limit > 0 ? Math.ceil(meta.total / limit) : meta.total > 0 ? 1 : 0);
  return res.status(200).json({
    success: true,
    message,
    data,
    meta: { page, limit, total: meta.total, totalPages },
  });
}

export function sendMessage(res: Response, message: string, status = 200) {
  return res.status(status).json({ success: true, message, data: null });
}

export function sendError(res: Response, message: string, code: string, details?: unknown, status = 400) {
  return res.status(status).json({ success: false, message, error: { code, details } });
}