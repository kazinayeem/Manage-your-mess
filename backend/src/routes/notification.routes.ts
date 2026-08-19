import { Router } from "express";
import { asyncHandler } from "../utils/async-handler";
import { getNotifications, markAsRead } from "../controllers/notification.controller";
import { authenticateUser } from "../middleware/auth";

const router = Router();
router.use(asyncHandler(authenticateUser));

router.get("/", asyncHandler(getNotifications));
router.patch("/:id/read", asyncHandler(markAsRead));

export default router;
