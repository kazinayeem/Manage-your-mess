import { Router } from "express";
import { asyncHandler } from "../utils/async-handler";
import {
  getPlatformOverview,
  getAllMesses,
  getMessDetail,
  approveMess,
  rejectMess,
  suspendMess,
  activateMess,
  getAllUsers,
  getUserDetail,
  changeUserRole,
  changeUserStatus,
  getAllPayments,
  approvePayment,
  rejectPayment,
  getPaymentMethods,
  savePaymentMethod,
  deletePaymentMethod,
  reviewPaymentRequest,
  getAllSubscriptions,
  assignSubscriptionPlan,
  extendSubscription,
  updateSubscriptionStatus,
  getPlans,
  savePlan,
  duplicatePlan,
  updatePlanLifecycle,
  deletePlan,
  getCoupons,
  saveCoupon,
  deleteCoupon,
  getReferrals,
  getSupportTickets,
  createSupportTicket,
  updateSupportTicket,
  broadcastNotification,
  getAnnouncements,
  getPlatformAnalytics,
  getAuditLogs,
  getAdminNotifications,
  getSystemSettings,
  getDatabaseStats,
  getFeatureFlags,
  getBackupStatus,
  getApiOverview,
  getEmailTemplates,
  getNotificationTemplates,
  getSecurityOverview,
  getBillingSettings,
  saveBillingSettings,
} from "../controllers/super-admin.controller";
import { authenticateUser, requireRole } from "../middleware/auth";

const router = Router();
router.use(asyncHandler(authenticateUser));
router.use(requireRole("SUPER_ADMIN"));

// Dashboard
router.get("/overview", asyncHandler(getPlatformOverview));

// Mess Management
router.get("/messes", asyncHandler(getAllMesses));
router.get("/messes/:id", asyncHandler(getMessDetail));
router.patch("/messes/:id/approve", asyncHandler(approveMess));
router.patch("/messes/:id/reject", asyncHandler(rejectMess));
router.patch("/messes/:id/suspend", asyncHandler(suspendMess));
router.patch("/messes/:id/activate", asyncHandler(activateMess));

// User Management
router.get("/users", asyncHandler(getAllUsers));
router.get("/users/:id", asyncHandler(getUserDetail));
router.patch("/users/:id/role", asyncHandler(changeUserRole));
router.patch("/users/:id/status", asyncHandler(changeUserStatus));

// Payments & Payment Methods
router.get("/payments", asyncHandler(getAllPayments));
router.post("/payments/review", asyncHandler(reviewPaymentRequest));
router.patch("/payments/:id/approve", asyncHandler(approvePayment));
router.patch("/payments/:id/reject", asyncHandler(rejectPayment));
router.get("/payment-methods", asyncHandler(getPaymentMethods));
router.post("/payment-methods", asyncHandler(savePaymentMethod));
router.delete("/payment-methods/:id", asyncHandler(deletePaymentMethod));

// Subscriptions & Plans & Coupons
router.get("/subscriptions", asyncHandler(getAllSubscriptions));
router.post("/subscriptions/assign", asyncHandler(assignSubscriptionPlan));
router.post("/subscriptions/extend", asyncHandler(extendSubscription));
router.patch("/subscriptions/:id/status", asyncHandler(updateSubscriptionStatus));

router.get("/plans", asyncHandler(getPlans));
router.post("/plans", asyncHandler(savePlan));
router.post("/plans/:id/duplicate", asyncHandler(duplicatePlan));
router.patch("/plans/:id/lifecycle", asyncHandler(updatePlanLifecycle));
router.delete("/plans/:id", asyncHandler(deletePlan));

router.get("/coupons", asyncHandler(getCoupons));
router.post("/coupons", asyncHandler(saveCoupon));
router.delete("/coupons/:id", asyncHandler(deleteCoupon));

router.get("/referrals", asyncHandler(getReferrals));

// Support & Communication
router.get("/support", asyncHandler(getSupportTickets));
router.post("/support", asyncHandler(createSupportTicket));
router.patch("/support/:id", asyncHandler(updateSupportTicket));
router.post("/broadcast", asyncHandler(broadcastNotification));
router.get("/announcements", asyncHandler(getAnnouncements));

// Analytics & Audit
router.get("/analytics", asyncHandler(getPlatformAnalytics));
router.get("/audit-logs", asyncHandler(getAuditLogs));
router.get("/notifications", asyncHandler(getAdminNotifications));

// System & Management
router.get("/settings", asyncHandler(getSystemSettings));
router.get("/billing-settings", asyncHandler(getBillingSettings));
router.post("/billing-settings", asyncHandler(saveBillingSettings));
router.get("/database", asyncHandler(getDatabaseStats));
router.get("/feature-flags", asyncHandler(getFeatureFlags));
router.get("/backups", asyncHandler(getBackupStatus));
router.get("/api-overview", asyncHandler(getApiOverview));
router.get("/email-templates", asyncHandler(getEmailTemplates));
router.get("/notification-templates", asyncHandler(getNotificationTemplates));
router.get("/security", asyncHandler(getSecurityOverview));

export default router;
