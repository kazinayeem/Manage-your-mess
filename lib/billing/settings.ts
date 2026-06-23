import { db } from "@/lib/db";
import { calculatePeriodEnd } from "@/lib/billing/plan-utils";
import type { Plan, PlanDurationType } from "@prisma/client";

export type ResolvedBillingSetting = {
  id: string;
  trialDurationType: PlanDurationType;
  trialDurationValue: number;
  trialCustomEndDate: Date | null;
  allowTrialOnCreate: boolean;
  defaultTrialPlanId: string | null;
  createdAt: Date;
  updatedAt: Date;
  defaultTrialPlan: Plan | null;
};

export async function getBillingSetting(): Promise<ResolvedBillingSetting> {
  const billingSettingModel = (db as typeof db & {
    billingSetting?: {
      findFirst: (args: unknown) => Promise<ResolvedBillingSetting | null>;
      create: (args: unknown) => Promise<ResolvedBillingSetting>;
    };
  }).billingSetting;

  if (!billingSettingModel) {
    return {
      id: "fallback-billing-setting",
      trialDurationType: "DAYS",
      trialDurationValue: 3,
      trialCustomEndDate: null,
      allowTrialOnCreate: true,
      defaultTrialPlanId: null,
      defaultTrialPlan: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  const existing = await billingSettingModel.findFirst({
    include: { defaultTrialPlan: true },
    orderBy: { createdAt: "asc" },
  });

  if (existing) return existing;

  const created = await billingSettingModel.create({
    data: {
      trialDurationType: "DAYS",
      trialDurationValue: 3,
      allowTrialOnCreate: true,
    },
    include: { defaultTrialPlan: true },
  });

  return created;
}

export function resolveTrialEndDate(setting: {
  trialDurationType: PlanDurationType;
  trialDurationValue: number;
  trialCustomEndDate?: Date | null;
}) {
  return calculatePeriodEnd(
    new Date(),
    setting.trialDurationType,
    setting.trialDurationValue,
    setting.trialCustomEndDate
  );
}
