"use server";

import { revalidatePath } from "next/cache";
import { saveSecureUpload } from "@/lib/upload-storage";
import {
  PaymentRequestStatus,
  PlanDurationType,
  PlanVisibility,
  SubscriptionStatus,
  type Plan,
} from "@prisma/client";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/mess-access";
import { requireSuperAdmin } from "@/lib/billing/auth";
import {
  calculatePeriodEnd,
  serializePlanJson,
  toParsedPlan,
} from "@/lib/billing/plan-utils";
import { getBillingSetting, resolveTrialEndDate } from "@/lib/billing/settings";
import { logBillingAudit } from "@/lib/billing/audit";
import { slugify } from "@/lib/utils";

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

async function createNotification(
  userId: string,
  type:
    | "SUBSCRIPTION_SUBMITTED"
    | "SUBSCRIPTION_APPROVED"
    | "SUBSCRIPTION_REJECTED"
    | "SUBSCRIPTION_ACTIVATED"
    | "SUBSCRIPTION_EXPIRING"
    | "SUBSCRIPTION_EXPIRED"
    | "SYSTEM",
  title: string,
  message: string,
  data?: Record<string, unknown>
) {
  await db.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      data: data ? JSON.stringify(data) : null,
      sentAt: new Date(),
    },
  });
}

function parseJsonObject(raw: string | null): Record<string, number> {
  try {
    return JSON.parse(raw || "{}") as Record<string, number>;
  } catch {
    return {};
  }
}

const LEGACY_PLAN_SELECT = {
  id: true,
  slug: true,
  tier: true,
  name: true,
  description: true,
  price: true,
  currency: true,
  durationType: true,
  durationValue: true,
  customExpiryDate: true,
  maxMembers: true,
  limits: true,
  features: true,
  featureToggles: true,
  isActive: true,
  isDefault: true,
  isPopular: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
} as const;

const LEGACY_SUBSCRIPTION_BASE_SELECT = {
  id: true,
  userId: true,
  planId: true,
  status: true,
  currentPeriodStart: true,
  currentPeriodEnd: true,
  cancelAtPeriodEnd: true,
  suspendedAt: true,
  suspendReason: true,
  stripeCustomerId: true,
  stripeSubId: true,
  createdAt: true,
  updatedAt: true,
} as const;

function withPlanFallback<T extends Record<string, unknown>>(plan: T) {
  return {
    ...plan,
    badge: typeof plan.badge === "string" ? plan.badge : null,
    color: typeof plan.color === "string" ? plan.color : null,
    isTrialPlan: typeof plan.isTrialPlan === "boolean" ? plan.isTrialPlan : false,
    visibility: typeof plan.visibility === "string" ? plan.visibility : "PUBLIC",
    isArchived: typeof plan.isArchived === "boolean" ? plan.isArchived : false,
  };
}

async function getLegacyPlanById(id: string) {
  const plan = await db.plan.findUnique({
    where: { id },
    select: LEGACY_PLAN_SELECT,
  });
  return plan ? withPlanFallback(plan) : null;
}

// ─── Plans ───────────────────────────────────────────────────────────────────

export async function getActivePlans() {
  const plans = await db.plan.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
    select: LEGACY_PLAN_SELECT,
  });
  return plans
    .map(withPlanFallback)
    .filter((plan) => !plan.isArchived && plan.visibility === "PUBLIC")
    .map((plan) => toParsedPlan(plan as Plan));
}

export async function getAllPlans() {
  await requireSuperAdmin();
  const plans = await db.plan.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      ...LEGACY_PLAN_SELECT,
      _count: { select: { subscriptions: true } },
    },
  });
  return plans.map((plan) => withPlanFallback(plan));
}

export async function getBillingSettings() {
  await requireSuperAdmin();
  return getBillingSetting();
}

export async function getDefaultPlan(): Promise<Plan | null> {
  const plan =
    (await db.plan.findFirst({
      where: { isDefault: true, isActive: true },
      select: LEGACY_PLAN_SELECT,
    })) ??
    (await db.plan.findFirst({
      where: { slug: "free", isActive: true },
      select: LEGACY_PLAN_SELECT,
    })) ??
    (await db.plan.findFirst({
      where: { isActive: true },
      orderBy: { price: "asc" },
      select: LEGACY_PLAN_SELECT,
    }));
  return plan ? (withPlanFallback(plan) as Plan) : null;
}

