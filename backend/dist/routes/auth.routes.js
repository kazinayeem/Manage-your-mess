"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const async_handler_1 = require("../utils/async-handler");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post("/login", (0, async_handler_1.asyncHandler)(auth_controller_1.login));
router.post("/register", (0, async_handler_1.asyncHandler)(auth_controller_1.register));
router.post("/refresh", (0, async_handler_1.asyncHandler)(auth_controller_1.refreshToken));
router.get("/me", (0, async_handler_1.asyncHandler)(auth_1.authenticateUser), (0, async_handler_1.asyncHandler)(auth_controller_1.me));
router.post("/logout", (0, async_handler_1.asyncHandler)(auth_controller_1.logout));
exports.default = router;
//# sourceMappingURL=auth.routes.js.map