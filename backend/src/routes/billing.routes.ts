import { Router } from "express";
import { asyncHandler } from "../utils/async-handler";
import { authenticateUser } from "../middleware/auth";
import {
  getActivePlans,
  getPaymentMethods,
  submitSubscriptionRequest,
  getMyPaymentRequests,
  getUserSubscription,
} from "../controllers/billing.controller";

const router = Router();
router.use(asyncHandler(authenticateUser));

router.get("/plans", asyncHandler(getActivePlans));
router.get("/payment-methods", asyncHandler(getPaymentMethods));
router.post("/subscription-request", asyncHandler(submitSubscriptionRequest));
router.get("/my-payment-requests", asyncHandler(getMyPaymentRequests));
router.get("/subscription", asyncHandler(getUserSubscription));

export default router;
