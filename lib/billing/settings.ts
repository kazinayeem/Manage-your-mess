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

let billingSettingTableExistsCache: boolean | null = null;

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

export async function hasBillingSettingTable() {
  if (billingSettingTableExistsCache !== null) return billingSettingTableExistsCache;

  try {
    const rows = await db.$queryRawUnsafe<Array<{ exists: string | null }>>(
      `select to_regclass('public."BillingSetting"')::text as exists`
    );
    billingSettingTableExistsCache = Boolean(rows[0]?.exists);
  } catch {
    billingSettingTableExistsCache = false;
  }

  return billingSettingTableExistsCache;
}

export async function getBillingSetting(): Promise<ResolvedBillingSetting> {
  if (!(await hasBillingSettingTable())) {
    return getFallbackBillingSetting();
  }

  let existing: ResolvedBillingSetting | null = null;
  try {
    existing = await db.billingSetting.findFirst({
      include: { defaultTrialPlan: true },
      orderBy: { createdAt: "asc" },
    });
  } catch {
    return getFallbackBillingSetting();
  }

  if (existing) return existing;

  try {
    const created = await db.billingSetting.create({
      data: {
        trialDurationType: "DAYS",
        trialDurationValue: 3,
        allowTrialOnCreate: true,
      },
      include: { defaultTrialPlan: true },
    });

    return created;
  } catch {
    return getFallbackBillingSetting();
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