export async function savePlan(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    await requireSuperAdmin();

    const id = (formData.get("id") as string) || undefined;
    const name = (formData.get("name") as string)?.trim();
    const description = (formData.get("description") as string)?.trim() || null;
    const badge = (formData.get("badge") as string)?.trim() || null;
    const color = (formData.get("color") as string)?.trim() || null;
    const price = Number(formData.get("price") ?? 0);
    const currency = (formData.get("currency") as string) || "BDT";
    const durationType = (formData.get("durationType") as PlanDurationType) || "MONTHS";
    const durationValue = Number(formData.get("durationValue") ?? 1);
    const customExpiryDateRaw = formData.get("customExpiryDate") as string;
    const customExpiryDate =
      durationType === "CUSTOM_DATE" && customExpiryDateRaw
        ? new Date(customExpiryDateRaw)
        : null;
    const maxMembers = Number(formData.get("maxMembers") ?? 10);
    const isActive = formData.get("isActive") === "true" || formData.get("isActive") === "on";
    const isDefault = formData.get("isDefault") === "true" || formData.get("isDefault") === "on";
    const isPopular = formData.get("isPopular") === "true" || formData.get("isPopular") === "on";
    const isTrialPlan = formData.get("isTrialPlan") === "true" || formData.get("isTrialPlan") === "on";
    const isArchived = formData.get("isArchived") === "true" || formData.get("isArchived") === "on";
    const visibility = ((formData.get("visibility") as string) || "PUBLIC") as PlanVisibility;
    const sortOrder = Number(formData.get("sortOrder") ?? 0);

    const features = formData.getAll("features").map(String);
    const limits = parseJsonObject((formData.get("limits") as string) || "{}");
    limits.members = maxMembers;

    const toggles: Record<string, boolean> = {};
    for (const key of features) toggles[key] = true;

    if (!name) return { success: false, error: "Plan name is required" };

    const slugBase = slugify(name);
    const serialized = serializePlanJson(limits, features, toggles);

    if (isDefault) {
      await db.plan.updateMany({ data: { isDefault: false } });
    }

    if (id) {
      const existing = await getLegacyPlanById(id);
      if (!existing) return { success: false, error: "Plan not found" };
      const plan = await db.plan.update({
        where: { id },
        data: {
          name,
          description,
          badge,
          color,
          price,
          currency,
          durationType,
          durationValue,
          customExpiryDate,
          maxMembers,
          ...serialized,
          isActive,
          isDefault,
          isPopular,
          isTrialPlan,
          isArchived,
          visibility,
          sortOrder,
        },
      });
      await logBillingAudit({
        action: "UPDATE",
        entity: "Plan",
        entityId: plan.id,
        oldData: existing,
        newData: plan,
      });
      revalidatePath("/super-admin/plans");
      revalidatePath("/super-admin/subscriptions");
      revalidatePath("/pricing");
      return { success: true, data: { id: plan.id } };
    }

    let slug = slugBase;
    let n = 1;
    while (await db.plan.findUnique({ where: { slug }, select: { id: true } })) {
      slug = `${slugBase}-${n++}`;
    }

    const plan = await db.plan.create({
      data: {
        slug,
        name,
        description,
        badge,
        color,
        price,
        currency,
        durationType,
        durationValue,
        customExpiryDate,
        maxMembers,
        ...serialized,
        isActive,
        isDefault,
        isPopular,
        isTrialPlan,
        isArchived,
        visibility,
        sortOrder,
      },
    });

    await logBillingAudit({
      action: "CREATE",
      entity: "Plan",
      entityId: plan.id,
      newData: plan,
    });

    revalidatePath("/super-admin/plans");
    revalidatePath("/super-admin/subscriptions");
    revalidatePath("/pricing");
    return { success: true, data: { id: plan.id } };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to save plan" };
  }
}

