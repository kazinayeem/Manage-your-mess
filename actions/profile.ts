"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/mess-access";
import { routing } from "@/i18n/routing";

type ActionResult = { success: true } | { success: false; error: string };

export async function updateUserLocale(locale: string): Promise<ActionResult> {
  try {
    const user = await requireAuth();
    if (!routing.locales.includes(locale as "en" | "bn")) {
      return { success: false, error: "Invalid language" };
    }
    await db.user.update({
      where: { id: user.id },
      data: { locale },
    });

    const cookieStore = await cookies();
    cookieStore.set("NEXT_LOCALE", locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });

    revalidatePath("/portal/settings");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to save" };
  }
}
