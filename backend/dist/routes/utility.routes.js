"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const async_handler_1 = require("../utils/async-handler");
const utility_controller_1 = require("../controllers/utility.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use((0, async_handler_1.asyncHandler)(auth_1.authenticateUser));
router.get("/", (0, async_handler_1.asyncHandler)(utility_controller_1.getBills));
router.post("/", (0, async_handler_1.asyncHandler)(utility_controller_1.createBill));
exports.default = router;
//# sourceMappingURL=utility.routes.js.map