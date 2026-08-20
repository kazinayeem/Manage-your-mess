"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMessBills = getMessBills;
exports.getBill = getBill;
exports.addBill = addBill;
exports.recordBillPayment = recordBillPayment;
exports.deleteBill = deleteBill;
exports.getRecurringBills = getRecurringBills;
exports.addRecurringBill = addRecurringBill;
exports.generateRecurringBills = generateRecurringBills;
exports.getBillKpis = getBillKpis;
const database_1 = require("../config/database");
const errors_1 = require("../utils/errors");
const response_1 = require("../utils/response");
const split_1 = require("../utils/bills/split");
const categories_1 = require("../utils/bills/categories");
function deriveBillStatus(dueDate, paidDate, status) {
    if (paidDate || status === "PAID")
        return "PAID";
    if (dueDate && dueDate < new Date())
        return "OVERDUE";
    return status ?? "PENDING";
}
async function getActiveMembersWithRooms(messId) {
    const members = await database_1.prisma.member.findMany({
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
async function applyBillSplits(billId, amount, splitMethod, messId, customSplits) {
    const members = await getActiveMembersWithRooms(messId);
    const splitMap = (0, split_1.computeBillSplit)(amount, splitMethod, members.map((m) => ({ id: m.id, roomId: m.roomId })), customSplits ?? []);
    await database_1.prisma.memberBill.deleteMany({ where: { billId } });
    const entries = [...splitMap.entries()].filter(([, amt]) => amt > 0);
    if (entries.length > 0) {
        await database_1.prisma.memberBill.createMany({
            data: entries.map(([memberId, shareAmount]) => ({
                billId,
                memberId,
                amount: shareAmount,
            })),
        });
    }
}
async function getMessBills(req, res) {
    const messId = req.activeMessId || req.query.messId;
    if (!messId)
        throw new errors_1.ValidationError("Mess ID required");
    const { monthId, category, year } = req.query;
    const where = { messId, deletedAt: null };
    if (monthId)
        where.monthId = String(monthId);
    if (category)
        where.category = String(category);
    if (year) {
        const yr = Number(year);
        where.billingMonth = {
            gte: new Date(yr, 0, 1),
            lt: new Date(yr + 1, 0, 1),
        };
    }
    const bills = await database_1.prisma.bill.findMany({
        where,
        include: {
            memberShares: { include: { member: { select: { id: true, fullName: true } } } },
            paidBy: { select: { id: true, fullName: true } },
            payments: true,
            createdBy: { select: { name: true } },
        },
        orderBy: [{ billingMonth: "desc" }, { createdAt: "desc" }],
    });
    return (0, response_1.sendSuccess)(res, bills);
}
async function getBill(req, res) {
    const messId = req.activeMessId || req.query.messId;
    const billId = req.params.id;
    if (!messId || !billId)
        throw new errors_1.ValidationError("Mess ID and Bill ID required");
    const bill = await database_1.prisma.bill.findFirst({
        where: { id: billId, messId, deletedAt: null },
        include: {
            memberShares: { include: { member: { select: { id: true, fullName: true, phone: true } } } },
            paidBy: { select: { id: true, fullName: true } },
            payments: { include: { member: { select: { fullName: true } } } },
            createdBy: { select: { name: true } },
        },
    });
    if (!bill)
        throw new errors_1.NotFoundError("Bill not found");
    return (0, response_1.sendSuccess)(res, bill);
}
async function addBill(req, res) {
    if (!req.user)
        throw new errors_1.AuthError("Unauthorized");
    const messId = req.activeMessId || req.body.messId;
    if (!messId)
        throw new errors_1.ValidationError("Mess ID required");
    const { category, amount, billingMonth, dueDate, paidDate, description, splitMethod = "EQUAL", status = "PENDING", paidByMemberId, invoiceUrl, receiptUrl, attachmentUrl, customSplits, } = req.body;
    if (!category || amount === undefined)
        throw new errors_1.ValidationError("Category and amount required");
    const mess = await database_1.prisma.mess.findUnique({ where: { id: messId } });
    let monthId = mess?.currentMonthId;
    if (!monthId) {
        const month = await database_1.prisma.messMonth.findFirst({
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
    const bill = await database_1.prisma.bill.create({
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
    return (0, response_1.sendSuccess)(res, { billId: bill.id }, "Bill created successfully", 201);
}
async function recordBillPayment(req, res) {
    if (!req.user)
        throw new errors_1.AuthError("Unauthorized");
    const messId = req.activeMessId || req.body.messId;
    const { billId, memberId, amount, method, note } = req.body;
    if (!billId || !amount)
        throw new errors_1.ValidationError("Bill ID and amount required");
    const bill = await database_1.prisma.bill.findFirst({
        where: { id: billId, messId, deletedAt: null },
        include: { memberShares: true },
    });
    if (!bill)
        throw new errors_1.NotFoundError("Bill not found");
    await database_1.prisma.billPayment.create({
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
            await database_1.prisma.memberBill.update({
                where: { id: share.id },
                data: { paidAmount: share.paidAmount + Number(amount) },
            });
        }
    }
    const totalPaid = bill.memberShares.reduce((s, m) => s + m.paidAmount, 0) + Number(amount);
    const newStatus = totalPaid >= bill.amount ? "PAID" : bill.status;
    await database_1.prisma.bill.update({
        where: { id: bill.id },
        data: {
            status: newStatus,
            paidDate: newStatus === "PAID" ? new Date() : bill.paidDate,
        },
    });
    return (0, response_1.sendSuccess)(res, null, "Bill payment recorded");
}
async function deleteBill(req, res) {
    const messId = req.activeMessId || req.query.messId;
    const billId = req.params.id;
    const bill = await database_1.prisma.bill.findFirst({ where: { id: billId, messId, deletedAt: null } });
    if (!bill)
        throw new errors_1.NotFoundError("Bill not found");
    await database_1.prisma.bill.update({ where: { id: billId }, data: { deletedAt: new Date() } });
    return (0, response_1.sendSuccess)(res, null, "Bill deleted successfully");
}
async function getRecurringBills(req, res) {
    const messId = req.activeMessId || req.query.messId;
    if (!messId)
        throw new errors_1.ValidationError("Mess ID required");
    const bills = await database_1.prisma.recurringBill.findMany({
        where: { messId, deletedAt: null },
        orderBy: { createdAt: "desc" },
    });
    return (0, response_1.sendSuccess)(res, bills);
}
async function addRecurringBill(req, res) {
    const messId = req.activeMessId || req.body.messId;
    const { category, amount, description, splitMethod = "EQUAL", dayOfMonth = 1, reminderDays = 3, dueDaysAfter = 7 } = req.body;
    if (!messId || !category || amount === undefined)
        throw new errors_1.ValidationError("Mess ID, category and amount required");
    const recurring = await database_1.prisma.recurringBill.create({
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
    return (0, response_1.sendSuccess)(res, { id: recurring.id }, "Recurring bill created", 201);
}
async function generateRecurringBills(req, res) {
    if (!req.user)
        throw new errors_1.AuthError("Unauthorized");
    const messId = req.activeMessId || req.body.messId;
    if (!messId)
        throw new errors_1.ValidationError("Mess ID required");
    const mess = await database_1.prisma.mess.findUnique({ where: { id: messId } });
    const monthId = mess?.currentMonthId;
    const now = new Date();
    const day = now.getDate();
    const recurring = await database_1.prisma.recurringBill.findMany({
        where: { messId, isActive: true, deletedAt: null },
    });
    let count = 0;
    for (const r of recurring) {
        if (r.dayOfMonth !== day)
            continue;
        if (r.lastGeneratedAt) {
            const last = r.lastGeneratedAt;
            if (last.getMonth() === now.getMonth() && last.getFullYear() === now.getFullYear())
                continue;
        }
        const dueDate = new Date(now);
        dueDate.setDate(dueDate.getDate() + r.dueDaysAfter);
        const bill = await database_1.prisma.bill.create({
            data: {
                messId,
                monthId: monthId ?? null,
                category: r.category,
                amount: r.amount,
                description: r.description ?? `Recurring: ${(0, categories_1.getBillCategoryLabel)(r.category)}`,
                billingMonth: now,
                dueDate,
                status: "PENDING",
                splitMethod: r.splitMethod,
                recurringBillId: r.id,
                createdById: req.user.id,
            },
        });
        await applyBillSplits(bill.id, r.amount, r.splitMethod, messId);
        await database_1.prisma.recurringBill.update({
            where: { id: r.id },
            data: { lastGeneratedAt: now },
        });
        count++;
    }
    return (0, response_1.sendSuccess)(res, { count }, `Generated ${count} recurring bills`);
}
async function getBillKpis(req, res) {
    const messId = req.activeMessId || req.query.messId;
    const monthId = req.query.monthId;
    if (!messId)
        throw new errors_1.ValidationError("Mess ID required");
    const bills = await database_1.prisma.bill.findMany({
        where: { messId, ...(monthId ? { monthId } : {}), deletedAt: null },
    });
    let totalRent = 0;
    let totalUtilities = 0;
    let totalShared = 0;
    for (const b of bills) {
        totalShared += b.amount;
        if (b.category === "HOUSE_RENT")
            totalRent += b.amount;
        else if (["ELECTRICITY", "WATER", "GAS", "INTERNET", "GENERATOR"].includes(b.category)) {
            totalUtilities += b.amount;
        }
    }
    return (0, response_1.sendSuccess)(res, { totalRent, totalUtilities, totalShared, billCount: bills.length });
}
//# sourceMappingURL=bill.controller.js.map