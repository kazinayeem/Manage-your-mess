import { Router } from "express";
import { asyncHandler } from "../utils/async-handler";
import { authenticateUser } from "../middleware/auth";
import {
  getUserAnnouncements,
  getActiveAnnouncementsForUser,
  markAnnouncementRead,
} from "../controllers/announcement.controller";

const router = Router();
router.use(asyncHandler(authenticateUser));

router.get("/", asyncHandler(getUserAnnouncements));
router.get("/active", asyncHandler(getActiveAnnouncementsForUser));
router.patch("/:id/read", asyncHandler(markAnnouncementRead));

export default router;
