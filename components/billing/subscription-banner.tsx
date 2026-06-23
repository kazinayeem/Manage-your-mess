"use client";

import { Link } from "@/i18n/navigation";
import { AlertTriangle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SubscriptionAccessState } from "@/lib/billing/subscription-access";

export function SubscriptionBanner({
  access,
}: {
  access: SubscriptionAccessState;
}) {
  if (!access.isExpired && !access.isSuspended && !access.isTrial) return null;

  const isSuspended = access.isSuspended;
  const isTrial = access.isTrial && !access.isExpired && !access.isSuspended;

  return (
    <div
      className={
        isSuspended
          ? "border-b border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950/40"
          : isTrial
            ? "border-b border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-900 dark:bg-blue-950/40"
            : "border-b border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900 dark:bg-amber-950/40"
      }
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {isSuspended ? (
            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          ) : isTrial ? (
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
          ) : (
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          )}
          <div className="min-w-0">
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">
              {isSuspended
                ? "Account suspended — read-only mode"
                : isTrial
                  ? `Your trial expires in ${access.daysRemaining} day${access.daysRemaining === 1 ? "" : "s"}`
                : "Your subscription has expired."}
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {isSuspended
                ? "You can browse your mess data, but adding or editing is disabled. Contact support if you believe this is a mistake."
                : access.lockedMessage ??
                access.reason ??
                (isTrial
                    ? "Upgrade any time to keep full access after your trial ends."
                  : "Please renew your subscription to continue managing your mess.")}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link href="/portal/subscription">View Subscription</Link>
          </Button>
          {!isSuspended && (
            <>
              <Button size="sm" variant="outline" asChild>
                <Link href="/pricing">View Pricing</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href={isTrial ? "/portal/subscription" : "/pricing"}>
                  {isTrial ? "Submit Payment" : "Renew Subscription"}
                </Link>
              </Button>
            </>
          )}
          {isSuspended && (
            <Button size="sm" variant="outline" asChild>
              <Link href="/contact">Contact Support</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
