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

function getFallbackBillingSetting(): ResolvedBillingSetting {
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

function isMissingBillingSettingTable(error: unknown) {
  return (
    error instanceof Error &&
    ("code" in error ? (error as { code?: string }).code === "P2021" : false)
  );
}

export async function getBillingSetting(): Promise<ResolvedBillingSetting> {
  const billingSettingModel = (db as typeof db & {
    billingSetting?: {
      findFirst: (args: unknown) => Promise<ResolvedBillingSetting | null>;
      create: (args: unknown) => Promise<ResolvedBillingSetting>;
    };
  }).billingSetting;

  if (!billingSettingModel) {
    return getFallbackBillingSetting();
  }

  let existing: ResolvedBillingSetting | null = null;
  try {
    existing = await billingSettingModel.findFirst({
      include: { defaultTrialPlan: true },
      orderBy: { createdAt: "asc" },
    });
  } catch (error) {
    if (isMissingBillingSettingTable(error)) {
      return getFallbackBillingSetting();
    }
    throw error;
  }

  if (existing) return existing;

  try {
    const created = await billingSettingModel.create({
      data: {
        trialDurationType: "DAYS",
        trialDurationValue: 3,
        allowTrialOnCreate: true,
      },
      include: { defaultTrialPlan: true },
    });

    return created;
  } catch (error) {
    if (isMissingBillingSettingTable(error)) {
      return getFallbackBillingSetting();
    }
    throw error;
  }
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
