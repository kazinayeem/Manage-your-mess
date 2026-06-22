"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { ensureUserSubscription } from "@/actions/billing";
import { requireAuth, requireMessAccess, requireMessManager } from "@/lib/mess-access";
import { assertMessWriteAccess } from "@/lib/billing/subscription-access";
import { createInitialMonth, recalculateMonth } from "@/actions/monthly";
import { ensureCurrentMonth } from "@/lib/mess-context";
import { setActiveMessIdCookie } from "@/lib/active-mess";
import {
  registerSchema,
  messSchema,
  expenseSchema,
  mealCostSchema,
  depositSchema,
  bulkMealEntriesSchema,
  memberSchema,
} from "@/lib/validations";
import { slugify } from "@/lib/utils";

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

export async function registerUser(formData: FormData): Promise<ActionResult<{ userId: string }>> {
  try {
    const parsed = registerSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

    const existing = await db.user.findUnique({ where: { email: parsed.data.email } });
    if (existing) return { success: false, error: "Email already registered" };

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const user = await db.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        role: UserRole.MEMBER,
      },
    });

    // Create OTP for email verification
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await db.otpCode.create({
      data: {
        userId: user.id,
        code: otp,
        type: "email_verify",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    return { success: true, data: { userId: user.id } };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Registration failed" };
  }
}

export async function createMess(formData: FormData): Promise<ActionResult<{ messId: string }>> {
  try {
    const user = await requireAuth();
    const parsed = messSchema.safeParse({
      name: formData.get("name"),
      description: formData.get("description"),
      address: formData.get("address"),
    });
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

    const slug = slugify(parsed.data.name) + "-" + Date.now().toString(36);

    // Reuse account subscription or create one on default plan
    let subscription = await db.subscription.findFirst({
      where: { userId: user.id, status: { in: ["ACTIVE", "PENDING"] } },
      orderBy: { createdAt: "desc" },
    });

    if (!subscription) {
      subscription = await ensureUserSubscription(user.id);
    }

    const timezone = (formData.get("timezone") as string) || "Asia/Dhaka";
    const currency = (formData.get("currency") as string) || "BDT";
    const language = (formData.get("language") as string) || "en";
    const memberLimit = formData.get("memberLimit")
      ? Number(formData.get("memberLimit"))
      : undefined;

    const mess = await db.mess.create({
      data: {
        name: parsed.data.name,
        slug,
        description: parsed.data.description,
        address: parsed.data.address,
        ownerId: user.id,
        managerId: user.id,
        subscriptionId: subscription.id,
        monthlyRules: JSON.stringify({ timezone, currency, language, memberLimit }),
      },
    });

    await db.member.create({
      data: {
        messId: mess.id,
        userId: user.id,
        role: UserRole.MESS_MANAGER,
        status: "ACTIVE",
        fullName: user.name,
      },
    });

    // Seed default expense categories
    const defaultCategories = [
      "Rent", "Electricity", "Water", "Gas", "Internet",
      "Grocery", "Cleaner", "Maintenance", "Emergency", "Other",
    ];
    await db.expenseCategory.createMany({
      data: defaultCategories.map((name) => ({
        messId: mess.id,
        name,
        isDefault: true,
        isMealCost: name === "Grocery",
      })),
    });

    await db.auditLog.create({
      data: {
        messId: mess.id,
        userId: user.id,
        action: "CREATE",
        entity: "Mess",
        entityId: mess.id,
      },
    });

    await createInitialMonth(mess.id);
    await setActiveMessIdCookie(mess.id);

    revalidatePath("/portal");
    return { success: true, data: { messId: mess.id } };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to create mess" };
  }
}

export async function joinMess(inviteCode: string): Promise<ActionResult<{ messId: string }>> {
  try {
    const user = await requireAuth();
    const mess = await db.mess.findFirst({
      where: { inviteCode, deletedAt: null },
      include: { members: { where: { deletedAt: null } }, subscription: { include: { plan: true } } },
    });
    if (!mess) return { success: false, error: "Invalid invite code" };

    const existing = await db.member.findUnique({
      where: { messId_userId: { messId: mess.id, userId: user.id } },
    });
    if (existing) return { success: false, error: "Already a member" };

    const maxMembers = mess.subscription?.plan.maxMembers ?? 10;
    if (maxMembers > 0 && mess.members.length >= maxMembers) {
      return { success: false, error: "Member limit reached for current plan" };
    }

    await db.member.create({
      data: {
        messId: mess.id,
        userId: user.id,
        role: UserRole.MEMBER,
        status: "PENDING",
        fullName: user.name,
      },
    });

    await setActiveMessIdCookie(mess.id);

    revalidatePath("/portal");
    return { success: true, data: { messId: mess.id } };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to join mess" };
  }
}

export async function switchActiveMess(messId: string): Promise<ActionResult> {
  try {
    const user = await requireAuth();
    const membership = await db.member.findUnique({
      where: { messId_userId: { messId, userId: user.id } },
    });
    if (!membership || membership.deletedAt) {
      return { success: false, error: "You are not a member of this mess" };
    }

    await setActiveMessIdCookie(messId);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to switch mess" };
  }
}

export async function regenerateInviteCode(
  messId: string
): Promise<ActionResult<{ inviteCode: string }>> {
  try {
    await requireMessAccess(messId, "MEMBER_INVITE");
    await assertMessWriteAccess(messId);
    const { randomBytes } = await import("crypto");
    const inviteCode = randomBytes(12).toString("hex");

    const mess = await db.mess.update({
      where: { id: messId },
      data: { inviteCode },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");
    return { success: true, data: { inviteCode: mess.inviteCode } };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to regenerate invite code",
    };
  }
}

export async function addExpense(
  messId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const { user } = await requireMessAccess(messId, "EXPENSE_CREATE");
    await assertMessWriteAccess(messId);
    const parsed = expenseSchema.safeParse({
      categoryId: formData.get("categoryId"),
      amount: formData.get("amount"),
      description: formData.get("description"),
      date: formData.get("date"),
    });
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

    const month = await ensureCurrentMonth(messId);

    await db.expense.create({
      data: {
        messId,
        monthId: month.id,
        categoryId: parsed.data.categoryId,
        amount: parsed.data.amount,
        description: parsed.data.description,
        date: new Date(parsed.data.date),
        status: "APPROVED",
        createdById: user.id,
        approvedById: user.id,
        approvedAt: new Date(),
      },
    });

    await recalculateMonth(messId, month.id);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/expenses");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to add expense" };
  }
}