export async function duplicatePlan(planId: string): Promise<ActionResult<{ id: string }>> {
  try {
    await requireSuperAdmin();
    const plan = await getLegacyPlanById(planId);
    if (!plan) return { success: false, error: "Plan not found" };

    const slugBase = `${plan.slug}-copy`;
    let slug = slugBase;
    let n = 1;
    while (await db.plan.findUnique({ where: { slug }, select: { id: true } })) {
      slug = `${slugBase}-${n++}`;
    }

    const copy = await db.plan.create({
      data: {
        slug,
        tier: plan.tier,
        name: `${plan.name} Copy`,
        description: plan.description,
        badge: plan.badge,
        color: plan.color,
        price: plan.price,
        currency: plan.currency,
        durationType: plan.durationType,
        durationValue: plan.durationValue,
        customExpiryDate: plan.customExpiryDate,
        maxMembers: plan.maxMembers,
        limits: plan.limits,
        features: plan.features,
        featureToggles: plan.featureToggles,
        isActive: false,
        isDefault: false,
        isPopular: false,
        isTrialPlan: false,
        visibility: plan.visibility,
        isArchived: false,
        sortOrder: plan.sortOrder + 1,
      },
    });

    await logBillingAudit({
      action: "CREATE",
      entity: "PlanDuplicate",
      entityId: copy.id,
      newData: copy,
    });
    revalidatePath("/super-admin/plans");
    return { success: true, data: { id: copy.id } };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to duplicate plan" };
  }
}

export async function updatePlanLifecycle(
  planId: string,
  action: "enable" | "disable" | "hide" | "show" | "archive"
): Promise<ActionResult> {
  try {
    await requireSuperAdmin();
    const existing = await db.plan.findUnique({ where: { id: planId } });
    if (!existing) return { success: false, error: "Plan not found" };

    const data =
      action === "enable"
        ? { isActive: true }
        : action === "disable"
          ? { isActive: false }
          : action === "hide"
            ? { visibility: "HIDDEN" as const }
            : action === "show"
              ? { visibility: "PUBLIC" as const, isArchived: false }
              : { isArchived: true, isActive: false, visibility: "HIDDEN" as const };

    const updated = await db.plan.update({
      where: { id: planId },
      data,
    });

    await logBillingAudit({
      action: "UPDATE",
      entity: "PlanLifecycle",
      entityId: updated.id,
      oldData: existing,
      newData: updated,
    });
    revalidatePath("/super-admin/plans");
    revalidatePath("/pricing");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update plan" };
  }
}

export async function saveBillingSettings(formData: FormData): Promise<ActionResult> {
  try {
    await requireSuperAdmin();
    const existing = await getBillingSetting();
    const trialDurationType = ((formData.get("trialDurationType") as string) || "DAYS") as PlanDurationType;
    const trialDurationValue = Number(formData.get("trialDurationValue") ?? 3);
    const trialCustomEndDateRaw = (formData.get("trialCustomEndDate") as string) || "";
    const defaultTrialPlanId = (formData.get("defaultTrialPlanId") as string) || null;
    const allowTrialOnCreate =
      formData.get("allowTrialOnCreate") === "true" || formData.get("allowTrialOnCreate") === "on";

    const updated = await db.billingSetting.update({
      where: { id: existing.id },
      data: {
        trialDurationType,
        trialDurationValue,
        trialCustomEndDate:
          trialDurationType === "CUSTOM_DATE" && trialCustomEndDateRaw
            ? new Date(trialCustomEndDateRaw)
            : null,
        defaultTrialPlanId,
        allowTrialOnCreate,
      },
    });

    await logBillingAudit({
      action: "UPDATE",
      entity: "BillingSetting",
      entityId: updated.id,
      oldData: existing,
      newData: updated,
    });
    revalidatePath("/super-admin/plans");
    revalidatePath("/super-admin/settings");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to save settings" };
  }
}

export async function deletePlan(planId: string): Promise<ActionResult> {
  try {
    await requireSuperAdmin();
    const existing = await db.plan.findUnique({ where: { id: planId } });
    if (!existing) return { success: false, error: "Plan not found" };
    const count = await db.subscription.count({ where: { planId } });
    if (count > 0) {
      await db.plan.update({ where: { id: planId }, data: { isActive: false, isArchived: true } });
    } else {
      await db.plan.delete({ where: { id: planId } });
    }
    await logBillingAudit({
      action: "DELETE",
      entity: "Plan",
      entityId: planId,
      oldData: existing,
    });
    revalidatePath("/super-admin/plans");
    revalidatePath("/pricing");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete plan" };
  }
}

