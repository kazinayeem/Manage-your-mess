import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateWebhookSignature, rateLimitApi } from "@/lib/api-security";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const { allowed } = await rateLimitApi(ip, "webhooks");
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-webhook-signature");
  if (!validateWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  await db.auditLog.create({
    data: {
      action: "CREATE",
      entity: "Webhook",
      newData: JSON.stringify(body),
    },
  });

  return NextResponse.json({ success: true });
}
