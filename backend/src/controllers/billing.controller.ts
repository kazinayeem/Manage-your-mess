import type { Request, Response } from "express";
import { prisma } from "../config/database";
import { AuthError, NotFoundError, ValidationError } from "../utils/errors";
import { sendSuccess } from "../utils/response";

export async function getActivePlans(req: Request, res: Response) {
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
  });
  return sendSuccess(res, plans);
}

export async function getPaymentMethods(req: Request, res: Response) {
  const methods = await prisma.paymentMethod.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return sendSuccess(res, methods);
}

export async function submitSubscriptionRequest(req: Request, res: Response) {
  if (!req.user) throw new AuthError("Unauthorized");

  const { planId, paymentMethodId, messId, amount, transactionId, senderNumber, note, screenshotUrl } = req.body;
  if (!planId || !paymentMethodId || !amount) {
    throw new ValidationError("Plan, payment method, and amount required");
  }

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) throw new NotFoundError("Plan not found");

  const method = await prisma.paymentMethod.findUnique({ where: { id: paymentMethodId } });
  if (!method) throw new NotFoundError("Payment method not found");

  const request = await prisma.subscriptionPaymentRequest.create({
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

  return sendSuccess(res, { requestId: request.id }, "Payment request submitted successfully", 201);
}

export async function getMyPaymentRequests(req: Request, res: Response) {
  if (!req.user) throw new AuthError("Unauthorized");

  const requests = await prisma.subscriptionPaymentRequest.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      plan: true,
      mess: { select: { id: true, name: true } },
      paymentMethod: true,
      reviewedBy: { select: { name: true } },
    },
  });

  return sendSuccess(res, requests);
}

export async function getUserSubscription(req: Request, res: Response) {
  if (!req.user) throw new AuthError("Unauthorized");
  const requestedUserId = (req.query.userId as string) || req.user.id;

  const subscription = await prisma.subscription.findFirst({
    where: { userId: requestedUserId },
    orderBy: { createdAt: "desc" },
    include: {
      plan: true,
      invoices: { orderBy: { createdAt: "desc" }, take: 20 },
      paymentRequests: { orderBy: { createdAt: "desc" }, take: 10 },
      extensions: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  return sendSuccess(res, subscription);
}
