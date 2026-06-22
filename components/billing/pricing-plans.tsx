"use client";

import { useState, useTransition } from "react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { PLAN_FEATURE_LABELS } from "@/lib/billing/constants";
import { formatPlanDuration, type ParsedPlan } from "@/lib/billing/plan-utils";
import { formatCurrency } from "@/lib/utils";

export function PricingPlans({
  plans,
  isLoggedIn,
}: {
  plans: ParsedPlan[];
  isLoggedIn: boolean;
}) {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Plans & Pricing</h2>
          <p className="mt-4 text-lg text-zinc-500">
            Choose a plan and submit payment. All plans are managed dynamically — no fixed durations.
          </p>
        </div>
        <div className="mt-16 grid gap-8 lg:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-8 ${
                plan.isPopular
                  ? "border-emerald-500 shadow-lg shadow-emerald-500/10"
                  : "border-zinc-200 dark:border-zinc-800"
              }`}
            >
              {plan.isPopular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Popular</Badge>
              )}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              {plan.description && <p className="mt-1 text-sm text-zinc-500">{plan.description}</p>}
              <div className="mt-4">
                {plan.price === 0 && plan.slug === "enterprise" ? (
                  <span className="text-3xl font-bold">Custom</span>
                ) : (
                  <>
                    <span className="text-3xl font-bold">{formatCurrency(plan.price, plan.currency)}</span>
                    <span className="text-zinc-500"> / {formatPlanDuration(plan)}</span>
                  </>
                )}
              </div>
              <p className="mt-2 text-sm text-zinc-500">
                {plan.maxMembers === -1 ? "Unlimited members" : `Up to ${plan.maxMembers} members`}
              </p>
              <ul className="mt-6 space-y-3">
                {plan.features.slice(0, 8).map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span className="text-zinc-600 dark:text-zinc-400">
                      {PLAN_FEATURE_LABELS[f] ?? f.replace(/_/g, " ")}
                    </span>
                  </li>
                ))}
              </ul>
              <Button className="mt-8 w-full" variant={plan.isPopular ? "default" : "outline"} asChild>
                <Link href={plan.slug === "enterprise" ? "/contact" : isLoggedIn ? `/pricing/subscribe/${plan.id}` : `/register?plan=${plan.id}`}>
                  {plan.slug === "enterprise" ? "Contact Sales" : plan.price === 0 ? "Get Started" : "Subscribe"}
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
