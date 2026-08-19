import { Router } from "express";
import { asyncHandler } from "../utils/async-handler";
import { getMembers, getMemberById, updateMemberStatus } from "../controllers/member.controller";
import { authenticateUser } from "../middleware/auth";

const router = Router();
router.use(asyncHandler(authenticateUser));

router.get("/", asyncHandler(getMembers));
router.get("/:id", asyncHandler(getMemberById));
router.patch("/:id/status", asyncHandler(updateMemberStatus));

export default router;
