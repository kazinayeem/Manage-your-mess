import { Router } from "express";
import { asyncHandler } from "../utils/async-handler";
import {
  getBazaarTasks,
  createBazaarTask,
  submitBazaar,
  approveBazaar,
  rejectBazaar,
} from "../controllers/bazaar.controller";
import { authenticateUser } from "../middleware/auth";

const router = Router({ mergeParams: true });

router.use(asyncHandler(authenticateUser));

router.get("/", asyncHandler(getBazaarTasks));
router.post("/", asyncHandler(createBazaarTask));
router.post("/:taskId/submit", asyncHandler(submitBazaar));
router.post("/:taskId/approve", asyncHandler(approveBazaar));
router.post("/:taskId/reject", asyncHandler(rejectBazaar));

export default router;
