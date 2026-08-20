"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const async_handler_1 = require("../utils/async-handler");
const auth_1 = require("../middleware/auth");
const billing_controller_1 = require("../controllers/billing.controller");
const router = (0, express_1.Router)();
router.use((0, async_handler_1.asyncHandler)(auth_1.authenticateUser));
router.get("/plans", (0, async_handler_1.asyncHandler)(billing_controller_1.getActivePlans));
router.get("/payment-methods", (0, async_handler_1.asyncHandler)(billing_controller_1.getPaymentMethods));
router.post("/subscription-request", (0, async_handler_1.asyncHandler)(billing_controller_1.submitSubscriptionRequest));
router.get("/my-payment-requests", (0, async_handler_1.asyncHandler)(billing_controller_1.getMyPaymentRequests));
router.get("/subscription", (0, async_handler_1.asyncHandler)(billing_controller_1.getUserSubscription));
exports.default = router;
//# sourceMappingURL=billing.routes.js.map