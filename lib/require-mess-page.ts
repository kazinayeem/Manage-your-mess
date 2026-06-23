import { notFound, redirect } from "next/navigation";
import { getMessContextById, type MessContext } from "@/lib/mess-context";
import { messPath } from "@/lib/mess-routes";
import type { MessCapabilities } from "@/lib/mess-permissions";

export async function requireMessPage(
  messId: string,
  options?: {
    requireWrite?: boolean;
    requireManager?: boolean;
    capability?: keyof MessCapabilities;
  }
): Promise<MessContext> {
  const ctx = await getMessContextById(messId);
  if (!ctx) notFound();

  if (options?.requireManager && !ctx.isManager) {
    redirect(messPath(messId));
  }

  if (
    options?.requireWrite &&
    (ctx.capabilities.readOnly || !ctx.subscriptionAccess.canWrite)
  ) {
    redirect(messPath(messId));
  }

  if (options?.capability && !ctx.capabilities[options.capability]) {
    redirect(messPath(messId));
  }

  return ctx;
}
