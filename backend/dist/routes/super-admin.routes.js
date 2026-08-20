"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const async_handler_1 = require("../utils/async-handler");
const super_admin_controller_1 = require("../controllers/super-admin.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use((0, async_handler_1.asyncHandler)(auth_1.authenticateUser));
router.use((0, auth_1.requireRole)("SUPER_ADMIN"));
// Dashboard
router.get("/overview", (0, async_handler_1.asyncHandler)(super_admin_controller_1.getPlatformOverview));
// Mess Management
router.get("/messes", (0, async_handler_1.asyncHandler)(super_admin_controller_1.getAllMesses));
router.get("/messes/:id", (0, async_handler_1.asyncHandler)(super_admin_controller_1.getMessDetail));
router.patch("/messes/:id/approve", (0, async_handler_1.asyncHandler)(super_admin_controller_1.approveMess));
router.patch("/messes/:id/reject", (0, async_handler_1.asyncHandler)(super_admin_controller_1.rejectMess));
router.patch("/messes/:id/suspend", (0, async_handler_1.asyncHandler)(super_admin_controller_1.suspendMess));
router.patch("/messes/:id/activate", (0, async_handler_1.asyncHandler)(super_admin_controller_1.activateMess));
// User Management
router.get("/users", (0, async_handler_1.asyncHandler)(super_admin_controller_1.getAllUsers));
router.get("/users/:id", (0, async_handler_1.asyncHandler)(super_admin_controller_1.getUserDetail));
router.patch("/users/:id/role", (0, async_handler_1.asyncHandler)(super_admin_controller_1.changeUserRole));
router.patch("/users/:id/status", (0, async_handler_1.asyncHandler)(super_admin_controller_1.changeUserStatus));
// Payments & Payment Methods
router.get("/payments", (0, async_handler_1.asyncHandler)(super_admin_controller_1.getAllPayments));
router.post("/payments/review", (0, async_handler_1.asyncHandler)(super_admin_controller_1.reviewPaymentRequest));
router.patch("/payments/:id/approve", (0, async_handler_1.asyncHandler)(super_admin_controller_1.approvePayment));
router.patch("/payments/:id/reject", (0, async_handler_1.asyncHandler)(super_admin_controller_1.rejectPayment));
router.get("/payment-methods", (0, async_handler_1.asyncHandler)(super_admin_controller_1.getPaymentMethods));
router.post("/payment-methods", (0, async_handler_1.asyncHandler)(super_admin_controller_1.savePaymentMethod));
router.delete("/payment-methods/:id", (0, async_handler_1.asyncHandler)(super_admin_controller_1.deletePaymentMethod));
// Subscriptions & Plans & Coupons
router.get("/subscriptions", (0, async_handler_1.asyncHandler)(super_admin_controller_1.getAllSubscriptions));
router.post("/subscriptions/assign", (0, async_handler_1.asyncHandler)(super_admin_controller_1.assignSubscriptionPlan));
router.post("/subscriptions/extend", (0, async_handler_1.asyncHandler)(super_admin_controller_1.extendSubscription));
router.patch("/subscriptions/:id/status", (0, async_handler_1.asyncHandler)(super_admin_controller_1.updateSubscriptionStatus));
router.get("/plans", (0, async_handler_1.asyncHandler)(super_admin_controller_1.getPlans));
router.post("/plans", (0, async_handler_1.asyncHandler)(super_admin_controller_1.savePlan));
router.post("/plans/:id/duplicate", (0, async_handler_1.asyncHandler)(super_admin_controller_1.duplicatePlan));
router.patch("/plans/:id/lifecycle", (0, async_handler_1.asyncHandler)(super_admin_controller_1.updatePlanLifecycle));
router.delete("/plans/:id", (0, async_handler_1.asyncHandler)(super_admin_controller_1.deletePlan));
router.get("/coupons", (0, async_handler_1.asyncHandler)(super_admin_controller_1.getCoupons));
router.post("/coupons", (0, async_handler_1.asyncHandler)(super_admin_controller_1.saveCoupon));
router.delete("/coupons/:id", (0, async_handler_1.asyncHandler)(super_admin_controller_1.deleteCoupon));
router.get("/referrals", (0, async_handler_1.asyncHandler)(super_admin_controller_1.getReferrals));
// Support & Communication
router.get("/support", (0, async_handler_1.asyncHandler)(super_admin_controller_1.getSupportTickets));
router.post("/support", (0, async_handler_1.asyncHandler)(super_admin_controller_1.createSupportTicket));
router.patch("/support/:id", (0, async_handler_1.asyncHandler)(super_admin_controller_1.updateSupportTicket));
router.post("/broadcast", (0, async_handler_1.asyncHandler)(super_admin_controller_1.broadcastNotification));
router.get("/announcements", (0, async_handler_1.asyncHandler)(super_admin_controller_1.getAnnouncements));
// Analytics & Audit
router.get("/analytics", (0, async_handler_1.asyncHandler)(super_admin_controller_1.getPlatformAnalytics));
router.get("/audit-logs", (0, async_handler_1.asyncHandler)(super_admin_controller_1.getAuditLogs));
router.get("/notifications", (0, async_handler_1.asyncHandler)(super_admin_controller_1.getAdminNotifications));
// System & Management
router.get("/settings", (0, async_handler_1.asyncHandler)(super_admin_controller_1.getSystemSettings));
router.get("/billing-settings", (0, async_handler_1.asyncHandler)(super_admin_controller_1.getBillingSettings));
router.post("/billing-settings", (0, async_handler_1.asyncHandler)(super_admin_controller_1.saveBillingSettings));
router.get("/database", (0, async_handler_1.asyncHandler)(super_admin_controller_1.getDatabaseStats));
router.get("/feature-flags", (0, async_handler_1.asyncHandler)(super_admin_controller_1.getFeatureFlags));
router.get("/backups", (0, async_handler_1.asyncHandler)(super_admin_controller_1.getBackupStatus));
router.get("/api-overview", (0, async_handler_1.asyncHandler)(super_admin_controller_1.getApiOverview));
router.get("/email-templates", (0, async_handler_1.asyncHandler)(super_admin_controller_1.getEmailTemplates));
router.get("/notification-templates", (0, async_handler_1.asyncHandler)(super_admin_controller_1.getNotificationTemplates));
router.get("/security", (0, async_handler_1.asyncHandler)(super_admin_controller_1.getSecurityOverview));
exports.default = router;
//# sourceMappingURL=super-admin.routes.js.map