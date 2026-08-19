import { Router } from "express";
import { asyncHandler } from "../utils/async-handler";
import { getBazaarTasks, createBazaarTask, submitBazaar } from "../controllers/bazaar.controller";
import { authenticateUser } from "../middleware/auth";

const router = Router();
router.use(asyncHandler(authenticateUser));

router.get("/", asyncHandler(getBazaarTasks));
router.post("/", asyncHandler(createBazaarTask));
router.post("/:taskId/submit", asyncHandler(submitBazaar));

export default router;
