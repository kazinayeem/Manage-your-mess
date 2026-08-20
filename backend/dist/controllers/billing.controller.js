"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActivePlans = getActivePlans;
exports.getPaymentMethods = getPaymentMethods;
exports.submitSubscriptionRequest = submitSubscriptionRequest;
exports.getMyPaymentRequests = getMyPaymentRequests;
exports.getUserSubscription = getUserSubscription;
const database_1 = require("../config/database");
const errors_1 = require("../utils/errors");
const response_1 = require("../utils/response");
async function getActivePlans(req, res) {
    const plans = await database_1.prisma.plan.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
    });
    return (0, response_1.sendSuccess)(res, plans);
}
async function getPaymentMethods(req, res) {
    const methods = await database_1.prisma.paymentMethod.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return (0, response_1.sendSuccess)(res, methods);
}
async function submitSubscriptionRequest(req, res) {
    if (!req.user)
        throw new errors_1.AuthError("Unauthorized");
    const { planId, paymentMethodId, messId, amount, transactionId, senderNumber, note, screenshotUrl } = req.body;
    if (!planId || !paymentMethodId || !amount) {
        throw new errors_1.ValidationError("Plan, payment method, and amount required");
    }
    const plan = await database_1.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan)
        throw new errors_1.NotFoundError("Plan not found");
    const method = await database_1.prisma.paymentMethod.findUnique({ where: { id: paymentMethodId } });
    if (!method)
        throw new errors_1.NotFoundError("Payment method not found");
    const request = await database_1.prisma.subscriptionPaymentRequest.create({
        data: {
            userId: req.user.id,
            planId,
            messId: messId || null,
            paymentMethodId,
            amount: Number(amount),
            currency: plan.currency || "BDT",
            transactionId: transactionId || null,
            senderNumber: senderNumber || null,
            screenshotUrl: screenshotUrl || null,
            note: note || null,
            status: "PENDING",
        },
    });
    return (0, response_1.sendSuccess)(res, { requestId: request.id }, "Payment request submitted successfully", 201);
}
async function getMyPaymentRequests(req, res) {
    if (!req.user)
        throw new errors_1.AuthError("Unauthorized");
    const requests = await database_1.prisma.subscriptionPaymentRequest.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: "desc" },
        include: {
            plan: true,
            mess: { select: { id: true, name: true } },
            paymentMethod: true,
            reviewedBy: { select: { name: true } },
        },
    });
    return (0, response_1.sendSuccess)(res, requests);
}
async function getUserSubscription(req, res) {
    if (!req.user)
        throw new errors_1.AuthError("Unauthorized");
    const requestedUserId = req.query.userId || req.user.id;
    const subscription = await database_1.prisma.subscription.findFirst({
        where: { userId: requestedUserId },
        orderBy: { createdAt: "desc" },
        include: {
            plan: true,
            invoices: { orderBy: { createdAt: "desc" }, take: 20 },
            paymentRequests: { orderBy: { createdAt: "desc" }, take: 10 },
            extensions: { orderBy: { createdAt: "desc" }, take: 10 },
        },
    });
    return (0, response_1.sendSuccess)(res, subscription);
}
//# sourceMappingURL=billing.controller.js.map