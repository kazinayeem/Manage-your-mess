import { Router } from "express";
import { asyncHandler } from "../utils/async-handler";
import { authenticateUser } from "../middleware/auth";
import { getMessMonthsForReports, fetchReportData } from "../controllers/report.controller";

const router = Router();
router.use(asyncHandler(authenticateUser));

router.get("/months", asyncHandler(getMessMonthsForReports));
router.get("/data", asyncHandler(fetchReportData));

export default router;
