"use server";

import { requireMessAccess } from "@/lib/mess-access";
import { getDashboardStats as loadDashboardStats } from "@/lib/queries";

export async function getDashboardStats(messId: string) {
  await requireMessAccess(messId, "MESS_READ");
  return loadDashboardStats(messId);
}
