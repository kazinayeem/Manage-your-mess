import { Router } from "express";
import { asyncHandler } from "../utils/async-handler";
import { getMeals, getTodayMeal, addOrUpdateMealEntry } from "../controllers/meal.controller";
import { authenticateUser } from "../middleware/auth";

const router = Router();
router.use(asyncHandler(authenticateUser));

router.get("/", asyncHandler(getMeals));
router.get("/today", asyncHandler(getTodayMeal));
router.post("/entry", asyncHandler(addOrUpdateMealEntry));

export default router;
