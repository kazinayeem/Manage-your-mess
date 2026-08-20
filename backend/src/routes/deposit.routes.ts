import { Router } from "express";
import { asyncHandler } from "../utils/async-handler";
import {
  getDeposits,
  createDeposit,
  updateDeposit,
  deleteDeposit,
} from "../controllers/deposit.controller";
import { authenticateUser } from "../middleware/auth";

const router = Router({ mergeParams: true });

router.use(asyncHandler(authenticateUser));

router.get("/", asyncHandler(getDeposits));
router.post("/", asyncHandler(createDeposit));
router.patch("/:id", asyncHandler(updateDeposit));
router.delete("/:id", asyncHandler(deleteDeposit));

export default router;
