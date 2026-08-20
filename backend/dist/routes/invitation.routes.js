"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const async_handler_1 = require("../utils/async-handler");
const invitation_controller_1 = require("../controllers/invitation.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public routes for token inspection and rejection
router.get("/token/:token", (0, async_handler_1.asyncHandler)(invitation_controller_1.getInvitationByToken));
router.post("/token/:token/reject", (0, async_handler_1.asyncHandler)(invitation_controller_1.rejectInvitation));
// Auth required routes
router.use((0, async_handler_1.asyncHandler)(auth_1.authenticateUser));
router.post("/token/:token/accept", (0, async_handler_1.asyncHandler)(invitation_controller_1.acceptInvitation));
router.post("/mess/:messId", (0, async_handler_1.asyncHandler)(invitation_controller_1.createInvitation));
router.get("/mess/:messId", (0, async_handler_1.asyncHandler)(invitation_controller_1.getMessInvitations));
router.delete("/:id", (0, async_handler_1.asyncHandler)(invitation_controller_1.cancelInvitation));
exports.default = router;
//# sourceMappingURL=invitation.routes.js.map