// ─── Payment Methods ─────────────────────────────────────────────────────────

export async function getPaymentMethods(activeOnly = false) {
  return db.paymentMethod.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function savePaymentMethod(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    await requireSuperAdmin();
    const id = (formData.get("id") as string) || undefined;
    const name = (formData.get("name") as string)?.trim();
    const accountName = (formData.get("accountName") as string)?.trim() || null;
    const accountNumber = (formData.get("accountNumber") as string)?.trim() || null;
    const accountType = (formData.get("accountType") as string)?.trim() || null;
    const qrCodeUrl = (formData.get("qrCodeUrl") as string)?.trim() || null;
    const instructions = (formData.get("instructions") as string)?.trim() || null;
    const isActive = formData.get("isActive") === "true" || formData.get("isActive") === "on";
    const sortOrder = Number(formData.get("sortOrder") ?? 0);

    if (!name) return { success: false, error: "Method name is required" };

    if (id) {
      const method = await db.paymentMethod.update({
        where: { id },
        data: { name, accountName, accountNumber, accountType, qrCodeUrl, instructions, isActive, sortOrder },
      });
      revalidatePath("/super-admin/payment-methods");
      revalidatePath("/pricing");
      return { success: true, data: { id: method.id } };
    }

    let slug = slugify(name);
    let n = 1;
    while (await db.paymentMethod.findUnique({ where: { slug } })) {
      slug = `${slugify(name)}-${n++}`;
    }

    const method = await db.paymentMethod.create({
      data: { slug, name, accountName, accountNumber, accountType, qrCodeUrl, instructions, isActive, sortOrder },
    });
    revalidatePath("/super-admin/payment-methods");
    revalidatePath("/pricing");
    return { success: true, data: { id: method.id } };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to save payment method" };
  }
}

export async function deletePaymentMethod(id: string): Promise<ActionResult> {
  try {
    await requireSuperAdmin();
    await db.paymentMethod.update({ where: { id }, data: { isActive: false } });
    revalidatePath("/super-admin/payment-methods");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete" };
  }
}

// ─── Subscription Requests ───────────────────────────────────────────────────

async function saveScreenshot(file: File | null): Promise<string | null> {
  return saveSecureUpload(file, "payments");
}

export async function submitSubscriptionRequest(
  formData: FormData
): Promise<ActionResult<{ requestId: string }>> {
  try {
    const user = await requireAuth();
    const planId = formData.get("planId") as string;
    const paymentMethodId = formData.get("paymentMethodId") as string;
    const messId = (formData.get("messId") as string) || null;
    const transactionId = (formData.get("transactionId") as string)?.trim() || null;
    const senderNumber = (formData.get("senderNumber") as string)?.trim() || null;
    const amount = Number(formData.get("amount"));
    const note = (formData.get("note") as string)?.trim() || null;
    const screenshot = formData.get("screenshot") as File | null;

    if (!planId || !paymentMethodId) {
      return { success: false, error: "Plan and payment method are required" };
    }
    if (!amount || amount <= 0) return { success: false, error: "Valid payment amount is required" };

    const plan = await db.plan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) return { success: false, error: "Plan not available" };

    const method = await db.paymentMethod.findUnique({ where: { id: paymentMethodId } });
    if (!method || !method.isActive) return { success: false, error: "Payment method not available" };

    const screenshotUrl = await saveScreenshot(screenshot);

    const request = await db.subscriptionPaymentRequest.create({
      data: {
        userId: user.id,
        planId,
        messId,
        paymentMethodId,
        amount,
        currency: plan.currency,
        transactionId,
        senderNumber,
        screenshotUrl,
        note,
        status: "PENDING",
      },
    });

    await createNotification(
      user.id,
      "SUBSCRIPTION_SUBMITTED",
      "Payment under review",
      "Please wait. Your payment is under review. Admin will verify and activate your subscription soon.",
      { requestId: request.id, planId }
    );

    revalidatePath("/portal/subscription");
    revalidatePath("/super-admin/payments");
    await logBillingAudit({
      action: "CREATE",
      entity: "SubscriptionPaymentRequest",
      entityId: request.id,
      userId: user.id,
      messId,
      newData: request,
    });
    return { success: true, data: { requestId: request.id } };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Submission failed" };
  }
}

