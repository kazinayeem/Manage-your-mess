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
  getAllSubscriptions,
  getPlatformAnalytics,
  getAuditLogs,
  getAdminNotifications,
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

// Payments
router.get("/payments", asyncHandler(getAllPayments));
router.patch("/payments/:id/approve", asyncHandler(approvePayment));
router.patch("/payments/:id/reject", asyncHandler(rejectPayment));

// Subscriptions
router.get("/subscriptions", asyncHandler(getAllSubscriptions));

// Analytics
router.get("/analytics", asyncHandler(getPlatformAnalytics));

// Audit Logs
router.get("/audit-logs", asyncHandler(getAuditLogs));

// Admin Notifications
router.get("/notifications", asyncHandler(getAdminNotifications));

export default router;
