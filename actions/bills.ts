"use server";

import { revalidatePath } from "next/cache";
import type { BillCategoryType, BillStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireMessAccess } from "@/lib/mess-access";
import { assertMessWriteAccess } from "@/lib/billing/subscription-access";
import { ensureCurrentMonth } from "@/lib/mess-context";
import { recalculateMonth } from "@/actions/monthly";
import { computeBillSplit } from "@/lib/bills/split";
import { getBillCategoryLabel } from "@/lib/bills/categories";
import { billSchema, billPaymentSchema, recurringBillSchema } from "@/lib/validations";

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

function parseDate(value?: string): Date | undefined {
  if (!value?.trim()) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function deriveBillStatus(dueDate?: Date | null, paidDate?: Date | null, status?: BillStatus): BillStatus {
  if (paidDate || status === "PAID") return "PAID";
  if (dueDate && dueDate < new Date()) return "OVERDUE";
  return status ?? "PENDING";
}

async function getActiveMembersWithRooms(messId: string) {
  const members = await db.member.findMany({
    where: { messId, deletedAt: null, status: "ACTIVE" },
    include: { bed: { include: { room: true } } },
  });
  return members.map((m) => ({
    id: m.id,
    fullName: m.fullName,
    roomId: m.bed?.roomId ?? null,
    roomNumber: m.bed?.room?.number ?? null,
  }));
}

async function applyBillSplits(
  billId: string,
  amount: number,
  splitMethod: "EQUAL" | "ROOM_BASED" | "CUSTOM",
  messId: string,
  customSplits?: { memberId: string; amount: number }[]
) {
  const members = await getActiveMembersWithRooms(messId);
  const splitMap = computeBillSplit(
    amount,
    splitMethod,
    members.map((m) => ({ id: m.id, roomId: m.roomId })),
    customSplits ?? []
  );

  await db.memberBill.deleteMany({ where: { billId } });
  const entries = [...splitMap.entries()].filter(([, amt]) => amt > 0);
  if (entries.length > 0) {
    await db.memberBill.createMany({
      data: entries.map(([memberId, shareAmount]) => ({
        billId,
        memberId,
        amount: shareAmount,
      })),
    });
  }
}

export async function getMessBills(
  messId: string,
  opts?: { monthId?: string; category?: BillCategoryType; year?: number }
) {
  await requireMessAccess(messId, "BILL_READ");

  const where: Record<string, unknown> = { messId, deletedAt: null };
  if (opts?.monthId) where.monthId = opts.monthId;
  if (opts?.category) where.category = opts.category;
  if (opts?.year) {
    where.billingMonth = {
      gte: new Date(opts.year, 0, 1),
      lt: new Date(opts.year + 1, 0, 1),
    };
  }

  return db.bill.findMany({
    where,
    include: {
      memberShares: { include: { member: { select: { id: true, fullName: true } } } },
      paidBy: { select: { id: true, fullName: true } },
      payments: true,
      createdBy: { select: { name: true } },
    },
    orderBy: [{ billingMonth: "desc" }, { createdAt: "desc" }],
  });
}

export async function getBill(messId: string, billId: string) {
  await requireMessAccess(messId, "BILL_READ");
  return db.bill.findFirst({
    where: { id: billId, messId, deletedAt: null },
    include: {
      memberShares: { include: { member: { select: { id: true, fullName: true, phone: true } } } },
      paidBy: { select: { id: true, fullName: true } },
      payments: { include: { member: { select: { fullName: true } } } },
      createdBy: { select: { name: true } },
    },
  });
}

export async function addBill(messId: string, formData: FormData): Promise<ActionResult<{ billId: string }>> {
  try {
    const { user } = await requireMessAccess(messId, "BILL_CREATE");
    await assertMessWriteAccess(messId);

    let customSplits: { memberId: string; amount: number }[] | undefined;
    const rawSplits = formData.get("customSplits");
    if (rawSplits) {
      try {
        customSplits = JSON.parse(String(rawSplits));
      } catch {
        return { success: false, error: "Invalid custom split data" };
      }
    }

    const parsed = billSchema.safeParse({
      category: formData.get("category"),
      amount: formData.get("amount"),
      billingMonth: formData.get("billingMonth"),
      dueDate: formData.get("dueDate") || undefined,
      paidDate: formData.get("paidDate") || undefined,
      description: formData.get("description") || undefined,
      splitMethod: formData.get("splitMethod") || "EQUAL",
      status: formData.get("status") || "PENDING",
      paidByMemberId: formData.get("paidByMemberId") || undefined,
      invoiceUrl: formData.get("invoiceUrl") || undefined,
      receiptUrl: formData.get("receiptUrl") || undefined,
      attachmentUrl: formData.get("attachmentUrl") || undefined,
      customSplits,
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const month = await ensureCurrentMonth(messId);
    const billingMonth = parseDate(parsed.data.billingMonth) ?? new Date();
    billingMonth.setHours(0, 0, 0, 0);
    const dueDate = parseDate(parsed.data.dueDate);
    const paidDate = parseDate(parsed.data.paidDate);
    const status = deriveBillStatus(dueDate, paidDate, parsed.data.status);

    const bill = await db.bill.create({
      data: {
        messId,
        monthId: month.id,
        category: parsed.data.category,
        amount: parsed.data.amount,
        description: parsed.data.description,
        billingMonth,
        dueDate,
        paidDate,
        paidByMemberId: parsed.data.paidByMemberId || null,
        status,
        splitMethod: parsed.data.splitMethod,
        invoiceUrl: parsed.data.invoiceUrl,
        receiptUrl: parsed.data.receiptUrl,
        attachmentUrl: parsed.data.attachmentUrl,
        createdById: user.id,
      },
    });

    await applyBillSplits(bill.id, parsed.data.amount, parsed.data.splitMethod, messId, customSplits);
    await recalculateMonth(messId, month.id);

    revalidatePath(`/mess/${messId}`);
    revalidatePath(`/mess/${messId}/bills`);
    revalidatePath(`/mess/${messId}/current-month`);
    return { success: true, data: { billId: bill.id } };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to add bill" };
  }
}

export async function recordBillPayment(
  messId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const { user } = await requireMessAccess(messId, "BILL_PAYMENT");
    await assertMessWriteAccess(messId);

    const parsed = billPaymentSchema.safeParse({
      billId: formData.get("billId"),
      memberId: formData.get("memberId") || undefined,
      amount: formData.get("amount"),
      method: formData.get("method") || undefined,
      note: formData.get("note") || undefined,
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const bill = await db.bill.findFirst({
      where: { id: parsed.data.billId, messId, deletedAt: null },
      include: { memberShares: true },
    });
    if (!bill) return { success: false, error: "Bill not found" };

    await db.billPayment.create({
      data: {
        billId: bill.id,
        memberId: parsed.data.memberId ?? null,
        amount: parsed.data.amount,
        method: parsed.data.method,
        note: parsed.data.note,
        createdById: user.id,
      },
    });

    if (parsed.data.memberId) {
      const share = bill.memberShares.find((s) => s.memberId === parsed.data.memberId);
      if (share) {
        await db.memberBill.update({
          where: { id: share.id },
          data: { paidAmount: share.paidAmount + parsed.data.amount },
        });
      }
    }

    const totalPaid = bill.memberShares.reduce((s, m) => s + m.paidAmount, 0) + parsed.data.amount;
    const newStatus: BillStatus = totalPaid >= bill.amount ? "PAID" : bill.status;

    await db.bill.update({
      where: { id: bill.id },
      data: {
        status: newStatus,
        paidDate: newStatus === "PAID" ? new Date() : bill.paidDate,
      },
    });

    if (bill.monthId) await recalculateMonth(messId, bill.monthId);

    revalidatePath(`/mess/${messId}/bills`);
    revalidatePath(`/mess/${messId}/bills/${bill.id}`);
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Payment failed" };
  }
}

export async function deleteBill(messId: string, billId: string): Promise<ActionResult> {
  try {
    await requireMessAccess(messId, "BILL_DELETE");
    await assertMessWriteAccess(messId);

    const bill = await db.bill.findFirst({ where: { id: billId, messId, deletedAt: null } });
    if (!bill) return { success: false, error: "Bill not found" };

    await db.bill.update({ where: { id: billId }, data: { deletedAt: new Date() } });
    if (bill.monthId) await recalculateMonth(messId, bill.monthId);

    revalidatePath(`/mess/${messId}/bills`);
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Delete failed" };
  }
}

export async function getRecurringBills(messId: string) {
  await requireMessAccess(messId, "BILL_READ");
  return db.recurringBill.findMany({
    where: { messId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
}

export async function addRecurringBill(
  messId: string,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireMessAccess(messId, "RECURRING_BILL_MANAGE");
    await assertMessWriteAccess(messId);

    const parsed = recurringBillSchema.safeParse({
      category: formData.get("category"),
      amount: formData.get("amount"),
      description: formData.get("description") || undefined,
      splitMethod: formData.get("splitMethod") || "EQUAL",
      dayOfMonth: formData.get("dayOfMonth") || 1,
      reminderDays: formData.get("reminderDays") || 3,
      dueDaysAfter: formData.get("dueDaysAfter") || 7,
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const recurring = await db.recurringBill.create({
      data: { messId, ...parsed.data },
    });

    revalidatePath(`/mess/${messId}/bills/recurring`);
    return { success: true, data: { id: recurring.id } };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to create recurring bill" };
  }
}

export async function generateRecurringBills(messId: string): Promise<ActionResult<{ count: number }>> {
  try {
    const { user } = await requireMessAccess(messId, "RECURRING_BILL_MANAGE");
    await assertMessWriteAccess(messId);
    const month = await ensureCurrentMonth(messId);
    const now = new Date();
    const day = now.getDate();

    const recurring = await db.recurringBill.findMany({
      where: { messId, isActive: true, deletedAt: null },
    });

    let count = 0;
    for (const r of recurring) {
      if (r.dayOfMonth !== day) continue;
      if (r.lastGeneratedAt) {
        const last = r.lastGeneratedAt;
        if (last.getMonth() === now.getMonth() && last.getFullYear() === now.getFullYear()) continue;
      }

      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + r.dueDaysAfter);

      const bill = await db.bill.create({
        data: {
          messId,
          monthId: month.id,
          category: r.category,
          amount: r.amount,
          description: r.description ?? `Recurring: ${getBillCategoryLabel(r.category)}`,
          billingMonth: now,
          dueDate,
          status: "PENDING",
          splitMethod: r.splitMethod,
          recurringBillId: r.id,
          createdById: user.id,
        },
      });

      await applyBillSplits(bill.id, r.amount, r.splitMethod, messId);
      await db.recurringBill.update({
        where: { id: r.id },
        data: { lastGeneratedAt: now },
      });
      count++;
    }

    if (count > 0) await recalculateMonth(messId, month.id);

    revalidatePath(`/mess/${messId}/bills`);
    return { success: true, data: { count } };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Generation failed" };
  }
}

export async function getBillKpis(messId: string, monthId: string) {
  await requireMessAccess(messId, "BILL_READ");

  const bills = await db.bill.findMany({
    where: { messId, monthId, deletedAt: null },
  });

  let totalRent = 0;
  let totalUtilities = 0;
  let totalShared = 0;

  for (const b of bills) {
    totalShared += b.amount;
    if (b.category === "HOUSE_RENT") totalRent += b.amount;
    else if (["ELECTRICITY", "WATER", "GAS", "INTERNET", "GENERATOR"].includes(b.category)) {
      totalUtilities += b.amount;
    }
  }

  return { totalRent, totalUtilities, totalShared, billCount: bills.length };
}