export async function getPaymentRequests(status?: PaymentRequestStatus) {
  await requireSuperAdmin();
  return db.subscriptionPaymentRequest.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      plan: { select: LEGACY_PLAN_SELECT },
      mess: { select: { id: true, name: true } },
      paymentMethod: true,
      reviewedBy: { select: { name: true } },
    },
  }).then((rows) =>
    rows.map((row) => ({
      ...row,
      plan: row.plan ? withPlanFallback(row.plan) : null,
    }))
  );
}

export async function getPaymentRequestsForAdmin(filters?: {
  status?: PaymentRequestStatus | "ALL";
  search?: string;
}) {
  await requireSuperAdmin();
  const search = filters?.search?.trim();
  return db.subscriptionPaymentRequest.findMany({
    where: {
      ...(filters?.status && filters.status !== "ALL" ? { status: filters.status } : {}),
      ...(search
        ? {
            OR: [
              { transactionId: { contains: search } },
              { note: { contains: search } },
              { user: { email: { contains: search } } },
              { user: { name: { contains: search } } },
              { mess: { name: { contains: search } } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      plan: { select: LEGACY_PLAN_SELECT },
      mess: { select: { id: true, name: true } },
      paymentMethod: true,
      reviewedBy: { select: { name: true } },
    },
  }).then((rows) =>
    rows.map((row) => ({
      ...row,
      plan: row.plan ? withPlanFallback(row.plan) : null,
    }))
  );
}

export async function getMyPaymentRequests() {
  const user = await requireAuth();
  return db.subscriptionPaymentRequest.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      plan: { select: LEGACY_PLAN_SELECT },
      mess: { select: { id: true, name: true } },
      paymentMethod: true,
      reviewedBy: { select: { name: true } },
      subscription: {
        select: {
          ...LEGACY_SUBSCRIPTION_BASE_SELECT,
          plan: { select: LEGACY_PLAN_SELECT },
        },
      },
    },
  }).then((rows) =>
    rows.map((row) => ({
      ...row,
      plan: row.plan ? withPlanFallback(row.plan) : null,
      subscription: row.subscription
        ? {
            ...row.subscription,
            plan: row.subscription.plan ? withPlanFallback(row.subscription.plan) : null,
          }
        : null,
    }))
  );
}

async function activateSubscriptionForUser(
  userId: string,
  plan: Plan,
  paymentRequestId: string,
  assignedById?: string | null
) {
  const now = new Date();
  const periodEnd = calculatePeriodEnd(
    now,
    plan.durationType,
    plan.durationValue,
    plan.customExpiryDate
  );

  let subscription = await db.subscription.findFirst({
    where: { userId, status: { in: ["ACTIVE", "PENDING", "EXPIRED", "PAST_DUE"] } },
    orderBy: { createdAt: "desc" },
    select: LEGACY_SUBSCRIPTION_BASE_SELECT,
  });

  if (subscription) {
    const base = subscription.currentPeriodEnd > now ? subscription.currentPeriodEnd : now;
    const newEnd = calculatePeriodEnd(base, plan.durationType, plan.durationValue, plan.customExpiryDate);

    subscription = await db.subscription.update({
      where: { id: subscription.id },
      data: {
        planId: plan.id,
        status: "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd: newEnd,
        trialStartedAt: null,
        trialEndsAt: null,
        suspendedAt: null,
        suspendReason: null,
        assignedById: assignedById ?? null,
      },
    });
  } else {
    subscription = await db.subscription.create({
      data: {
        userId,
        planId: plan.id,
        status: "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        assignedById: assignedById ?? null,
      },
    });
  }

  await db.mess.updateMany({
    where: { ownerId: userId },
    data: { subscriptionId: subscription.id },
  });

  const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
  await db.invoice.create({
    data: {
      subscriptionId: subscription.id,
      paymentRequestId,
      invoiceNumber,
      amount: plan.price,
      currency: plan.currency,
      status: "paid",
      paidAt: now,
      dueDate: now,
    },
  });

  await db.subscriptionPaymentRequest.update({
    where: { id: paymentRequestId },
    data: { subscriptionId: subscription.id },
  });

  return subscription;
}

export async function reviewPaymentRequest(
  requestId: string,
  action: "approve" | "reject" | "needs_info" | "refund",
  reason?: string
): Promise<ActionResult> {
  try {
    const admin = await requireSuperAdmin();
    const request = await db.subscriptionPaymentRequest.findUnique({
      where: { id: requestId },
      include: {
        plan: { select: LEGACY_PLAN_SELECT },
        user: true,
      },
    });
    if (!request) return { success: false, error: "Request not found" };
    const plan = request.plan ? withPlanFallback(request.plan) : null;

    if (action === "approve" && !["PENDING", "NEEDS_INFO"].includes(request.status)) {
      return { success: false, error: "This payment request has already been processed" };
    }
    if (
      (action === "reject" || action === "refund") &&
      !["PENDING", "NEEDS_INFO", "APPROVED"].includes(request.status)
    ) {
      return { success: false, error: "This payment request cannot be updated" };
    }

    const now = new Date();

    if (action === "approve") {
      if (!plan) {
        return { success: false, error: "Selected plan could not be loaded for this payment request" };
      }
      const subscription = await activateSubscriptionForUser(
        request.userId,
        plan as Plan,
        request.id,
        admin.id
      );

      await db.subscriptionPaymentRequest.update({
        where: { id: requestId },
        data: {
          status: "APPROVED",
          reviewedById: admin.id,
          reviewedAt: now,
          adminNote: reason ?? null,
          subscriptionId: subscription.id,
        },
      });

      await createNotification(
        request.userId,
        "SUBSCRIPTION_APPROVED",
        "Payment approved",
        "Your subscription has been activated successfully.",
        { subscriptionId: subscription.id }
      );
      await createNotification(
        request.userId,
        "SUBSCRIPTION_ACTIVATED",
        "Plan activated",
        `Your plan expires on ${subscription.currentPeriodEnd.toLocaleDateString()}.`,
        { subscriptionId: subscription.id }
      );
      await logBillingAudit({
        action: "APPROVE",
        entity: "SubscriptionPaymentRequest",
        entityId: requestId,
        userId: admin.id,
        messId: request.messId,
        newData: { status: "APPROVED", subscriptionId: subscription.id },
      });
    } else if (action === "reject") {
      await db.subscriptionPaymentRequest.update({
        where: { id: requestId },
        data: {
          status: "REJECTED",
          reviewedById: admin.id,
          reviewedAt: now,
          rejectReason: reason ?? "Payment could not be verified",
        },
      });
      await createNotification(
        request.userId,
        "SUBSCRIPTION_REJECTED",
        "Payment rejected",
        reason ?? "Your payment request was rejected. Please review the reason and submit again.",
        { requestId }
      );
      await logBillingAudit({
        action: "REJECT",
        entity: "SubscriptionPaymentRequest",
        entityId: requestId,
        userId: admin.id,
        messId: request.messId,
        newData: { status: "REJECTED", reason },
      });
    } else if (action === "needs_info") {
      await db.subscriptionPaymentRequest.update({
        where: { id: requestId },
        data: {
          status: "NEEDS_INFO",
          reviewedById: admin.id,
          reviewedAt: now,
          adminNote: reason ?? null,
        },
      });
      await createNotification(
        request.userId,
        "SYSTEM",
        "More information needed",
        reason ?? "Please provide additional payment details.",
        { requestId }
      );
      await logBillingAudit({
        action: "UPDATE",
        entity: "SubscriptionPaymentRequest",
        entityId: requestId,
        userId: admin.id,
        messId: request.messId,
        newData: { status: "NEEDS_INFO", reason },
      });
    } else if (action === "refund") {
      await db.subscriptionPaymentRequest.update({
        where: { id: requestId },
        data: {
          status: "REFUNDED",
          reviewedById: admin.id,
          reviewedAt: now,
          adminNote: reason ?? null,
        },
      });
      if (request.subscriptionId) {
        await db.subscription.update({
          where: { id: request.subscriptionId },
          data: { status: "CANCELLED" },
        });
      }
      await createNotification(
        request.userId,
        "SYSTEM",
        "Payment refunded",
        reason ?? "Your payment has been refunded.",
        { requestId }
      );
      await logBillingAudit({
        action: "UPDATE",
        entity: "SubscriptionPaymentRequest",
        entityId: requestId,
        userId: admin.id,
        messId: request.messId,
        newData: { status: "REFUNDED", reason },
      });
    }

    revalidatePath("/super-admin/payments");
    revalidatePath("/portal/subscription");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Review failed" };
  }
}

// ─── Subscriptions ───────────────────────────────────────────────────────────

export async function getUserSubscription(requestedUserId?: string) {
  const sessionUser = await requireAuth();
  const userId = requestedUserId ?? sessionUser.id;
  if (userId !== sessionUser.id && sessionUser.role !== "SUPER_ADMIN" && sessionUser.role !== "ADMIN") {
    throw new Error("Permission denied");
  }
  const subscription = await db.subscription.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      ...LEGACY_SUBSCRIPTION_BASE_SELECT,
      plan: { select: LEGACY_PLAN_SELECT },
      invoices: { orderBy: { createdAt: "desc" }, take: 20 },
      paymentRequests: { orderBy: { createdAt: "desc" }, take: 10 },
      extensions: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  return subscription ? { ...subscription, plan: subscription.plan ? withPlanFallback(subscription.plan) : null } : null;
}

export async function getAllSubscriptions() {
  await requireSuperAdmin();
  return db.subscription.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      ...LEGACY_SUBSCRIPTION_BASE_SELECT,
      user: { select: { id: true, name: true, email: true } },
      plan: { select: LEGACY_PLAN_SELECT },
      messes: { select: { id: true, name: true } },
    },
  }).then((rows) => rows.map((row) => ({
    ...row,
    plan: row.plan ? withPlanFallback(row.plan) : null,
  })));
}

