import { auth } from "@/lib/auth";
import { canAccessSuperAdmin } from "@/lib/route-guard";

export async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (!canAccessSuperAdmin(session.user.role)) throw new Error("Permission denied");
  return session.user;
}
