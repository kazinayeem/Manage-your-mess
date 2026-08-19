import type { MessCapabilities } from "@/lib/mess-permissions";

/** Managers full access; legal owners with report access can view bazaar admin pages read-only. */
export function canViewBazaarAdmin(cap: MessCapabilities, isOwner: boolean) {
  return cap.canManageBazaar || (cap.canGenerateReports && isOwner);
}
