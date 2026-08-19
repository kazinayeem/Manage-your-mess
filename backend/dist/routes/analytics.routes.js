"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const async_handler_1 = require("../utils/async-handler");
const analytics_controller_1 = require("../controllers/analytics.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use((0, async_handler_1.asyncHandler)(auth_1.authenticateUser));
router.get("/dashboard", (0, async_handler_1.asyncHandler)(analytics_controller_1.getDashboardAnalytics));
router.get("/expense-trend", (0, async_handler_1.asyncHandler)(analytics_controller_1.getExpenseTrend));
exports.default = router;
//# sourceMappingURL=analytics.routes.js.map