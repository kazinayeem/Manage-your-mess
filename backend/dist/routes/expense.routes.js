"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const async_handler_1 = require("../utils/async-handler");
const expense_controller_1 = require("../controllers/expense.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)({ mergeParams: true });
router.use((0, async_handler_1.asyncHandler)(auth_1.authenticateUser));
router.get("/categories", (0, async_handler_1.asyncHandler)(expense_controller_1.getCategories));
router.get("/", (0, async_handler_1.asyncHandler)(expense_controller_1.getExpenses));
router.post("/", (0, async_handler_1.asyncHandler)(expense_controller_1.createExpense));
router.patch("/:id/approve", (0, async_handler_1.asyncHandler)(expense_controller_1.approveExpense));
router.delete("/:id", (0, async_handler_1.asyncHandler)(expense_controller_1.deleteExpense));
exports.default = router;
//# sourceMappingURL=expense.routes.js.map