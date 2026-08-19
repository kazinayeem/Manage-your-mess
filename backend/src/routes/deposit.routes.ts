import { Router } from "express";
import { asyncHandler } from "../utils/async-handler";
import { getDeposits, createDeposit, updateDepositStatus } from "../controllers/deposit.controller";
import { authenticateUser } from "../middleware/auth";

const router = Router();
router.use(asyncHandler(authenticateUser));

router.get("/", asyncHandler(getDeposits));
router.post("/", asyncHandler(createDeposit));
router.patch("/:id/status", asyncHandler(updateDepositStatus));

export default router;