export async function addMealCost(
  messId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const { user } = await requireMessAccess(messId, "EXPENSE_CREATE");
    await assertMessWriteAccess(messId);
    const shopperIds = formData
      .getAll("shopperIds")
      .map((id) => String(id))
      .filter(Boolean);
    const creditShopper = formData.get("creditShopper") === "on";

    const parsed = mealCostSchema.safeParse({
      date: formData.get("date"),
      amount: formData.get("amount"),
      bazarList: formData.get("bazarList") || undefined,
      creditShopper,
    });
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

    if (creditShopper && shopperIds.length === 0) {
      return { success: false, error: "Select at least one shopper to credit the deposit" };
    }

    const month = await ensureCurrentMonth(messId);

    let category = await db.expenseCategory.findFirst({
      where: {
        messId,
        deletedAt: null,
        name: { in: ["Grocery", "Bazaar", "Grocery & Bazaar"] },
      },
    });
    if (!category) {
      category = await db.expenseCategory.findFirst({
        where: { messId, deletedAt: null },
      });
    }
    if (!category) {
      return { success: false, error: "No expense category found for this mess" };
    }

    const bazarItems = parsed.data.bazarList
      ? parsed.data.bazarList
          .split(/[,;\n]/)
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const description = bazarItems.length
      ? `Bazar: ${bazarItems.join(", ")}`
      : "Meal cost";

    await db.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          messId,
          monthId: month.id,
          categoryId: category!.id,
          amount: parsed.data.amount,
          description,
          date: new Date(parsed.data.date),
          status: "APPROVED",
          createdById: user.id,
          approvedById: user.id,
          approvedAt: new Date(),
        },
      });

      if (bazarItems.length > 0) {
        await tx.bazaarEntry.create({
          data: {
            messId,
            items: JSON.stringify(bazarItems),
            totalAmount: parsed.data.amount,
            date: new Date(parsed.data.date),
            notes: `Linked to expense ${expense.id}`,
          },
        });
      }

      if (creditShopper && shopperIds.length > 0) {
        const depositEach = parsed.data.amount / shopperIds.length;
        for (const memberId of shopperIds) {
          const member = await tx.member.findFirst({
            where: { id: memberId, messId, deletedAt: null, status: "ACTIVE" },
          });
          if (!member) continue;

          await tx.deposit.create({
            data: {
              messId,
              monthId: month.id,
              memberId,
              amount: depositEach,
              method: "CASH",
              type: "MONTHLY",
              notes: `Bazar shopper credit — ${description}`,
              status: "APPROVED",
              createdById: user.id,
              approvedById: user.id,
              approvedAt: new Date(),
            },
          });
        }
      }
    });

    await recalculateMonth(messId, month.id);
    revalidatePath("/portal");
    revalidatePath(`/mess/${messId}`);
    revalidatePath(`/mess/${messId}/expenses`);
    revalidatePath(`/mess/${messId}/deposits`);
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to add meal cost" };
  }
}

