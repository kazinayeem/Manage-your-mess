import { Router } from "express";
import { asyncHandler } from "../utils/async-handler";
import { updateProfile } from "../controllers/user.controller";
import { authenticateUser } from "../middleware/auth";

const router = Router();
router.use(asyncHandler(authenticateUser));

router.put("/profile", asyncHandler(updateProfile));

export default router;
