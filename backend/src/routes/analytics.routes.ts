import { Router } from "express";
import { asyncHandler } from "../utils/async-handler";
import { getDashboardAnalytics, getExpenseTrend } from "../controllers/analytics.controller";
import { authenticateUser } from "../middleware/auth";

const router = Router();
router.use(asyncHandler(authenticateUser));

router.get("/dashboard", asyncHandler(getDashboardAnalytics));
router.get("/expense-trend", asyncHandler(getExpenseTrend));

export default router;
