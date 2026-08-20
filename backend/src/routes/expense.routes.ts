import { Router } from "express";
import { asyncHandler } from "../utils/async-handler";
import {
  getExpenses,
  getCategories,
  createExpense,
  approveExpense,
  deleteExpense,
} from "../controllers/expense.controller";
import { authenticateUser } from "../middleware/auth";

const router = Router({ mergeParams: true });

router.use(asyncHandler(authenticateUser));

router.get("/categories", asyncHandler(getCategories));
router.get("/", asyncHandler(getExpenses));
router.post("/", asyncHandler(createExpense));
router.patch("/:id/approve", asyncHandler(approveExpense));
router.delete("/:id", asyncHandler(deleteExpense));

export default router;
