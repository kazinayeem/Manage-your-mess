import { Router } from "express";
import { asyncHandler } from "../utils/async-handler";
import {
  getMeals,
  getTodayMeal,
  addBulkMealEntries,
} from "../controllers/meal.controller";
import { authenticateUser } from "../middleware/auth";

const router = Router({ mergeParams: true });

router.use(asyncHandler(authenticateUser));

router.get("/", asyncHandler(getMeals));
router.get("/today", asyncHandler(getTodayMeal));
router.post("/", asyncHandler(addBulkMealEntries));

export default router;
