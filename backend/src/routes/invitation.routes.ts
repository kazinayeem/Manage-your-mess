import { Router } from "express";
import { asyncHandler } from "../utils/async-handler";
import {
  createInvitation,
  getMessInvitations,
  cancelInvitation,
  getInvitationByToken,
  acceptInvitation,
  rejectInvitation,
} from "../controllers/invitation.controller";
import { authenticateUser } from "../middleware/auth";

const router = Router();

// Public routes for token inspection and rejection
router.get("/token/:token", asyncHandler(getInvitationByToken));
router.post("/token/:token/reject", asyncHandler(rejectInvitation));

// Auth required routes
router.use(asyncHandler(authenticateUser));
router.post("/token/:token/accept", asyncHandler(acceptInvitation));
router.post("/mess/:messId", asyncHandler(createInvitation));
router.get("/mess/:messId", asyncHandler(getMessInvitations));
router.delete("/:id", asyncHandler(cancelInvitation));

export default router;
