"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const async_handler_1 = require("../utils/async-handler");
const notification_controller_1 = require("../controllers/notification.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use((0, async_handler_1.asyncHandler)(auth_1.authenticateUser));
router.get("/", (0, async_handler_1.asyncHandler)(notification_controller_1.getNotifications));
router.patch("/:id/read", (0, async_handler_1.asyncHandler)(notification_controller_1.markAsRead));
exports.default = router;
//# sourceMappingURL=notification.routes.js.map