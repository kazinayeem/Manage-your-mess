import type { UserRole } from "@prisma/client";
import { isAdminRole } from "@/lib/rbac";

export function getPlatformHomeRoute(platformRole: UserRole): string {
  if (isAdminRole(platformRole)) return "/super-admin";
  return "/portal";
}

export async function getMessAwareHomeRoute(
  userId: string,
  platformRole: UserRole
): Promise<string> {
  if (isAdminRole(platformRole)) return "/super-admin";
  return "/portal";
}

export function canAccessSuperAdmin(platformRole: UserRole): boolean {
  return isAdminRole(platformRole);
}

export function pathnameIsSuperAdmin(path: string): boolean {
  return path === "/super-admin" || path.startsWith("/super-admin/");
}

export function pathnameIsPortal(path: string): boolean {
  return path === "/portal" || path.startsWith("/portal/");
}

export function pathnameIsMessScoped(path: string): boolean {
  return path === "/mess" || path.startsWith("/mess/");
}

/** @deprecated Legacy routes — redirect to portal */
export function pathnameIsMessDashboard(path: string): boolean {
  return path === "/dashboard" || path.startsWith("/dashboard/");
}

export function pathnameIsMemberDashboard(path: string): boolean {
  return path === "/member" || path.startsWith("/member/");
}

export function pathnameIsWelcome(path: string): boolean {
  return path === "/welcome" || path.startsWith("/welcome/");
}
