"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const async_handler_1 = require("../utils/async-handler");
const auth_1 = require("../middleware/auth");
const announcement_controller_1 = require("../controllers/announcement.controller");
const router = (0, express_1.Router)();
router.use((0, async_handler_1.asyncHandler)(auth_1.authenticateUser));
router.get("/", (0, async_handler_1.asyncHandler)(announcement_controller_1.getUserAnnouncements));
router.get("/active", (0, async_handler_1.asyncHandler)(announcement_controller_1.getActiveAnnouncementsForUser));
router.patch("/:id/read", (0, async_handler_1.asyncHandler)(announcement_controller_1.markAnnouncementRead));
exports.default = router;
//# sourceMappingURL=announcement.routes.js.map