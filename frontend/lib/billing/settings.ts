import { apiGet } from "@/lib/api-client";
import { calculatePeriodEnd } from "@/lib/billing/plan-utils";
import type { PlanDurationType } from "@/types/domain";
type Plan = any;

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

export async function getBillingSetting(): Promise<ResolvedBillingSetting> {
  try {
    const res = await apiGet("/super-admin/billing-settings");
    if (res.success && res.data) return res.data;
  } catch {
    // fallback
  }
  return getFallbackBillingSetting();
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
