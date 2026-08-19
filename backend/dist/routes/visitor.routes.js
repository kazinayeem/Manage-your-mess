"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const async_handler_1 = require("../utils/async-handler");
const visitor_controller_1 = require("../controllers/visitor.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use((0, async_handler_1.asyncHandler)(auth_1.authenticateUser));
router.get("/", (0, async_handler_1.asyncHandler)(visitor_controller_1.getVisitors));
router.post("/", (0, async_handler_1.asyncHandler)(visitor_controller_1.createVisitor));
exports.default = router;
//# sourceMappingURL=visitor.routes.js.map