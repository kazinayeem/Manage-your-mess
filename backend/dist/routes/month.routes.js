"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const async_handler_1 = require("../utils/async-handler");
const month_controller_1 = require("../controllers/month.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use((0, async_handler_1.asyncHandler)(auth_1.authenticateUser));
router.get("/mess/:messId", (0, async_handler_1.asyncHandler)(month_controller_1.getMessMonths));
router.get("/mess/:messId/active", (0, async_handler_1.asyncHandler)(month_controller_1.getActiveMonth));
router.post("/mess/:messId", (0, async_handler_1.asyncHandler)(month_controller_1.startNewMonth));
router.get("/:monthId/summary", (0, async_handler_1.asyncHandler)(month_controller_1.getMonthSummary));
router.patch("/:monthId/close", (0, async_handler_1.asyncHandler)(month_controller_1.closeMonth));
exports.default = router;
//# sourceMappingURL=month.routes.js.map