export async function assignSubscriptionPlan(input: {
  userId: string;
  planId: string;
  messId?: string | null;
  customExpiryDate?: string | null;
  bonusDays?: number;
}): Promise<ActionResult<{ subscriptionId: string }>> {
  try {
    const admin = await requireSuperAdmin();
    const plan = await db.plan.findUnique({ where: { id: input.planId } });
    if (!plan) return { success: false, error: "Plan not found" };

    const now = new Date();
    const end = input.customExpiryDate
      ? new Date(input.customExpiryDate)
      : calculatePeriodEnd(now, plan.durationType, plan.durationValue, plan.customExpiryDate);
    const finalEnd = new Date(end.getTime() + (input.bonusDays ?? 0) * 24 * 60 * 60 * 1000);

    const existing = await db.subscription.findFirst({
      where: { userId: input.userId },
      orderBy: { createdAt: "desc" },
      select: LEGACY_SUBSCRIPTION_BASE_SELECT,
    });

    const subscription = existing
      ? await db.subscription.update({
          where: { id: existing.id },
          data: {
            planId: plan.id,
            status: "ACTIVE",
            currentPeriodStart: now,
            currentPeriodEnd: finalEnd,
            bonusDays: input.bonusDays ?? 0,
            assignedById: admin.id,
            trialStartedAt: null,
            trialEndsAt: null,
            suspendedAt: null,
            suspendReason: null,
          },
        })
      : await db.subscription.create({
          data: {
            userId: input.userId,
            planId: plan.id,
            status: "ACTIVE",
            currentPeriodStart: now,
            currentPeriodEnd: finalEnd,
            bonusDays: input.bonusDays ?? 0,
            assignedById: admin.id,
          },
        });

    if (input.messId) {
      await db.mess.update({
        where: { id: input.messId },
        data: { subscriptionId: subscription.id },
      });
    } else {
      await db.mess.updateMany({
        where: { ownerId: input.userId },
        data: { subscriptionId: subscription.id },
      });
    }

    await logBillingAudit({
      action: "UPDATE",
      entity: "SubscriptionAssignment",
      entityId: subscription.id,
      userId: admin.id,
      messId: input.messId ?? null,
      newData: input,
    });
    revalidatePath("/super-admin/subscriptions");
    revalidatePath("/portal/subscription");
    return { success: true, data: { subscriptionId: subscription.id } };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to assign plan" };
  }
}

