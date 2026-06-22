import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("x-webhook-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  const body = await request.json();

  await db.auditLog.create({
    data: {
      action: "CREATE",
      entity: "Webhook",
      newData: JSON.stringify(body),
    },
  });

  return NextResponse.json({ success: true });
}
