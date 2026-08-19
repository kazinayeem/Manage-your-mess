import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { rateLimit } from "@/lib/redis";

export async function validateApiKey(apiKey: string): Promise<boolean> {
  const expected = process.env.MESSFLOW_API_KEY;
  if (!expected || !apiKey) return false;
  try {
    const a = Buffer.from(apiKey);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function validateWebhookSignature(
  payload: string,
  signature: string | null
): boolean {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  const sig = signature.replace(/^sha256=/, "");
  try {
    const a = Buffer.from(sig, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function rateLimitApi(ip: string, route: string) {
  const key = `api:${route}:${ip}`;
  return rateLimit(key, 60, 60);
}