export async function extendSubscription(
  subscriptionId: string,
  additionalDays: number,
  reason?: string,
  customEndDate?: string
): Promise<ActionResult> {
  try {
    const admin = await requireSuperAdmin();
    const sub = await db.subscription.findUnique({
      where: { id: subscriptionId },
      select: LEGACY_SUBSCRIPTION_BASE_SELECT,
    });
    if (!sub) return { success: false, error: "Subscription not found" };

    const previousEnd = sub.currentPeriodEnd;
    const base = previousEnd > new Date() ? previousEnd : new Date();
    const newEnd = customEndDate
      ? new Date(customEndDate)
      : new Date(base.getTime() + additionalDays * 24 * 60 * 60 * 1000);

    await db.subscription.update({
      where: { id: subscriptionId },
      data: {
        currentPeriodEnd: newEnd,
        status: "ACTIVE",
        suspendedAt: null,
        suspendReason: null,
      },
    });

    await db.subscriptionExtension.create({
      data: {
        subscriptionId,
        addedDays: customEndDate ? null : additionalDays,
        previousEnd,
        newEnd,
        reason: reason ?? null,
        createdById: admin.id,
      },
    });

    await createNotification(
      sub.userId,
      "SUBSCRIPTION_ACTIVATED",
      "Subscription extended",
      `Your subscription has been extended until ${newEnd.toLocaleDateString()}.`,
      { subscriptionId }
    );
    await logBillingAudit({
      action: "UPDATE",
      entity: "SubscriptionExtension",
      entityId: subscriptionId,
      userId: admin.id,
      newData: { additionalDays, customEndDate, reason, newEnd },
    });

    revalidatePath("/super-admin/subscriptions");
    revalidatePath("/portal/subscription");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Extension failed" };
  }
}

