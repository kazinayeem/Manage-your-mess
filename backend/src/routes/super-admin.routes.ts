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
  getAllSubscriptions,
  getPlans,
  getCoupons,
  getReferrals,
  getSupportTickets,
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
router.patch("/payments/:id/approve", asyncHandler(approvePayment));
router.patch("/payments/:id/reject", asyncHandler(rejectPayment));
router.get("/payment-methods", asyncHandler(getPaymentMethods));

// Subscriptions, Plans, Coupons, Referrals
router.get("/subscriptions", asyncHandler(getAllSubscriptions));
router.get("/plans", asyncHandler(getPlans));
router.get("/coupons", asyncHandler(getCoupons));
router.get("/referrals", asyncHandler(getReferrals));

// Support & Communication
router.get("/support", asyncHandler(getSupportTickets));
router.get("/announcements", asyncHandler(getAnnouncements));

// Analytics & Audit
router.get("/analytics", asyncHandler(getPlatformAnalytics));
router.get("/audit-logs", asyncHandler(getAuditLogs));
router.get("/notifications", asyncHandler(getAdminNotifications));

// System & Management
router.get("/settings", asyncHandler(getSystemSettings));
router.get("/database", asyncHandler(getDatabaseStats));
router.get("/feature-flags", asyncHandler(getFeatureFlags));
router.get("/backups", asyncHandler(getBackupStatus));
router.get("/api-overview", asyncHandler(getApiOverview));
router.get("/email-templates", asyncHandler(getEmailTemplates));
router.get("/notification-templates", asyncHandler(getNotificationTemplates));
router.get("/security", asyncHandler(getSecurityOverview));

export default router;
