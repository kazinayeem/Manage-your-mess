"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const async_handler_1 = require("../utils/async-handler");
const super_admin_controller_1 = require("../controllers/super-admin.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use((0, async_handler_1.asyncHandler)(auth_1.authenticateUser));
router.use((0, auth_1.requireRole)("SUPER_ADMIN"));
router.get("/overview", (0, async_handler_1.asyncHandler)(super_admin_controller_1.getPlatformOverview));
exports.default = router;
//# sourceMappingURL=super-admin.routes.js.map