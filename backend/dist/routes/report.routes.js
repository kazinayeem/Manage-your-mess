"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const async_handler_1 = require("../utils/async-handler");
const auth_1 = require("../middleware/auth");
const report_controller_1 = require("../controllers/report.controller");
const router = (0, express_1.Router)();
router.use((0, async_handler_1.asyncHandler)(auth_1.authenticateUser));
router.get("/months", (0, async_handler_1.asyncHandler)(report_controller_1.getMessMonthsForReports));
router.get("/data", (0, async_handler_1.asyncHandler)(report_controller_1.fetchReportData));
exports.default = router;
//# sourceMappingURL=report.routes.js.map