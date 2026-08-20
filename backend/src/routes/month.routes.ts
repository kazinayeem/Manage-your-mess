import { Router } from "express";
import { asyncHandler } from "../utils/async-handler";
import {
  getMessMonths,
  getActiveMonth,
  getMonthSummary,
  startNewMonth,
  closeMonth,
} from "../controllers/month.controller";
import { authenticateUser } from "../middleware/auth";

const router = Router();

router.use(asyncHandler(authenticateUser));

router.get("/mess/:messId", asyncHandler(getMessMonths));
router.get("/mess/:messId/active", asyncHandler(getActiveMonth));
router.post("/mess/:messId", asyncHandler(startNewMonth));
router.get("/:monthId/summary", asyncHandler(getMonthSummary));
router.patch("/:monthId/close", asyncHandler(closeMonth));

export default router;
