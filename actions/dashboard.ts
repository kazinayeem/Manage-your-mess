"use server";

import { getDashboardStats as loadDashboardStats } from "@/lib/queries";

export async function getDashboardStats(messId: string) {
  return loadDashboardStats(messId);
}
