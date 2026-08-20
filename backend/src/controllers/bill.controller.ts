import type { Request, Response } from "express";
import { prisma } from "../config/database";
import { AuthError, NotFoundError, ValidationError } from "../utils/errors";
import { sendSuccess } from "../utils/response";
import { computeBillSplit } from "../utils/bills/split";
import { getBillCategoryLabel } from "../utils/bills/categories";

function deriveBillStatus(dueDate?: Date | null, paidDate?: Date | null, status?: string): string {
  if (paidDate || status === "PAID") return "PAID";
  if (dueDate && dueDate < new Date()) return "OVERDUE";
  return status ?? "PENDING";
}

async function getActiveMembersWithRooms(messId: string) {
  const members = await prisma.member.findMany({
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
  splitMethod: any,
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

  await prisma.memberBill.deleteMany({ where: { billId } });
  const entries = [...splitMap.entries()].filter(([, amt]) => amt > 0);
  if (entries.length > 0) {
    await prisma.memberBill.createMany({
      data: entries.map(([memberId, shareAmount]) => ({
        billId,
        memberId,
        amount: shareAmount,
      })),
    });
  }
}

export async function getMessBills(req: Request, res: Response) {
  const messId = req.activeMessId || (req.query.messId as string);
  if (!messId) throw new ValidationError("Mess ID required");

  const { monthId, category, year } = req.query;
  const where: Record<string, unknown> = { messId, deletedAt: null };
  if (monthId) where.monthId = String(monthId);
  if (category) where.category = String(category);
  if (year) {
    const yr = Number(year);
    where.billingMonth = {
      gte: new Date(yr, 0, 1),
      lt: new Date(yr + 1, 0, 1),
    };
  }

  const bills = await prisma.bill.findMany({
    where,
    include: {
      memberShares: { include: { member: { select: { id: true, fullName: true } } } },
      paidBy: { select: { id: true, fullName: true } },
      payments: true,
      createdBy: { select: { name: true } },
    },
    orderBy: [{ billingMonth: "desc" }, { createdAt: "desc" }],
  });

  return sendSuccess(res, bills);
}

export async function getBill(req: Request, res: Response) {
  const messId = req.activeMessId || (req.query.messId as string);
  const billId = req.params.id;
  if (!messId || !billId) throw new ValidationError("Mess ID and Bill ID required");

  const bill = await prisma.bill.findFirst({
    where: { id: billId, messId, deletedAt: null },
    include: {
      memberShares: { include: { member: { select: { id: true, fullName: true, phone: true } } } },
      paidBy: { select: { id: true, fullName: true } },
      payments: { include: { member: { select: { fullName: true } } } },
      createdBy: { select: { name: true } },
    },
  });

  if (!bill) throw new NotFoundError("Bill not found");
  return sendSuccess(res, bill);
}

export async function addBill(req: Request, res: Response) {
  if (!req.user) throw new AuthError("Unauthorized");
  const messId = req.activeMessId || req.body.messId;
  if (!messId) throw new ValidationError("Mess ID required");

  const {
    category,
    amount,
    billingMonth,
    dueDate,
    paidDate,
    description,
    splitMethod = "EQUAL",
    status = "PENDING",
    paidByMemberId,
    invoiceUrl,
    receiptUrl,
    attachmentUrl,
    customSplits,
  } = req.body;

  if (!category || amount === undefined) throw new ValidationError("Category and amount required");

  const mess = await prisma.mess.findUnique({ where: { id: messId } });
  let monthId = mess?.currentMonthId;
  if (!monthId) {
    const month = await prisma.messMonth.findFirst({
      where: { messId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });
    monthId = month?.id;
  }

  const billDate = billingMonth ? new Date(billingMonth) : new Date();
  billDate.setHours(0, 0, 0, 0);

  const due = dueDate ? new Date(dueDate) : null;
  const paid = paidDate ? new Date(paidDate) : null;
  const finalStatus = deriveBillStatus(due, paid, status);

  const bill = await prisma.bill.create({
    data: {
      messId,
      monthId: monthId ?? null,
      category,
      amount: Number(amount),
      description: description || null,
      billingMonth: billDate,
      dueDate: due,
      paidDate: paid,
      paidByMemberId: paidByMemberId || null,
      status: finalStatus,
      splitMethod,
      invoiceUrl: invoiceUrl || null,
      receiptUrl: receiptUrl || null,
      attachmentUrl: attachmentUrl || null,
      createdById: req.user.id,
    },
  });

  await applyBillSplits(bill.id, Number(amount), splitMethod, messId, customSplits);
  return sendSuccess(res, { billId: bill.id }, "Bill created successfully", 201);
}

export async function recordBillPayment(req: Request, res: Response) {
  if (!req.user) throw new AuthError("Unauthorized");
  const messId = req.activeMessId || req.body.messId;
  const { billId, memberId, amount, method, note } = req.body;

  if (!billId || !amount) throw new ValidationError("Bill ID and amount required");

  const bill = await prisma.bill.findFirst({
    where: { id: billId, messId, deletedAt: null },
    include: { memberShares: true },
  });

  if (!bill) throw new NotFoundError("Bill not found");

  await prisma.billPayment.create({
    data: {
      billId: bill.id,
      memberId: memberId || null,
      amount: Number(amount),
      method: method || null,
      note: note || null,
      createdById: req.user.id,
    },
  });

  if (memberId) {
    const share = bill.memberShares.find((s) => s.memberId === memberId);
    if (share) {
      await prisma.memberBill.update({
        where: { id: share.id },
        data: { paidAmount: share.paidAmount + Number(amount) },
      });
    }
  }

  const totalPaid = bill.memberShares.reduce((s, m) => s + m.paidAmount, 0) + Number(amount);
  const newStatus = totalPaid >= bill.amount ? "PAID" : bill.status;

  await prisma.bill.update({
    where: { id: bill.id },
    data: {
      status: newStatus,
      paidDate: newStatus === "PAID" ? new Date() : bill.paidDate,
    },
  });

  return sendSuccess(res, null, "Bill payment recorded");
}

export async function deleteBill(req: Request, res: Response) {
  const messId = req.activeMessId || (req.query.messId as string);
  const billId = req.params.id;

  const bill = await prisma.bill.findFirst({ where: { id: billId, messId, deletedAt: null } });
  if (!bill) throw new NotFoundError("Bill not found");

  await prisma.bill.update({ where: { id: billId }, data: { deletedAt: new Date() } });
  return sendSuccess(res, null, "Bill deleted successfully");
}

export async function getRecurringBills(req: Request, res: Response) {
  const messId = req.activeMessId || (req.query.messId as string);
  if (!messId) throw new ValidationError("Mess ID required");

  const bills = await prisma.recurringBill.findMany({
    where: { messId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return sendSuccess(res, bills);
}

export async function addRecurringBill(req: Request, res: Response) {
  const messId = req.activeMessId || req.body.messId;
  const { category, amount, description, splitMethod = "EQUAL", dayOfMonth = 1, reminderDays = 3, dueDaysAfter = 7 } = req.body;

  if (!messId || !category || amount === undefined) throw new ValidationError("Mess ID, category and amount required");

  const recurring = await prisma.recurringBill.create({
    data: {
      messId,
      category,
      amount: Number(amount),
      description: description || null,
      splitMethod,
      dayOfMonth: Number(dayOfMonth),
      reminderDays: Number(reminderDays),
      dueDaysAfter: Number(dueDaysAfter),
    },
  });

  return sendSuccess(res, { id: recurring.id }, "Recurring bill created", 201);
}

export async function generateRecurringBills(req: Request, res: Response) {
  if (!req.user) throw new AuthError("Unauthorized");
  const messId = req.activeMessId || req.body.messId;
  if (!messId) throw new ValidationError("Mess ID required");

  const mess = await prisma.mess.findUnique({ where: { id: messId } });
  const monthId = mess?.currentMonthId;

  const now = new Date();
  const day = now.getDate();

  const recurring = await prisma.recurringBill.findMany({
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

    const bill = await prisma.bill.create({
      data: {
        messId,
        monthId: monthId ?? null,
        category: r.category,
        amount: r.amount,
        description: r.description ?? `Recurring: ${getBillCategoryLabel(r.category as any)}`,
        billingMonth: now,
        dueDate,
        status: "PENDING",
        splitMethod: r.splitMethod,
        recurringBillId: r.id,
        createdById: req.user.id,
      },
    });

    await applyBillSplits(bill.id, r.amount, r.splitMethod, messId);
    await prisma.recurringBill.update({
      where: { id: r.id },
      data: { lastGeneratedAt: now },
    });
    count++;
  }

  return sendSuccess(res, { count }, `Generated ${count} recurring bills`);
}

export async function getBillKpis(req: Request, res: Response) {
  const messId = req.activeMessId || (req.query.messId as string);
  const monthId = req.query.monthId as string;
  if (!messId) throw new ValidationError("Mess ID required");

  const bills = await prisma.bill.findMany({
    where: { messId, ...(monthId ? { monthId } : {}), deletedAt: null },
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

  return sendSuccess(res, { totalRent, totalUtilities, totalShared, billCount: bills.length });
}
