import { Router } from "express";
import { asyncHandler } from "../utils/async-handler";
import {
  getMyMesses,
  createMess,
  joinMess,
  getMessDetails,
  updateMess,
  deleteMess,
  switchActiveMess,
  regenerateInviteCode,
  changeManager,
} from "../controllers/mess.controller";
import { authenticateUser } from "../middleware/auth";

const router = Router();

router.use(asyncHandler(authenticateUser));

router.get("/", asyncHandler(getMyMesses));
router.post("/", asyncHandler(createMess));
router.post("/join", asyncHandler(joinMess));
router.post("/switch", asyncHandler(switchActiveMess));
router.get("/:id", asyncHandler(getMessDetails));
router.patch("/:id", asyncHandler(updateMess));
router.delete("/:id", asyncHandler(deleteMess));
router.post("/:id/regenerate-invite", asyncHandler(regenerateInviteCode));
router.patch("/:id/manager", asyncHandler(changeManager));
router.post("/:id/manager", asyncHandler(changeManager));

export default router;
