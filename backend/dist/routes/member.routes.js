"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const async_handler_1 = require("../utils/async-handler");
const member_controller_1 = require("../controllers/member.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use((0, async_handler_1.asyncHandler)(auth_1.authenticateUser));
router.get("/", (0, async_handler_1.asyncHandler)(member_controller_1.getMembers));
router.get("/:id", (0, async_handler_1.asyncHandler)(member_controller_1.getMemberById));
router.patch("/:id/status", (0, async_handler_1.asyncHandler)(member_controller_1.updateMemberStatus));
exports.default = router;
//# sourceMappingURL=member.routes.js.map