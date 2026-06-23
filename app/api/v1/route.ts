import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { validateApiKey, rateLimitApi } from "@/lib/api-security";

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const { allowed } = await rateLimitApi(ip, "v1-get");
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const messes = await db.member.findMany({
    where: { userId: session.user.id, deletedAt: null },
    include: { mess: true },
  });

  return NextResponse.json({ user: session.user, messes });
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const { allowed } = await rateLimitApi(ip, "v1-post");
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const apiKey = request.headers.get("x-api-key");
  if (!apiKey || !(await validateApiKey(apiKey))) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  const body = await request.json();
  return NextResponse.json({ received: true, data: body });
}
