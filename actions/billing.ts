"use server";

import { revalidatePath } from "next/cache";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { saveSecureUpload } from "@/lib/upload-storage";
import {
  PaymentRequestStatus,
  PlanDurationType,
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

function parseJsonArray(raw: string | null): string[] {
  try {
    return JSON.parse(raw || "[]") as string[];
  } catch {
    return [];
  }
}

function parseJsonObject(raw: string | null): Record<string, number> {
  try {
    return JSON.parse(raw || "{}") as Record<string, number>;
  } catch {
    return {};
  }
}

// ─── Plans ───────────────────────────────────────────────────────────────────

export async function getActivePlans() {
  const plans = await db.plan.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
  });
  return plans.map(toParsedPlan);
}

export async function getAllPlans() {
  await requireSuperAdmin();
  const plans = await db.plan.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { subscriptions: true } } },
  });
  return plans;
}

export async function getDefaultPlan(): Promise<Plan | null> {
  return (
    (await db.plan.findFirst({ where: { isDefault: true, isActive: true } })) ??
    (await db.plan.findFirst({ where: { slug: "free", isActive: true } })) ??
    (await db.plan.findFirst({ where: { isActive: true }, orderBy: { price: "asc" } }))
  );
}

export async function savePlan(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    await requireSuperAdmin();

    const id = (formData.get("id") as string) || undefined;
    const name = (formData.get("name") as string)?.trim();
    const description = (formData.get("description") as string)?.trim() || null;
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
      const existing = await db.plan.findUnique({ where: { id } });
      if (!existing) return { success: false, error: "Plan not found" };
      const plan = await db.plan.update({
        where: { id },
        data: {
          name,
          description,
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
          sortOrder,
        },
      });
      revalidatePath("/super-admin/plans");
      revalidatePath("/pricing");
      return { success: true, data: { id: plan.id } };
    }

    let slug = slugBase;
    let n = 1;
    while (await db.plan.findUnique({ where: { slug } })) {
      slug = `${slugBase}-${n++}`;
    }

    const plan = await db.plan.create({
      data: {
        slug,
        name,
        description,
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
        sortOrder,
      },
    });

    revalidatePath("/super-admin/plans");
    revalidatePath("/pricing");
    return { success: true, data: { id: plan.id } };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to save plan" };
  }
}

export async function deletePlan(planId: string): Promise<ActionResult> {
  try {
    await requireSuperAdmin();
    const count = await db.subscription.count({ where: { planId } });
    if (count > 0) {
      await db.plan.update({ where: { id: planId }, data: { isActive: false } });
    } else {
      await db.plan.delete({ where: { id: planId } });
    }
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
      plan: true,
      mess: { select: { id: true, name: true } },
      paymentMethod: true,
      reviewedBy: { select: { name: true } },
    },
  });
}

async function activateSubscriptionForUser(
  userId: string,
  plan: Plan,
  paymentRequestId: string
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
        suspendedAt: null,
        suspendReason: null,
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
      include: { plan: true, user: true },
    });
    if (!request) return { success: false, error: "Request not found" };

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
      const subscription = await activateSubscriptionForUser(
        request.userId,
        request.plan,
        request.id
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
        `Your ${request.plan.name} subscription is now active.`,
        { subscriptionId: subscription.id }
      );
      await createNotification(
        request.userId,
        "SUBSCRIPTION_ACTIVATED",
        "Plan activated",
        `Your plan expires on ${subscription.currentPeriodEnd.toLocaleDateString()}.`,
        { subscriptionId: subscription.id }
      );
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
        reason ?? "Your payment could not be verified. Please contact support.",
        { requestId }
      );
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
    include: {
      plan: true,
      invoices: { orderBy: { createdAt: "desc" }, take: 20 },
      paymentRequests: { orderBy: { createdAt: "desc" }, take: 10 },
      extensions: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  return subscription;
}

export async function getAllSubscriptions() {
  await requireSuperAdmin();
  return db.subscription.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      plan: true,
      messes: { select: { id: true, name: true } },
    },
  });
}

export async function extendSubscription(
  subscriptionId: string,
  additionalDays: number,
  reason?: string,
  customEndDate?: string
): Promise<ActionResult> {
  try {
    const admin = await requireSuperAdmin();
    const sub = await db.subscription.findUnique({ where: { id: subscriptionId } });
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

    revalidatePath("/super-admin/subscriptions");
    revalidatePath("/portal/subscription");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Update failed" };
  }
}

export async function ensureUserSubscription(userId: string) {
  const existing = await db.subscription.findFirst({
    where: { userId, status: { in: ["ACTIVE", "PENDING"] } },
  });
  if (existing) return existing;

  const plan = await getDefaultPlan();
  if (!plan) throw new Error("No default plan configured");

  const now = new Date();
  return db.subscription.create({
    data: {
      userId,
      planId: plan.id,
      status: "ACTIVE",
      currentPeriodStart: now,
      currentPeriodEnd: calculatePeriodEnd(
        now,
        plan.durationType,
        plan.durationValue,
        plan.customExpiryDate
      ),
    },
  });
}