export async function updateSubscriptionStatus(
  subscriptionId: string,
  status: SubscriptionStatus,
  reason?: string
): Promise<ActionResult> {
  try {
    await requireSuperAdmin();
    const data: {
      status: SubscriptionStatus;
      suspendedAt?: Date | null;
      suspendReason?: string | null;
    } = { status };

    if (status === "SUSPENDED") {
      data.suspendedAt = new Date();
      data.suspendReason = reason ?? null;
    } else {
      data.suspendedAt = null;
      data.suspendReason = null;
    }

    const sub = await db.subscription.update({
      where: { id: subscriptionId },
      data,
    });

    if (status === "EXPIRED") {
      await createNotification(
        sub.userId,
        "SUBSCRIPTION_EXPIRED",
        "Subscription expired",
        "Your subscription has expired. Renew to continue using premium features.",
        { subscriptionId }
      );
    }

    await logBillingAudit({
      action: "UPDATE",
      entity: "SubscriptionStatus",
      entityId: subscriptionId,
      newData: { status, reason },
    });

    revalidatePath("/super-admin/subscriptions");
    revalidatePath("/portal/subscription");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Update failed" };
  }
}

export async function ensureUserSubscription(userId: string) {
  const existing = await db.subscription.findFirst({
    where: { userId, status: { in: ["ACTIVE", "PENDING", "TRIALING"] } },
    select: {
      id: true,
      userId: true,
      planId: true,
      status: true,
      currentPeriodStart: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
      suspendedAt: true,
      suspendReason: true,
      stripeCustomerId: true,
      stripeSubId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (existing) return existing;

  const billingSetting = await getBillingSetting();
  const plan =
    (billingSetting.defaultTrialPlanId
      ? await db.plan.findUnique({
          where: { id: billingSetting.defaultTrialPlanId },
          select: LEGACY_PLAN_SELECT,
        })
      : null) ??
    (await db.plan.findFirst({
      where: { isActive: true },
      orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }],
      select: LEGACY_PLAN_SELECT,
    })) ??
    (await getDefaultPlan());
  if (!plan) throw new Error("No default plan configured");

  const now = new Date();
  const normalizedPlan = withPlanFallback(plan as unknown as Record<string, unknown>);
  const isTrial = billingSetting.allowTrialOnCreate || normalizedPlan.isTrialPlan;
  const periodEnd = isTrial
    ? resolveTrialEndDate({
        trialDurationType: billingSetting.trialDurationType,
        trialDurationValue: billingSetting.trialDurationValue,
        trialCustomEndDate: billingSetting.trialCustomEndDate,
      })
    : calculatePeriodEnd(now, plan.durationType, plan.durationValue, plan.customExpiryDate);

  return db.subscription.create({
    data: {
      userId,
      planId: plan.id,
      status: isTrial ? "TRIALING" : "ACTIVE",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
  });
}
