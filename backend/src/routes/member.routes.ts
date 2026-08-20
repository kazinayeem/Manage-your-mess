import { Router } from "express";
import { asyncHandler } from "../utils/async-handler";
import {
  getMembers,
  getMemberById,
  updateMember,
  updateMemberStatus,
  removeMember,
} from "../controllers/member.controller";
import { authenticateUser } from "../middleware/auth";

const router = Router({ mergeParams: true });

router.use(asyncHandler(authenticateUser));

router.get("/", asyncHandler(getMembers));
router.get("/:id", asyncHandler(getMemberById));
router.patch("/:id", asyncHandler(updateMember));
router.patch("/:id/status", asyncHandler(updateMemberStatus));
router.delete("/:id", asyncHandler(removeMember));

export default router;
