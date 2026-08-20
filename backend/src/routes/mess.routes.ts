import { Router } from "express";
import { asyncHandler } from "../utils/async-handler";
import {
  getMyMesses,
  createMess,
  joinMess,
  getMessDetails,
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
router.post("/:id/regenerate-invite", asyncHandler(regenerateInviteCode));
router.post("/:id/manager", asyncHandler(changeManager));
router.get("/:id", asyncHandler(getMessDetails));

export default router;
