import { Router } from "express";
import { asyncHandler } from "../utils/async-handler";
import { getExpenses, getCategories, createExpense, approveExpense } from "../controllers/expense.controller";
import { authenticateUser } from "../middleware/auth";

const router = Router();
router.use(asyncHandler(authenticateUser));

router.get("/", asyncHandler(getExpenses));
router.get("/categories", asyncHandler(getCategories));
router.post("/", asyncHandler(createExpense));
router.patch("/:id/approve", asyncHandler(approveExpense));

export default router;
