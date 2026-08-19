import { Router } from "express";
import { asyncHandler } from "../utils/async-handler";
import { getPlatformOverview } from "../controllers/super-admin.controller";
import { authenticateUser, requireRole } from "../middleware/auth";

const router = Router();
router.use(asyncHandler(authenticateUser));
router.use(requireRole("SUPER_ADMIN"));

router.get("/overview", asyncHandler(getPlatformOverview));

export default router;
