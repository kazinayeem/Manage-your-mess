"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const async_handler_1 = require("../utils/async-handler");
const mess_controller_1 = require("../controllers/mess.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use((0, async_handler_1.asyncHandler)(auth_1.authenticateUser));
router.get("/", (0, async_handler_1.asyncHandler)(mess_controller_1.getMyMesses));
router.post("/", (0, async_handler_1.asyncHandler)(mess_controller_1.createMess));
router.post("/join", (0, async_handler_1.asyncHandler)(mess_controller_1.joinMess));
router.get("/:id", (0, async_handler_1.asyncHandler)(mess_controller_1.getMessDetails));
exports.default = router;
//# sourceMappingURL=mess.routes.js.map