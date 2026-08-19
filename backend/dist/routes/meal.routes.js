"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const async_handler_1 = require("../utils/async-handler");
const meal_controller_1 = require("../controllers/meal.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use((0, async_handler_1.asyncHandler)(auth_1.authenticateUser));
router.get("/", (0, async_handler_1.asyncHandler)(meal_controller_1.getMeals));
router.get("/today", (0, async_handler_1.asyncHandler)(meal_controller_1.getTodayMeal));
router.post("/entry", (0, async_handler_1.asyncHandler)(meal_controller_1.addOrUpdateMealEntry));
exports.default = router;
//# sourceMappingURL=meal.routes.js.map