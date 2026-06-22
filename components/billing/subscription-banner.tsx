"use client";

import { Link } from "@/i18n/navigation";
import { AlertTriangle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SubscriptionAccessState } from "@/lib/billing/subscription-access";

export function SubscriptionBanner({
  access,
  variant = "mess",
}: {
  access: SubscriptionAccessState;
  variant?: "mess" | "portal";
}) {
  if (!access.isExpired && !access.isSuspended) return null;

  const isSuspended = access.isSuspended;

  return (
    <div
      className={
        isSuspended
          ? "border-b border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950/40"
          : "border-b border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900 dark:bg-amber-950/40"
      }
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {isSuspended ? (
            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          ) : (
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          )}
          <div className="min-w-0">
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">
              {isSuspended
                ? "This account has been suspended by the platform administrator."
                : "Your subscription has expired."}
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {access.reason ??
                (isSuspended
                  ? "Please contact support."
                  : "Please renew your subscription to continue managing your mess.")}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link href="/contact">Contact Support</Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href="/portal/subscription">View Subscription</Link>
          </Button>
          {!isSuspended && (
            <>
              <Button size="sm" variant="outline" asChild>
                <Link href="/pricing">View Pricing</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/pricing">Renew Subscription</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