export async function addDeposit(
  messId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const { user } = await requireMessAccess(messId, "DEPOSIT_CREATE");
    await assertMessWriteAccess(messId);
    const parsed = depositSchema.safeParse({
      memberId: formData.get("memberId"),
      amount: formData.get("amount"),
      method: formData.get("method"),
      type: formData.get("type") || "MONTHLY",
      reference: formData.get("reference"),
      notes: formData.get("notes"),
    });
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

    const month = await ensureCurrentMonth(messId);

    await db.deposit.create({
      data: {
        messId,
        monthId: month.id,
        memberId: parsed.data.memberId,
        amount: parsed.data.amount,
        method: parsed.data.method,
        type: parsed.data.type,
        reference: parsed.data.reference,
        notes: parsed.data.notes,
        status: "APPROVED",
        createdById: user.id,
        approvedById: user.id,
        approvedAt: new Date(),
      },
    });

    await recalculateMonth(messId, month.id);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/deposits");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to add deposit" };
  }
}

export async function addMealEntry(
  messId: string,
  formData: FormData
): Promise<ActionResult<{ count: number }>> {
  try {
    await requireMessAccess(messId, "MEAL_CREATE");
    await assertMessWriteAccess(messId);

    let entries: unknown;
    try {
      entries = JSON.parse(String(formData.get("entries") ?? "[]"));
    } catch {
      return { success: false, error: "Invalid meal data" };
    }

    const parsed = bulkMealEntriesSchema.safeParse({
      date: formData.get("date"),
      entries,
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const hasAnyMeal = parsed.data.entries.some(
      (e) => e.breakfast + e.lunch + e.dinner > 0
    );
    if (!hasAnyMeal) {
      return {
        success: false,
        error: "Select at least one meal (breakfast, lunch, or dinner) for a member",
      };
    }

    const month = await ensureCurrentMonth(messId);
    const date = new Date(parsed.data.date);
    date.setHours(0, 0, 0, 0);

    let meal = await db.meal.findUnique({
      where: { messId_date: { messId, date } },
    });
    if (!meal) {
      meal = await db.meal.create({ data: { messId, monthId: month.id, date } });
    }

    let saved = 0;

    await db.$transaction(async (tx) => {
      for (const entry of parsed.data.entries) {
        const { memberId, breakfast: newB, lunch: newL, dinner: newD } = entry;

        if (newB + newL + newD <= 0) continue;

        const member = await tx.member.findFirst({
          where: { id: memberId, messId, deletedAt: null, status: "ACTIVE" },
        });
        if (!member) continue;

        const existing = await tx.mealEntry.findUnique({
          where: { mealId_memberId: { mealId: meal!.id, memberId } },
        });

        const oldB = existing?.breakfast ?? 0;
        const oldL = existing?.lunch ?? 0;
        const oldD = existing?.dinner ?? 0;

        await tx.mealEntry.upsert({
          where: { mealId_memberId: { mealId: meal!.id, memberId } },
          create: {
            messId,
            mealId: meal!.id,
            memberId,
            breakfast: newB,
            lunch: newL,
            dinner: newD,
          },
          update: {
            breakfast: newB,
            lunch: newL,
            dinner: newD,
          },
        });

        await tx.meal.update({
          where: { id: meal!.id },
          data: {
            breakfast: { increment: newB - oldB },
            lunch: { increment: newL - oldL },
            dinner: { increment: newD - oldD },
          },
        });

        saved++;
      }
    });

    if (saved === 0) {
      return { success: false, error: "No valid members selected" };
    }

    await recalculateMonth(messId, month.id);
    revalidatePath("/portal");
    revalidatePath(`/mess/${messId}`);
    revalidatePath(`/mess/${messId}/meals`);
    return { success: true, data: { count: saved } };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to add meal" };
  }
}

export async function addMember(messId: string, formData: FormData): Promise<ActionResult> {
  try {
    await requireMessManager(messId);
    await assertMessWriteAccess(messId);
    const parsed = memberSchema.safeParse({
      fullName: formData.get("fullName"),
      phone: formData.get("phone"),
      nid: formData.get("nid"),
      bloodGroup: formData.get("bloodGroup") || undefined,
      address: formData.get("address") || undefined,
      occupation: formData.get("occupation") || undefined,
      university: formData.get("university") || undefined,
      monthlyDeposit: formData.get("monthlyDeposit"),
    });
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

    const mess = await db.mess.findFirst({
      where: { id: messId, deletedAt: null },
      include: {
        subscription: { include: { plan: true } },
        _count: { select: { members: { where: { deletedAt: null, status: "ACTIVE" } } } },
      },
    });
    if (!mess) return { success: false, error: "Mess not found" };
    const maxMembers = mess.subscription?.plan.maxMembers ?? 10;
    if (maxMembers > 0 && mess._count.members >= maxMembers) {
      return { success: false, error: "Member limit reached for current plan" };
    }

    const email = `member+${Date.now()}@messflow.local`;
    const user = await db.user.create({
      data: {
        email,
        name: parsed.data.fullName,
        phone: parsed.data.phone,
        role: UserRole.MEMBER,
      },
    });

    await db.member.create({
      data: {
        messId,
        userId: user.id,
        fullName: parsed.data.fullName,
        phone: parsed.data.phone,
        nid: parsed.data.nid,
        bloodGroup: parsed.data.bloodGroup as import("@prisma/client").BloodGroup | undefined,
        address: parsed.data.address,
        occupation: parsed.data.occupation,
        university: parsed.data.university,
        monthlyDeposit: parsed.data.monthlyDeposit,
        role: UserRole.MEMBER,
        status: "ACTIVE",
      },
    });

    revalidatePath("/portal");
    revalidatePath(`/mess/${messId}/members`);
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to add member" };
  }
}

export async function updateMember(
  messId: string,
  memberId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const { user, mess } = await requireMessManager(messId);
    await assertMessWriteAccess(messId);

    const target = await db.member.findFirst({
      where: { id: memberId, messId, deletedAt: null },
    });
    if (!target) return { success: false, error: "Member not found" };

    if (target.userId === mess.ownerId) {
      return { success: false, error: "Cannot edit the mess owner profile here" };
    }

    const parsed = memberSchema.safeParse({
      fullName: formData.get("fullName"),
      phone: formData.get("phone") || undefined,
      nid: formData.get("nid") || undefined,
      bloodGroup: formData.get("bloodGroup") || undefined,
      address: formData.get("address") || undefined,
      occupation: formData.get("occupation") || undefined,
      university: formData.get("university") || undefined,
      monthlyDeposit: formData.get("monthlyDeposit"),
    });
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

    await db.$transaction([
      db.member.update({
        where: { id: memberId },
        data: {
          fullName: parsed.data.fullName,
          phone: parsed.data.phone ?? null,
          nid: parsed.data.nid ?? null,
          bloodGroup: (parsed.data.bloodGroup as import("@prisma/client").BloodGroup) ?? null,
          address: parsed.data.address ?? null,
          occupation: parsed.data.occupation ?? null,
          university: parsed.data.university ?? null,
          monthlyDeposit: parsed.data.monthlyDeposit,
        },
      }),
      db.user.update({
        where: { id: target.userId },
        data: {
          name: parsed.data.fullName,
          phone: parsed.data.phone ?? null,
        },
      }),
      db.auditLog.create({
        data: {
          messId,
          userId: user.id,
          action: "UPDATE",
          entity: "Member",
          entityId: memberId,
          newData: JSON.stringify(parsed.data),
        },
      }),
    ]);

    revalidatePath("/portal");
    revalidatePath(`/mess/${messId}/members`);
    revalidatePath(`/mess/${messId}/members/${memberId}`);
    revalidatePath(`/mess/${messId}/members/${memberId}/edit`);
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update member" };
  }
}

export async function changeManager(messId: string, memberId: string): Promise<ActionResult> {
  try {
    const { user, mess } = await requireMessAccess(messId, "MESS_TRANSFER");
    await assertMessWriteAccess(messId);

    if (!mess.managerId || mess.managerId !== user.id) {
      return {
        success: false,
        error: "Only the current manager can assign or change the manager",
      };
    }

    const target = await db.member.findFirst({
      where: { id: memberId, messId, deletedAt: null, status: "ACTIVE" },
    });
    if (!target) return { success: false, error: "Member not found" };

    if (target.userId === mess.managerId) {
      return { success: false, error: "This member is already the manager" };
    }

    const oldManagerUserId = mess.managerId;

    await db.$transaction([
      db.mess.update({
        where: { id: messId },
        data: { managerId: target.userId },
      }),
      db.member.update({
        where: { id: memberId },
        data: { role: UserRole.MESS_MANAGER },
      }),
      ...(oldManagerUserId
        ? [
            db.member.updateMany({
              where: { messId, userId: oldManagerUserId },
              data: { role: UserRole.MEMBER },
            }),
          ]
        : []),
      db.member.updateMany({
        where: {
          messId,
          userId: { not: target.userId },
          role: { in: [UserRole.MESS_MANAGER, UserRole.ASSISTANT_MANAGER, UserRole.MESS_OWNER] },
        },
        data: { role: UserRole.MEMBER },
      }),
    ]);

    await db.auditLog.create({
      data: {
        messId,
        userId: user.id,
        action: "TRANSFER",
        entity: "Manager",
        entityId: memberId,
        oldData: JSON.stringify({ managerUserId: oldManagerUserId }),
        newData: JSON.stringify({ managerUserId: target.userId }),
      },
    });

    revalidatePath("/portal");
    revalidatePath(`/mess/${messId}`);
    revalidatePath(`/mess/${messId}/settings`);
    revalidatePath(`/mess/${messId}/settings/manager`);
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to change manager" };
  }
}

export async function approveMember(messId: string, memberId: string): Promise<ActionResult> {
  try {
    const { user } = await requireMessManager(messId);
    await assertMessWriteAccess(messId);

    const pending = await db.member.findFirst({
      where: { id: memberId, messId, status: "PENDING", deletedAt: null },
    });
    if (!pending) {
      return { success: false, error: "Member not found or already approved" };
    }

    await db.member.update({
      where: { id: memberId },
      data: { status: "ACTIVE" },
    });

    await db.auditLog.create({
      data: {
        messId,
        userId: user.id,
        action: "APPROVE",
        entity: "Member",
        entityId: memberId,
      },
    });

    revalidatePath("/portal");
    revalidatePath(`/mess/${messId}`);
    revalidatePath(`/mess/${messId}/members`);
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to approve member" };
  }
}

export async function rejectMember(messId: string, memberId: string): Promise<ActionResult> {
  try {
    await requireMessManager(messId);
    await assertMessWriteAccess(messId);

    const pending = await db.member.findFirst({
      where: { id: memberId, messId, status: "PENDING", deletedAt: null },
    });
    if (!pending) {
      return { success: false, error: "Member not found or already processed" };
    }

    await db.member.update({
      where: { id: memberId },
      data: { deletedAt: new Date(), status: "BANNED" },
    });

    revalidatePath("/portal");
    revalidatePath(`/mess/${messId}`);
    revalidatePath(`/mess/${messId}/members`);
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to reject member" };
  }
}

export async function deleteMember(messId: string, memberId: string): Promise<ActionResult> {
  try {
    const { user, mess } = await requireMessManager(messId);
    await assertMessWriteAccess(messId);

    const target = await db.member.findFirst({
      where: { id: memberId, messId, deletedAt: null },
    });
    if (!target) {
      return { success: false, error: "Member not found" };
    }

    if (target.userId === user.id) {
      return { success: false, error: "You cannot remove yourself from this mess" };
    }
    if (target.userId === mess.ownerId) {
      return { success: false, error: "Cannot remove the mess owner" };
    }
    if (mess.managerId && target.userId === mess.managerId) {
      return { success: false, error: "Assign a new manager before removing this member" };
    }

    await db.$transaction([
      db.member.update({
        where: { id: memberId },
        data: { deletedAt: new Date(), status: "LEFT" },
      }),
      db.bed.updateMany({
        where: { memberId },
        data: { memberId: null, isOccupied: false },
      }),
      db.auditLog.create({
        data: {
          messId,
          userId: user.id,
          action: "DELETE",
          entity: "Member",
          entityId: memberId,
          oldData: JSON.stringify({
            fullName: target.fullName,
            userId: target.userId,
            status: target.status,
          }),
        },
      }),
    ]);

    revalidatePath("/portal");
    revalidatePath(`/mess/${messId}`);
    revalidatePath(`/mess/${messId}/members`);
    revalidatePath(`/mess/${messId}/current-month`);
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to remove member" };
  }
}

export async function approveDeposit(messId: string, depositId: string): Promise<ActionResult> {
  try {
    const { user } = await requireMessAccess(messId, "DEPOSIT_APPROVE");
    await assertMessWriteAccess(messId);
    const deposit = await db.deposit.update({
      where: { id: depositId, messId },
      data: { status: "APPROVED", approvedById: user.id, approvedAt: new Date() },
    });

    await db.member.update({
      where: { id: deposit.memberId },
      data: { totalDeposit: { increment: deposit.amount } },
    });

    await db.transaction.create({
      data: {
        messId,
        memberId: deposit.memberId,
        type: "CREDIT",
        amount: deposit.amount,
        description: `Deposit approved - ${deposit.method}`,
      },
    });

    const mess = await db.mess.findUnique({ where: { id: messId }, select: { currentMonthId: true } });
    if (mess?.currentMonthId) await recalculateMonth(messId, mess.currentMonthId);
    revalidatePath("/dashboard/deposits");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to approve deposit" };
  }
}

export async function approveExpense(messId: string, expenseId: string): Promise<ActionResult> {
  try {
    const { user } = await requireMessAccess(messId, "EXPENSE_APPROVE");
    await assertMessWriteAccess(messId);
    await db.expense.update({
      where: { id: expenseId, messId },
      data: { status: "APPROVED", approvedById: user.id, approvedAt: new Date() },
    });
    const mess = await db.mess.findUnique({ where: { id: messId }, select: { currentMonthId: true } });
    if (mess?.currentMonthId) await recalculateMonth(messId, mess.currentMonthId);
    revalidatePath("/dashboard/expenses");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to approve expense" };
  }
}
